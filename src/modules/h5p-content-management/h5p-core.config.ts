import { ConfigProperty, Configuration } from '@infra/configuration';
import { LanguageType } from '@modules/h5p-content-management/types/language-type.enum';
import { CommaSeparatedStringToArray, StringToNumber } from '@shared/transformer';
import { IsEnum, IsNumber } from 'class-validator';

export const H5P_CORE_CONFIG_TOKEN = 'H5P_CORE_CONFIG_TOKEN';

@Configuration()
export class H5PCoreConfig {
	@ConfigProperty('H5P_EDITOR__MAX_FILE_SIZE_IN_BYTES')
	@IsNumber()
	@StringToNumber()
	maxFileSize = 1024 * 1024 * 1024; // 1 GB

	@ConfigProperty('H5P_EDITOR__MAX_TOTAL_SIZE_IN_BYTES')
	@IsNumber()
	@StringToNumber()
	maxTotalSize = 1024 * 1024 * 1024; // 1 GB

	@ConfigProperty('I18N__AVAILABLE_LANGUAGES')
	@CommaSeparatedStringToArray()
	@IsEnum(LanguageType, { each: true })
	availableLanguages = [LanguageType.DE, LanguageType.EN, LanguageType.ES, LanguageType.UK];
}
