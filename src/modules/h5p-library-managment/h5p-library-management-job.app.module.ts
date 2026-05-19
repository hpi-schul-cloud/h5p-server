import { ConfigurationModule } from '@infra/configuration';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { LoggerModule } from '@infra/logger';
import { H5PEditorModule } from '@modules/h5p-core';
import { ENTITIES } from '@modules/h5p-core/h5p-editor.entity.exports';
import { Module } from '@nestjs/common';
import { H5PLibraryManagementService } from './domain/service';
import { H5P_LIBRARY_MANAGEMENT_CONFIG_TOKEN, H5PLibraryManagementConfig } from './h5p-library-managment.config';

@Module({
	imports: [
		ConfigurationModule.register(H5P_LIBRARY_MANAGEMENT_CONFIG_TOKEN, H5PLibraryManagementConfig),
		LoggerModule,
		H5PEditorModule,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
		}),
	],
	providers: [H5PLibraryManagementService],
	exports: [H5PLibraryManagementService],
})
export class H5PLibraryManagementJobModule {}
