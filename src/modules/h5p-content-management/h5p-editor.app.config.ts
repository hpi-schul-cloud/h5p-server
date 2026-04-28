import { ConfigProperty, Configuration } from '@infra/configuration';
import { TimeoutInterceptorConfig } from '@infra/core/interceptor';
import { StringToNumber } from '@shared/transformer';
import { IsNumber } from 'class-validator';

export const H5P_SERVER_APP_REQUEST_TIMEOUT_CONFIG_TOKEN = 'H5P_SERVER_APP_REQUEST_TIMEOUT_CONFIG_TOKEN';

export const H5P_EDITOR_INCOMING_REQUEST_TIMEOUT_POST_AJAX_KEY = 'h5pEditorIncomingRequestTimeoutPostAjax';

@Configuration()
export class RequestTimeoutConfig implements TimeoutInterceptorConfig {
	[key: string]: number;

	@IsNumber()
	@StringToNumber()
	@ConfigProperty('CORE_INCOMING_REQUEST_TIMEOUT_MS')
	coreIncomingRequestTimeoutMs!: number;

	@ConfigProperty('H5P_EDITOR__INCOMING_REQUEST_TIMEOUT_POST_AJAX')
	@IsNumber()
	@StringToNumber()
	[H5P_EDITOR_INCOMING_REQUEST_TIMEOUT_POST_AJAX_KEY] = 600000;
}
