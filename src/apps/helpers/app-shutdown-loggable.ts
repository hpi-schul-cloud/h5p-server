import { Loggable, LogMessage } from '@infra/logger';

export class AppShutdownLoggable implements Loggable {
	constructor(private readonly reason: string) {}

	public getLogMessage(): LogMessage {
		return {
			message: 'Initiating graceful shutdown...',
			data: {
				reason: this.reason,
			},
		};
	}
}
