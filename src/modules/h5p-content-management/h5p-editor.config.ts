import { ConfigProperty, Configuration } from '@infra/configuration';
import { CommaSeparatedStringToArray, StringToNumber } from '@shared/transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { LanguageType } from './types/language-type.enum';
import { H5P_AVAILABLE_LIBRARIES } from './h5p-editor.const';

export const H5P_EDITOR_CONFIG_TOKEN = 'H5P_EDITOR_CONFIG_TOKEN';

@Configuration()
export class H5PEditorConfig {
	@ConfigProperty('H5P_EDITOR__BODYPARSER_JSON_LIMIT_IN_BYTES')
	@IsNumber()
	@StringToNumber()
	bodyParserJsonLimitInBytes = 4194304; // 4MB

	@ConfigProperty('H5P_EDITOR__MAX_FILE_SIZE_IN_BYTES')
	@IsNumber()
	@StringToNumber()
	maxFileSize = 1024 * 1024 * 1024; // 1 GB

	@ConfigProperty('H5P_EDITOR__MAX_TOTAL_SIZE_IN_BYTES')
	@IsNumber()
	@StringToNumber()
	maxTotalSize = 1024 * 1024 * 1024; // 1 GB

	@ConfigProperty('H5P_EDITOR__INSTALL_LIBRARY_LOCK_MAX_OCCUPATION_TIME')
	@StringToNumber()
	@IsNumber()
	installLibraryLockMaxOccupationTime = 600000;

	@ConfigProperty('H5P_EDITOR__LIBRARY_LIST')
	@CommaSeparatedStringToArray()
	@IsString({ each: true })
	libraryList = H5P_AVAILABLE_LIBRARIES;

	@ConfigProperty('I18N__AVAILABLE_LANGUAGES')
	@CommaSeparatedStringToArray()
	@IsEnum(LanguageType, { each: true })
	availableLanguages = [LanguageType.DE, LanguageType.EN, LanguageType.ES, LanguageType.UK];
}
