/* istanbul ignore file */
import { Logger } from '@infra/logger';
import { H5PConsumerModule } from '@modules/h5p-consumer-app/h5p-consumer.app.module';
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';
import { AppStartLoggable } from './helpers';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestApp = await NestFactory.create(H5PConsumerModule);

	const logger = await nestApp.resolve(Logger);
	logger.setContext('H5P_CONSUMER_APP');

	await nestApp.init();

	const appStartLoggable = new AppStartLoggable({ appName: 'H5P Editor AMQP Consumer' });
	logger.info(appStartLoggable);
}

void bootstrap();
