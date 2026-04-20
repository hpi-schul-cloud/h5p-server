/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { Logger, LOGGER_CONFIG_TOKEN } from '@infra/logger';
import { H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig } from '@modules/h5p-content-management';
import { H5PEditorAppModule } from '@modules/h5p-content-management/h5p-editor.app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppStartLoggable, createRequestLoggerMiddleware, enableOpenApiDocs } from './helpers';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestApp = await NestFactory.create<NestExpressApplication>(H5PEditorAppModule);

	const config = nestApp.get(LOGGER_CONFIG_TOKEN);

	nestApp.use(createRequestLoggerMiddleware(config.loggerGlobalRequestLoggingEnabled));

	// customize nest app settings
	nestApp.enableCors({ exposedHeaders: ['Content-Disposition'] });
	const h5pEditorConfig = await nestApp.resolve<H5PEditorConfig>(H5P_EDITOR_CONFIG_TOKEN);
	const { bodyParserJsonLimitInBytes } = h5pEditorConfig;
	nestApp.useBodyParser('json', { limit: bodyParserJsonLimitInBytes });

	enableOpenApiDocs(nestApp, 'api/v3/h5p/docs');

	const port = 4448;
	const basePath = '/api/v3';

	await nestApp.init();

	const appServer = await nestApp.listen(port, async () => {
		const logger = await nestApp.resolve(Logger);
		const appStartLoggable = new AppStartLoggable({ appName: 'H5P Editor Server', port, basePath });
		logger.setContext('H5P_EDITOR_APP');
		logger.info(appStartLoggable);
	});

	appServer.requestTimeout = 0;
}

void bootstrap();
