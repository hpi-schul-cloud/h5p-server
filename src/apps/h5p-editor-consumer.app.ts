/* istanbul ignore file */
import { Logger } from '@infra/logger';
import { H5PConsumerModule } from '@modules/h5p-consumer-app/h5p-consumer.app.module';
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';
import { AppStartLoggable } from './helpers';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestApp = await NestFactory.create(H5PConsumerModule);
	await nestApp.init();

	const logger = await nestApp.resolve(Logger);
	const appStartLoggable = new AppStartLoggable({ appName: 'H5P Editor AMQP Consumer' });
	logger.setContext('H5P_CONSUMER_APP');
	logger.info(appStartLoggable);
}
void bootstrap();
