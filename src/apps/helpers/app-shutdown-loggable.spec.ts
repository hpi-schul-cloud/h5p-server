import { AppShutdownLoggable } from './app-shutdown-loggable';

describe('AppShutdownLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const reason = 'AMQP connection loss';
			const loggable = new AppShutdownLoggable(reason);

			return { reason, loggable };
		};

		it('should return the correct message', () => {
			const { loggable } = setup();

			const result = loggable.getLogMessage();

			expect(result.message).toBe('Initiating graceful shutdown...');
		});

		it('should return the reason in data', () => {
			const { reason, loggable } = setup();

			const result = loggable.getLogMessage();

			expect(result.data).toEqual({
				reason,
			});
		});
	});
});
