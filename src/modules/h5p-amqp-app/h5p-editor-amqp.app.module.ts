import { ConfigurationModule } from '@infra/configuration';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { LoggerModule } from '@infra/logger';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig, RabbitMQWrapperModule } from '@infra/rabbitmq';
import { H5PEditorModule } from '@modules/h5p-core';
import { ENTITIES } from '@modules/h5p-core/h5p-editor.entity.exports';
import { Module } from '@nestjs/common';
import { H5pEditorConsumer } from './controller/amqp';
import { H5P_EXCHANGE_CONFIG_TOKEN, H5pExchangeConfig } from './h5p-exchange.config';

@Module({
	imports: [
		H5PEditorModule,
		RabbitMQWrapperModule.register({
			exchangeConfigInjectionToken: H5P_EXCHANGE_CONFIG_TOKEN,
			exchangeConfigConstructor: H5pExchangeConfig,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
		}),
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
		}),
		ConfigurationModule.register(H5P_EXCHANGE_CONFIG_TOKEN, H5pExchangeConfig),
		LoggerModule,
	],
	providers: [H5pEditorConsumer],
})
export class H5PEditorAMQPModule {}
