import { ErrorLogMessage, Loggable } from '@infra/logger';
import { UnprocessableEntityException } from '@nestjs/common';
import { CopyContentParams, H5pEditorEvents } from '../interface';

export class H5pEditorExchangeInvalidParamsLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(
		private readonly exchangeEvent: H5pEditorEvents,
		private readonly params: CopyContentParams
	) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		return {
			type: 'H5P_EDITOR_EXCHANGE_INVALID_PARAMS',
			stack: this.stack,
			data: {
				exchangeEvent: this.exchangeEvent.valueOf(),
				params: JSON.stringify(this.params),
			},
		};
	}
}
