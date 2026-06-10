import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ErrorLoggable } from '@infra/error/loggable';
import { Logger } from '@infra/logger';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { AmqpConnectionLostLoggable } from './loggable';

export type ShutdownCallback = (exitCode: number) => void | Promise<void>;

const noopShutdown: ShutdownCallback = () => undefined;

@Injectable()
export class AmqpConnectionGuard implements OnModuleInit {
	private shutdownCallback: ShutdownCallback = noopShutdown;

	constructor(
		private readonly amqpConnection: AmqpConnection,
		private readonly logger: Logger
	) {
		this.logger.setContext(AmqpConnectionGuard.name);
	}

	public setShutdownCallback(callback: ShutdownCallback): void {
		this.shutdownCallback = callback;
	}

	public onModuleInit(): void {
		this.setupConnectionListeners();
	}

	private setupConnectionListeners(): void {
		const connectionManager = this.amqpConnection.managedConnection;

		connectionManager.on('disconnect', (event: { err?: Error }) => {
			const error = event.err ?? new Error('Unknown disconnect error');
			this.handleConnectionLost(error);
		});

		connectionManager.on('connectFailed', (event: { err?: Error }) => {
			const error = event.err ?? new Error('Failed to connect to AMQP server');
			this.handleConnectionLost(error);
		});
	}

	private handleConnectionLost(error: Error): void {
		this.logger.warning(new AmqpConnectionLostLoggable(error));
		this.invokeShutdownCallback(1);
	}

	private invokeShutdownCallback(exitCode: number): void {
		// Swap to noop before invoking to ensure idempotency - if multiple
		// disconnect/connectFailed events fire, only the first invokes the callback
		const callback = this.shutdownCallback;
		this.shutdownCallback = noopShutdown;

		try {
			const result = callback(exitCode);
			if (result instanceof Promise) {
				result.catch((err: unknown) => {
					this.logger.warning(new ErrorLoggable(err, { msg: 'Shutdown callback rejected' }));
				});
			}
		} catch (err) {
			this.logger.warning(new ErrorLoggable(err, { msg: 'Shutdown callback threw' }));
		}
	}
}
