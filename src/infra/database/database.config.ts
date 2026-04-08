import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/transformer';
import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';
import { InternalDatabaseConfig } from './interfaces';

export const DATABASE_CONFIG_TOKEN = 'DATABASE_CONFIG_TOKEN';

@Configuration()
export class DatabaseConfig implements InternalDatabaseConfig {
	@ConfigProperty('DB_URL')
	@IsUrl({ require_tld: false, require_protocol: false, protocols: ['mongodb', 'mongodb+srv'] })
	dbUrl!: string;

	@ConfigProperty('DB_USERNAME')
	@IsString()
	@IsOptional()
	dbUsername?: string;

	@ConfigProperty('DB_PASSWORD')
	@IsString()
	@IsOptional()
	dbPassword?: string;

	@ConfigProperty('DB_ENSURE_INDEXES')
	@IsBoolean()
	@StringToBoolean()
	dbEnsureIndexes = false;

	@ConfigProperty('DB_ALLOW_GLOBAL_CONTEXT')
	@IsBoolean()
	@StringToBoolean()
	dbAllowGlobalContext = true;

	@ConfigProperty('DB_DEBUG')
	@IsBoolean()
	@StringToBoolean()
	dbDebug = false;
}
