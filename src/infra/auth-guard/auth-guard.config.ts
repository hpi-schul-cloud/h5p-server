import { ConfigProperty, Configuration } from '@infra/configuration';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { Algorithm } from 'jsonwebtoken';

export const AUTH_GUARD_CONFIG_TOKEN = 'AUTH_GUARD_CONFIG_TOKEN';

@Configuration()
export class AuthGuardConfig {
	@IsString()
	@Transform(({ value }) => value.replace(/\\n/g, '\n'))
	@ConfigProperty('JWT_PUBLIC_KEY')
	jwtPublicKey!: string;

	@IsString()
	@ConfigProperty('JWT_SIGNING_ALGORITHM')
	jwtSigningAlgorithm: Algorithm = 'RS256';

	@IsString()
	@ConfigProperty('JWT_DOMAIN')
	jwtDomain = 'localhost';
}
