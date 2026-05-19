import { ConfigProperty, Configuration } from '@infra/configuration';
import { TimeoutInterceptorConfig } from '@infra/core/interceptor';
import { H5P_AVAILABLE_LIBRARIES, LanguageType } from '@modules/h5p-content-management';
import { CommaSeparatedStringToArray, StringToNumber } from '@shared/transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';

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

export const H5P_EDITOR_CONFIG_TOKEN = 'H5P_EDITOR_CONFIG_TOKEN';

@Configuration()
export class H5PEditorConfig {
	@ConfigProperty('H5P_EDITOR__BODYPARSER_JSON_LIMIT_IN_BYTES')
	@IsNumber()
	@StringToNumber()
	bodyParserJsonLimitInBytes = 4194304; // 4MB

	@ConfigProperty('H5P_EDITOR__LIBRARY_LIST')
	@CommaSeparatedStringToArray()
	@IsString({ each: true })
	libraryList = H5P_AVAILABLE_LIBRARIES;

	@ConfigProperty('I18N__AVAILABLE_LANGUAGES')
	@CommaSeparatedStringToArray()
	@IsEnum(LanguageType, { each: true })
	availableLanguages = [LanguageType.DE, LanguageType.EN, LanguageType.ES, LanguageType.UK];
}
