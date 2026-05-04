import { JwtExtractor } from '@infra/auth-guard/utils/jwt';
import { AxiosErrorLoggable } from '@infra/error/loggable';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { isAxiosError, RawAxiosRequestConfig } from 'axios';
import { Request } from 'express';
import {
	AuthorizationApi,
	AuthorizationBodyParamsReferenceType,
	AuthorizationContextParams,
	MeApi,
	MeResponse,
} from './authorization-api-client';
import { AuthorizationErrorLoggableException, AuthorizationForbiddenLoggableException } from './error';

@Injectable()
export class AuthorizationClientAdapter {
	constructor(
		private readonly authorizationApi: AuthorizationApi,
		private readonly meApi: MeApi,
		@Inject(REQUEST) private readonly request: Request
	) {}

	public async getUser(): Promise<MeResponse> {
		try {
			const options = this.createOptionParams();
			const response = await this.meApi.meControllerMe(options);

			return response.data;
		} catch (error) {
			if (isAxiosError(error)) {
				error = new AxiosErrorLoggable(error, 'GET_USER_FAILED');
			}

			throw new InternalServerErrorException("Couldn't get user from authorization service", { cause: error });
		}
	}

	public async checkPermissionsByReference(
		referenceType: AuthorizationBodyParamsReferenceType,
		referenceId: string,
		context: AuthorizationContextParams
	): Promise<void> {
		const hasPermission = await this.hasPermissionsByReference(referenceType, referenceId, context);

		if (!hasPermission) {
			throw new AuthorizationForbiddenLoggableException({ referenceType, referenceId, context });
		}
	}

	public async hasPermissionsByReference(
		referenceType: AuthorizationBodyParamsReferenceType,
		referenceId: string,
		context: AuthorizationContextParams
	): Promise<boolean> {
		const params = {
			referenceType,
			referenceId,
			context,
		};

		try {
			const options = this.createOptionParams();

			const response = await this.authorizationApi.authorizationReferenceControllerAuthorizeByReference(
				params,
				options
			);
			const hasPermission = response.data.isAuthorized;

			return hasPermission;
		} catch (error) {
			if (isAxiosError(error)) {
				error = new AxiosErrorLoggable(error, 'AUTHORIZATION_BY_REFERENCE_FAILED');
			}
			throw new AuthorizationErrorLoggableException(error, params);
		}
	}

	private createOptionParams(): RawAxiosRequestConfig<unknown> {
		const jwt = this.getJwt();
		const options: RawAxiosRequestConfig<unknown> = { headers: { authorization: `Bearer ${jwt}` } };

		return options;
	}

	private getJwt(): string {
		return JwtExtractor.extractJwtFromRequestOrFail(this.request);
	}
}
