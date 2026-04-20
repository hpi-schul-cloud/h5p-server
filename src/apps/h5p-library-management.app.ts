/* istanbul ignore file */
/* eslint-disable no-console */
import { Logger } from '@infra/logger/logger';
import { H5PLibraryManagementJobModule, H5PLibraryManagementService } from '@modules/h5p-content-management';
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';
import { AppStartLoggable } from './helpers';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestApp = await NestFactory.createApplicationContext(H5PLibraryManagementJobModule);

	await nestApp.init();

	const logger = await nestApp.resolve(Logger);
	const appStartLoggable = new AppStartLoggable({ appName: 'Start H5P Library Management' });
	logger.setContext('H5P_LIBRARY_MANAGEMENT_APP');
	logger.info(appStartLoggable);

	// to execute it on this place for the ORM the allowGlobalContext: true must be set, but to executed in this way is a hack
	await nestApp.get(H5PLibraryManagementService).run();

	const appCloseLoggable = new AppStartLoggable({ appName: 'Close H5P Library Management' });
	logger.info(appCloseLoggable);
	await nestApp.close();
	process.exit(0);
}
void bootstrap();
