import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ErrorLoggable } from '@infra/error/loggable';
import { Logger } from '@infra/logger';
import { Test, TestingModule } from '@nestjs/testing';
import { AmqpConnectionGuard, ShutdownCallback } from './amqp-connection-guard.service';
import { AmqpConnectionLostLoggable } from './loggable';

describe('AmqpConnectionGuard', () => {
	let module: TestingModule;
	let guard: AmqpConnectionGuard;
	let amqpConnection: DeepMocked<AmqpConnection>;
	let logger: DeepMocked<Logger>;

	const createMockManagedConnection = () => {
		const listeners = new Map<string, ((...args: unknown[]) => void)[]>();

		return {
			on: jest.fn((event: string, callback: (...args: unknown[]) => void) => {
				const eventListeners = listeners.get(event) ?? [];
				eventListeners.push(callback);
				listeners.set(event, eventListeners);
			}),
			emit: (event: string, ...args: unknown[]) => {
				const eventListeners = listeners.get(event) ?? [];
				eventListeners.forEach((cb) => cb(...args));
			},
		};
	};

	let mockManagedConnection: ReturnType<typeof createMockManagedConnection>;

	beforeEach(async () => {
		mockManagedConnection = createMockManagedConnection();

		amqpConnection = createMock<AmqpConnection>({
			managedConnection: mockManagedConnection,
		});

		module = await Test.createTestingModule({
			providers: [
				AmqpConnectionGuard,
				{
					provide: AmqpConnection,
					useValue: amqpConnection,
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		guard = module.get(AmqpConnectionGuard);
		logger = module.get(Logger);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(guard).toBeDefined();
	});

	describe('onModuleInit', () => {
		it('should set up disconnect listener', () => {
			guard.onModuleInit();

			expect(mockManagedConnection.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
		});

		it('should set up connectFailed listener', () => {
			guard.onModuleInit();

			expect(mockManagedConnection.on).toHaveBeenCalledWith('connectFailed', expect.any(Function));
		});
	});

	describe('when connection is lost (disconnect event)', () => {
		const setup = () => {
			const shutdownCallback: ShutdownCallback = jest.fn();
			const error = new Error('Connection lost');

			guard.setShutdownCallback(shutdownCallback);
			guard.onModuleInit();

			return { shutdownCallback, error };
		};

		it('should log the error', () => {
			const { error } = setup();

			mockManagedConnection.emit('disconnect', { err: error });

			expect(logger.warning).toHaveBeenCalledWith(expect.any(AmqpConnectionLostLoggable));
		});

		it('should call the shutdown callback with exit code 1', () => {
			const { shutdownCallback, error } = setup();

			mockManagedConnection.emit('disconnect', { err: error });

			expect(shutdownCallback).toHaveBeenCalledWith(1);
		});

		describe('when error is undefined', () => {
			it('should use a default error message', () => {
				const { shutdownCallback } = setup();

				mockManagedConnection.emit('disconnect', {});

				expect(logger.warning).toHaveBeenCalledWith(expect.any(AmqpConnectionLostLoggable));
				expect(shutdownCallback).toHaveBeenCalledWith(1);
			});
		});
	});

	describe('when connection fails (connectFailed event)', () => {
		const setup = () => {
			const shutdownCallback: ShutdownCallback = jest.fn();
			const error = new Error('Failed to connect');

			guard.setShutdownCallback(shutdownCallback);
			guard.onModuleInit();

			return { shutdownCallback, error };
		};

		it('should log the error', () => {
			const { error } = setup();

			mockManagedConnection.emit('connectFailed', { err: error });

			expect(logger.warning).toHaveBeenCalledWith(expect.any(AmqpConnectionLostLoggable));
		});

		it('should call the shutdown callback with exit code 1', () => {
			const { shutdownCallback, error } = setup();

			mockManagedConnection.emit('connectFailed', { err: error });

			expect(shutdownCallback).toHaveBeenCalledWith(1);
		});
	});

	describe('setShutdownCallback', () => {
		it('should store the callback and call it when connection is lost', () => {
			const shutdownCallback: ShutdownCallback = jest.fn();

			guard.setShutdownCallback(shutdownCallback);
			guard.onModuleInit();

			mockManagedConnection.emit('disconnect', { err: new Error('Test error') });

			expect(shutdownCallback).toHaveBeenCalledWith(1);
		});
	});

	describe('when shutdown callback throws synchronously', () => {
		const setup = () => {
			const callbackError = new Error('Callback threw');
			const shutdownCallback: ShutdownCallback = () => {
				throw callbackError;
			};

			guard.setShutdownCallback(shutdownCallback);
			guard.onModuleInit();

			return { callbackError };
		};

		it('should catch the error and log it', () => {
			setup();

			mockManagedConnection.emit('disconnect', { err: new Error('Connection lost') });

			expect(logger.warning).toHaveBeenCalledTimes(2);
			expect(logger.warning).toHaveBeenNthCalledWith(1, expect.any(AmqpConnectionLostLoggable));
			expect(logger.warning).toHaveBeenNthCalledWith(2, expect.any(ErrorLoggable));
		});

		it('should not throw', () => {
			setup();

			expect(() => {
				mockManagedConnection.emit('disconnect', { err: new Error('Connection lost') });
			}).not.toThrow();
		});
	});

	describe('when shutdown callback returns a rejected promise', () => {
		const setup = () => {
			const callbackError = new Error('Callback rejected');
			const shutdownCallback: ShutdownCallback = jest.fn(() => Promise.reject(callbackError));

			guard.setShutdownCallback(shutdownCallback);
			guard.onModuleInit();

			return { shutdownCallback, callbackError };
		};

		it('should catch the rejection and log it', async () => {
			setup();

			mockManagedConnection.emit('disconnect', { err: new Error('Connection lost') });

			// Allow the promise rejection to be handled
			await Promise.resolve();

			expect(logger.warning).toHaveBeenCalledTimes(2);
			expect(logger.warning).toHaveBeenNthCalledWith(1, expect.any(AmqpConnectionLostLoggable));
			expect(logger.warning).toHaveBeenNthCalledWith(2, expect.any(ErrorLoggable));
		});
	});

	describe('when multiple connection events fire', () => {
		const setup = () => {
			const shutdownCallback: ShutdownCallback = jest.fn();

			guard.setShutdownCallback(shutdownCallback);
			guard.onModuleInit();

			return { shutdownCallback };
		};

		it('should only invoke the shutdown callback once', () => {
			const { shutdownCallback } = setup();

			mockManagedConnection.emit('disconnect', { err: new Error('First disconnect') });
			mockManagedConnection.emit('disconnect', { err: new Error('Second disconnect') });
			mockManagedConnection.emit('connectFailed', { err: new Error('Connect failed') });

			expect(shutdownCallback).toHaveBeenCalledTimes(1);
		});
	});
});
