import { ConfigProperty, Configuration } from '@infra/configuration';
import { InternalRabbitMQExchangeConfig, RabbitMQExchangeType } from '@infra/rabbitmq';
import { IsString } from 'class-validator';

export const H5P_EXCHANGE_CONFIG_TOKEN = 'H5P_EXCHANGE_CONFIG_TOKEN';

@Configuration()
export class H5pExchangeConfig implements InternalRabbitMQExchangeConfig {
	@ConfigProperty('H5P_EXCHANGE_NAME')
	@IsString()
	exchangeName = 'h5p-editor';

	@IsString()
	exchangeType = RabbitMQExchangeType.DIRECT;
}
