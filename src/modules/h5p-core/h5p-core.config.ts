import { ConfigProperty, Configuration } from '@infra/configuration';
import { CommaSeparatedStringToArray, StringToNumber } from '@shared/transformer';
import { IsEnum, IsNumber } from 'class-validator';
import { LanguageType } from './domain/types/language-type.enum';

export const H5P_CORE_CONFIG_TOKEN = 'H5P_CORE_CONFIG_TOKEN';

@Configuration()
export class H5PCoreConfig {
	@ConfigProperty('H5P_EDITOR__MAX_FILE_SIZE_IN_BYTES')
	@IsNumber()
	@StringToNumber()
	maxFileSize = 2.5 * 1024 * 1024 * 1024; // 2.5 GB

	@ConfigProperty('H5P_EDITOR__MAX_TOTAL_SIZE_IN_BYTES')
	@IsNumber()
	@StringToNumber()
	maxTotalSize = 2.5 * 1024 * 1024 * 1024; // 2.5 GB

	@ConfigProperty('I18N__AVAILABLE_LANGUAGES')
	@CommaSeparatedStringToArray()
	@IsEnum(LanguageType, { each: true })
	availableLanguages = [LanguageType.DE, LanguageType.EN, LanguageType.ES, LanguageType.UK];
}
