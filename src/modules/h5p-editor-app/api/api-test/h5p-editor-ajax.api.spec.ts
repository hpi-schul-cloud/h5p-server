import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { MeResponse } from '@infra/authorization-client/authorization-api-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { AjaxErrorResponse, H5PAjaxEndpoint, H5pError } from '@lumieducation/h5p-server';
import { EntityManager } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/database';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { TestApiClient } from '@testing/test-api-client';
import {
	H5P_EDITOR_INCOMING_REQUEST_TIMEOUT_MS_KEY,
	H5P_SERVER_APP_REQUEST_TIMEOUT_CONFIG_TOKEN,
	RequestTimeoutConfig,
} from '../../h5p-editor-app.config';
import { H5PEditorTestModule } from '../../h5p-editor-test.module';
import {
	H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN,
	H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN,
} from '@modules/h5p-content-management';

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let ajaxEndpoint: DeepMocked<H5PAjaxEndpoint>;
	let authorizationClientAdapter: DeepMocked<AuthorizationClientAdapter>;
	let requestTimeoutConfig: RequestTimeoutConfig;

	const baseRoute = '/h5p-editor';

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [H5PEditorTestModule],
		})
			.overrideProvider(H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5PAjaxEndpoint)
			.useValue(createMock<H5PAjaxEndpoint>())
			.overrideProvider(AuthorizationClientAdapter)
			.useValue(createMock<AuthorizationClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		ajaxEndpoint = app.get(H5PAjaxEndpoint);
		authorizationClientAdapter = app.get(AuthorizationClientAdapter);
		requestTimeoutConfig = app.get(H5P_SERVER_APP_REQUEST_TIMEOUT_CONFIG_TOKEN);
	});

	afterEach(async () => {
		jest.resetAllMocks();
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when calling AJAX GET', () => {
		describe('when user not exists', () => {
			it('should respond with unauthorized exception', async () => {
				const response = await TestApiClient.createUnauthenticated(app, baseRoute).get('ajax');

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual(new AjaxErrorResponse('', 401, 'UnauthorizedException', 'Unauthorized'));
			});
		});

		describe('when user is logged in', () => {
			const setup = () => {
				const studentUser = currentUserFactory.withRoleStudent().build();
				const loggedInClient = TestApiClient.createWithJwt(app, baseRoute, studentUser);

				const dummyResponse = {
					apiVersion: { major: 1, minor: 1 },
					details: [],
					libraries: [],
					outdated: false,
					recentlyUsed: [],
					user: 'DummyUser',
				};

				ajaxEndpoint.getAjax.mockResolvedValueOnce(dummyResponse);
				authorizationClientAdapter.getUser.mockResolvedValueOnce({ language: 'de' } as MeResponse);

				return { loggedInClient, studentUser, dummyResponse };
			};

			it('should call H5PAjaxEndpoint', async () => {
				const { loggedInClient, studentUser, dummyResponse } = setup();
				const response = await loggedInClient.get(`ajax?action=content-type-cache`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual(dummyResponse);
				expect(ajaxEndpoint.getAjax).toHaveBeenCalledWith(
					'content-type-cache',
					undefined, // MachineName
					undefined, // MajorVersion
					undefined, // MinorVersion
					'de', // Language
					expect.objectContaining({ id: studentUser.userId })
				);
			});
		});

		describe('when an error is thrown', () => {
			const setup = () => {
				const teacherUser = currentUserFactory.withRoleTeacher().build();

				const loggedInClient = TestApiClient.createWithJwt(app, baseRoute, teacherUser);

				const exception = new H5pError('error-id');
				exception.httpStatusCode = 500;
				exception.clientErrorId = 'get-ajax-client-error-id';
				exception.name = 'get-ajax-error-title';
				exception.message = 'get-ajax-error-description';

				ajaxEndpoint.getAjax.mockRejectedValueOnce(exception);
				authorizationClientAdapter.getUser.mockResolvedValueOnce({ language: 'de' } as MeResponse);

				return { loggedInClient, teacherUser, exception };
			};

			it('should return an AjaxErrorResponse with correct error status code', async () => {
				const { loggedInClient, exception } = setup();

				const response = await loggedInClient.get(`ajax?action=content-type-cache`);

				expect(response.status).toEqual(exception.httpStatusCode);
				expect(response.body).toEqual(
					new AjaxErrorResponse(
						exception.clientErrorId ?? '',
						exception.httpStatusCode,
						exception.name,
						exception.message
					)
				);
			});
		});
	});

	describe('when calling AJAX POST', () => {
		describe('when user not exists', () => {
			it('should respond with unauthorized exception', async () => {
				const response = await TestApiClient.createUnauthenticated(app, baseRoute).post('ajax');

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual(new AjaxErrorResponse('', 401, 'UnauthorizedException', 'Unauthorized'));
			});
		});

		describe('when user is logged in', () => {
			const setup = () => {
				const studentUser = currentUserFactory.withRoleStudent().build();

				const loggedInClient = TestApiClient.createWithJwt(app, baseRoute, studentUser);

				const dummyResponse = [
					{
						majorVersion: 1,
						minorVersion: 2,
						metadataSettings: {},
						name: 'Dummy Library',
						restricted: false,
						runnable: true,
						title: 'Dummy Library',
						tutorialUrl: '',
						uberName: 'dummyLibrary-1.1',
					},
				];

				const dummyBody = { contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' };

				ajaxEndpoint.postAjax.mockResolvedValueOnce(dummyResponse);
				authorizationClientAdapter.getUser.mockResolvedValueOnce({ language: 'de' } as MeResponse);

				return { loggedInClient, studentUser, dummyResponse, dummyBody };
			};

			it('should call H5PAjaxEndpoint', async () => {
				const { loggedInClient, studentUser, dummyResponse, dummyBody } = await setup();

				const response = await loggedInClient.post(`ajax?action=libraries`, dummyBody);

				expect(response.statusCode).toEqual(HttpStatus.CREATED);
				expect(response.body).toEqual(dummyResponse);
				expect(ajaxEndpoint.postAjax).toHaveBeenCalledWith(
					'libraries',
					dummyBody,
					'de',
					expect.objectContaining({ id: studentUser.userId }),
					undefined,
					undefined,
					undefined,
					undefined
				);
			});
		});

		describe('when request takes longer than configured timeout', () => {
			const setup = () => {
				requestTimeoutConfig[H5P_EDITOR_INCOMING_REQUEST_TIMEOUT_MS_KEY] = 1;

				const studentUser = currentUserFactory.withRoleStudent().build();

				const loggedInClient = TestApiClient.createWithJwt(app, baseRoute, studentUser);

				const dummyBody = { contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' };

				// Mock to delay longer than the 1ms timeout
				ajaxEndpoint.postAjax.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve([]), 100)));
				authorizationClientAdapter.getUser.mockResolvedValueOnce({ language: 'de' } as MeResponse);

				return { loggedInClient, dummyBody };
			};

			it('should return an AjaxErrorResponse with a 408 Request Timeout status code', async () => {
				const { loggedInClient, dummyBody } = setup();

				const response = await loggedInClient.post(`ajax?action=libraries`, dummyBody);

				expect(response.status).toEqual(HttpStatus.REQUEST_TIMEOUT);
			});
		});

		describe('when an error is thrown', () => {
			const setup = () => {
				const teacherUser = currentUserFactory.withRoleTeacher().build();

				const loggedInClient = TestApiClient.createWithJwt(app, baseRoute, teacherUser);

				const exception = new H5pError('error-id');
				exception.httpStatusCode = 404;
				exception.clientErrorId = 'post-ajax-client-error-id';
				exception.name = 'post-ajax-error-title';
				exception.message = 'post-ajax-error-description';

				ajaxEndpoint.getAjax.mockRejectedValueOnce(exception);
				authorizationClientAdapter.getUser.mockResolvedValueOnce({ language: 'de' } as MeResponse);

				return { loggedInClient, teacherUser, exception };
			};

			it('should return an AjaxErrorResponse with the correct error status code', async () => {
				const { loggedInClient, exception } = await setup();

				const response = await loggedInClient.get(`ajax?action=content-type-cache`);

				expect(response.status).toEqual(exception.httpStatusCode);
				expect(response.body).toEqual(
					new AjaxErrorResponse(
						exception.clientErrorId ?? '',
						exception.httpStatusCode,
						exception.name,
						exception.message
					)
				);
			});
		});
	});
});
