/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { registerAmqpSubscriber } from './amqp-subscriber.helper';
export { ErrorMapper } from './error.mapper';
export {
	InternalRabbitMQConfig,
	InternalRabbitMQExchangeConfig,
	RabbitMQExchangeType,
	RabbitMQModuleOptions,
} from './rabbitmq-module.options';
export { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig } from './rabbitmq.config';
export { RabbitMQWrapperModule } from './rabbitmq.module';
export { RpcError, RpcMessage } from './rpc-message';
export { RpcMessageProducer } from './rpc-message-producer';
