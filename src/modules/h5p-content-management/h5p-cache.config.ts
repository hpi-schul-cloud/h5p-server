import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export const H5P_CACHE_CONFIG_TOKEN = 'H5P_CACHE_CONFIG_TOKEN';

@Configuration()
export class H5PCacheConfig {
	@ConfigProperty('DB_URL')
	@IsUrl({ require_tld: false, require_protocol: false, protocols: ['mongodb', 'mongodb+srv'] })
	dbUrl!: string;

	@IsString()
	@IsOptional()
	@ConfigProperty('DB_USERNAME')
	dbUsername?: string;

	@IsString()
	@IsOptional()
	@ConfigProperty('DB_PASSWORD')
	dbPassword?: string;

	@IsString()
	@IsOptional()
	@ConfigProperty('H5P_CACHE_COLLECTION_NAME')
	dbCollectionName = 'h5p-cache';
}
