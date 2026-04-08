import { ConfigProperty, Configuration } from '@infra/configuration';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { Algorithm } from 'jsonwebtoken';

export const TEST_JWT_CONFIG_TOKEN = 'TEST_JWT_CONFIG_TOKEN';

@Configuration()
export class TestJwtModuleConfig {
	@ConfigProperty('JWT_PRIVATE_KEY')
	@IsString()
	@Transform(({ value }: { value: string }) => value.replace(/\\n/g, '\n'))
	privateKey!: string;

	@ConfigProperty('JWT_PUBLIC_KEY')
	@IsString()
	@Transform(({ value }: { value: string }) => value.replace(/\\n/g, '\n'))
	publicKey!: string;

	@ConfigProperty('JWT_SIGNING_ALGORITHM')
	@IsString()
	algorithm: Algorithm = 'RS256';

	@ConfigProperty('JWT_LIFETIME')
	@IsString()
	expiresIn = '30d';

	@ConfigProperty('SC_DOMAIN')
	@IsString()
	scDomain!: string;
}
