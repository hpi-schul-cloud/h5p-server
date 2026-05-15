/* istanbul ignore file */
import { Logger } from '@infra/logger';
import { H5PEditorAMQPModule } from '@modules/h5p-amqp-app';
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';
import { AppStartLoggable } from './helpers';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestApp = await NestFactory.create(H5PEditorAMQPModule);
	await nestApp.init();

	const logger = await nestApp.resolve(Logger);
	const appStartLoggable = new AppStartLoggable({ appName: 'H5P Editor AMQP Consumer' });
	logger.setContext('H5P_EDITOR_APP');
	logger.info(appStartLoggable);
}
void bootstrap();
