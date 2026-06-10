/* istanbul ignore file */
import { ErrorLoggable } from '@infra/error/loggable';
import { Logger } from '@infra/logger';
import { AmqpConnectionGuard } from '@infra/rabbitmq';
import { H5PConsumerModule } from '@modules/h5p-consumer-app/h5p-consumer.app.module';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';
import { AppShutdownLoggable, AppStartLoggable } from './helpers';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestApp = await NestFactory.create(H5PConsumerModule);
	await nestApp.init();

	const logger = await nestApp.resolve(Logger);
	logger.setContext('H5P_CONSUMER_APP');

	setupGracefulShutdown(nestApp, logger);

	const appStartLoggable = new AppStartLoggable({ appName: 'H5P Editor AMQP Consumer' });
	logger.info(appStartLoggable);
}

function setupGracefulShutdown(app: INestApplication, logger: Logger): void {
	const connectionGuard = app.get(AmqpConnectionGuard);

	connectionGuard.setShutdownCallback(async (exitCode: number) => {
		logger.warning(new AppShutdownLoggable('AMQP connection loss'));

		try {
			await app.close();
		} catch (error) {
			logger.warning(new ErrorLoggable(error, { msg: 'Error during graceful shutdown' }));
		}

		process.exit(exitCode);
	});
}

void bootstrap();
