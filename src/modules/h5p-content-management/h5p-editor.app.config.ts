import { ConfigProperty, Configuration } from '@infra/configuration';
import { TimeoutInterceptorConfig } from '@infra/core/interceptor';
import { StringToNumber } from '@shared/transformer';
import { IsNumber } from 'class-validator';

export const H5P_SERVER_APP_REQUEST_TIMEOUT_CONFIG_TOKEN = 'H5P_SERVER_APP_REQUEST_TIMEOUT_CONFIG_TOKEN';

export const H5P_EDITOR_INCOMING_REQUEST_TIMEOUT_MS_KEY = 'h5pEditorIncomingRequestTimeoutMs';

@Configuration()
export class RequestTimeoutConfig implements TimeoutInterceptorConfig {
	[key: string]: number;

	@IsNumber()
	@StringToNumber()
	@ConfigProperty('CORE_INCOMING_REQUEST_TIMEOUT_MS')
	coreIncomingRequestTimeoutMs!: number;

	@ConfigProperty('H5P_EDITOR_INCOMING_REQUEST_TIMEOUT_MS')
	@IsNumber()
	@StringToNumber()
	[H5P_EDITOR_INCOMING_REQUEST_TIMEOUT_MS_KEY] = 600000;
}
