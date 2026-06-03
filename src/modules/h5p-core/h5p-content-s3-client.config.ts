import { ConfigProperty, Configuration } from '@infra/configuration';
import { S3Config } from '@infra/s3-client';
import { IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';
import { StringToNumber } from '../../shared/transformer';

export const H5P_CONTENT_S3_CLIENT_CONFIG_TOKEN = 'H5P_CONTENT_S3_CLIENT_CONFIG_TOKEN';

@Configuration()
export class H5PContentS3ClientConfig implements S3Config {
	@ConfigProperty('H5P_EDITOR__S3_ENDPOINT')
	@IsUrl({ require_tld: false })
	endpoint!: string;

	@ConfigProperty('H5P_EDITOR__S3_REGION')
	@IsString()
	region!: string;

	@ConfigProperty('H5P_EDITOR__S3_BUCKET_CONTENT')
	@IsString()
	bucket!: string;

	@ConfigProperty('H5P_EDITOR__S3_ACCESS_KEY_ID')
	@IsString()
	accessKeyId!: string;

	@ConfigProperty('H5P_EDITOR__S3_SECRET_ACCESS_KEY')
	@IsString()
	secretAccessKey!: string;

	@IsOptional()
	@IsNumber()
	@StringToNumber()
	@ConfigProperty('H5P_EDITOR__S3_MAXIMUM_ATTEMPTS')
	maximumAttempts = 3;

	@IsOptional()
	@IsNumber()
	@StringToNumber()
	@ConfigProperty('H5P_EDITOR__S3_BACKOFF_DELAY_TIME_MS')
	backoffDelayTimeMs = 5000;

	@IsOptional()
	@IsNumber()
	@StringToNumber()
	@ConfigProperty('H5P_EDITOR__S3_MAX_SOCKETS')
	maxSockets = 50;
}
