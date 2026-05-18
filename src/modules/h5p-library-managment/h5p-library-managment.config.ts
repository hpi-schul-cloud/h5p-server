import { ConfigProperty, Configuration } from '@infra/configuration';
import { H5P_AVAILABLE_LIBRARIES } from '@modules/h5p-content-management/h5p-editor.const';
import { CommaSeparatedStringToArray, StringToNumber } from '@shared/transformer';
import { IsNumber, IsString } from 'class-validator';

export const H5P_LIBRARY_MANAGEMENT_CONFIG_TOKEN = 'H5P_LIBRARY_MANAGEMENT_CONFIG_TOKEN';

@Configuration()
export class H5PLibraryManagementConfig {
	@ConfigProperty('H5P_EDITOR__INSTALL_LIBRARY_LOCK_MAX_OCCUPATION_TIME')
	@StringToNumber()
	@IsNumber()
	installLibraryLockMaxOccupationTime = 600000;

	@ConfigProperty('H5P_EDITOR__LIBRARY_LIST')
	@CommaSeparatedStringToArray()
	@IsString({ each: true })
	libraryList = H5P_AVAILABLE_LIBRARIES;
}
