import { Loggable, LogMessage } from '@infra/logger';

export class H5PUcLoggable implements Loggable {
	constructor(private readonly message: string) {}

	// istanbul ignore next
	public getLogMessage(): LogMessage {
		const logMessage = {
			message: this.message,
		};

		return logMessage;
	}
}
