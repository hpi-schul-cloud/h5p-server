import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from './logging.interface';

export interface Loggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage;
}
