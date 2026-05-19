import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import {
	AUTHORIZATION_CLIENT_CONFIG_TOKEN,
	AuthorizationClientConfig,
	AuthorizationClientModule,
} from '@infra/authorization-client';
import { ConfigurationModule } from '@infra/configuration';
import { CoreModule } from '@infra/core';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { ErrorModule } from '@infra/error';
import { LoggerModule } from '@infra/logger';
import { H5PEditorModule } from '@modules/h5p-core';
import { ENTITIES } from '@modules/h5p-core/h5p-editor.entity.exports';
import { Module } from '@nestjs/common';
import { H5PEditorController, H5PEditorUc } from './api';
import {
	H5P_EDITOR_CONFIG_TOKEN,
	H5P_SERVER_APP_REQUEST_TIMEOUT_CONFIG_TOKEN,
	H5PEditorConfig,
	RequestTimeoutConfig,
} from './h5p-editor-app.config';

export const imports = [
	AuthorizationClientModule.register(AUTHORIZATION_CLIENT_CONFIG_TOKEN, AuthorizationClientConfig),
	CoreModule.register(H5P_SERVER_APP_REQUEST_TIMEOUT_CONFIG_TOKEN, RequestTimeoutConfig),
	ErrorModule,
	AuthGuardModule.register([AuthGuardOptions.JWT]),
	ConfigurationModule.register(H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig),
	LoggerModule,
	H5PEditorModule,
];
export const controllers = [H5PEditorController];
export const providers = [H5PEditorUc];

@Module({
	imports: [
		...imports,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
		}),
	],
	controllers,
	providers,
})
export class H5PEditorAppModule {}
