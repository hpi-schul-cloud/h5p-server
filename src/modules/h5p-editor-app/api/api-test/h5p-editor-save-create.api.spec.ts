import { createMock, DeepMocked } from '@golevelup/ts-jest/lib/mocks';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { H5PEditor, IContentMetadata } from '@lumieducation/h5p-server';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import {
	H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN,
	H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN,
	H5PContentParentType,
} from '@modules/h5p-core';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/database';
import { TestApiClient } from '@testing/test-api-client';
import {
	H5P_EDITOR_INCOMING_REQUEST_TIMEOUT_MS_KEY,
	H5P_SERVER_APP_REQUEST_TIMEOUT_CONFIG_TOKEN,
	RequestTimeoutConfig,
} from '../../h5p-editor-app.config';
import { H5PEditorTestModule } from '../../h5p-editor-test.module';
import { PostH5PContentCreateParams } from '../dto';

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let h5pEditor: DeepMocked<H5PEditor>;
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
			.overrideProvider(H5PEditor)
			.useValue(createMock<H5PEditor>())
			.overrideProvider(AuthorizationClientAdapter)
			.useValue(createMock<AuthorizationClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		h5pEditor = module.get(H5PEditor);
		em = module.get(EntityManager);
		requestTimeoutConfig = app.get(H5P_SERVER_APP_REQUEST_TIMEOUT_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		jest.resetAllMocks();
		await cleanupCollections(em);
	});

	describe('create h5p content', () => {
		describe('with valid request params', () => {
			const setup = () => {
				const id = '0000000';
				const metadata: IContentMetadata = {
					embedTypes: [],
					language: 'de',
					mainLibrary: 'mainLib',
					preloadedDependencies: [],
					defaultLanguage: '',
					license: '',
					title: '123',
				};
				const params: PostH5PContentCreateParams = {
					parentType: H5PContentParentType.BoardElement,
					parentId: new ObjectId().toString(),
					params: {
						params: undefined,
						metadata: {
							embedTypes: [],
							language: '',
							mainLibrary: '',
							preloadedDependencies: [],
							defaultLanguage: '',
							license: '',
							title: '',
						},
					},
					library: '123',
				};

				const loggedInClient = TestApiClient.createWithJwt(app, baseRoute);

				const result1 = { id, metadata };
				h5pEditor.saveOrUpdateContentReturnMetaData.mockResolvedValueOnce(result1);

				return { id, metadata, loggedInClient, params };
			};

			it('should return CREATED status', async () => {
				const { loggedInClient, params } = setup();

				const response = await loggedInClient.post(`/edit`, params);

				expect(response.status).toEqual(HttpStatus.CREATED);
			});
		});

		describe('when request takes longer than configured timeout', () => {
			const setup = () => {
				requestTimeoutConfig[H5P_EDITOR_INCOMING_REQUEST_TIMEOUT_MS_KEY] = 1;

				const params: PostH5PContentCreateParams = {
					parentType: H5PContentParentType.BoardElement,
					parentId: new ObjectId().toString(),
					params: {
						params: undefined,
						metadata: {
							embedTypes: [],
							language: '',
							mainLibrary: '',
							preloadedDependencies: [],
							defaultLanguage: '',
							license: '',
							title: '',
						},
					},
					library: '123',
				};

				const loggedInClient = TestApiClient.createWithJwt(app, baseRoute);

				// Mock to delay longer than the 1ms timeout
				h5pEditor.saveOrUpdateContentReturnMetaData.mockImplementation(
					() =>
						new Promise((resolve) => setTimeout(() => resolve({ id: '123', metadata: {} as IContentMetadata }), 100))
				);

				return { loggedInClient, params };
			};

			it('should return REQUEST_TIMEOUT status', async () => {
				const { loggedInClient, params } = setup();

				const response = await loggedInClient.post(`/edit`, params);

				expect(response.status).toEqual(HttpStatus.REQUEST_TIMEOUT);
			});
		});
	});

	describe('save h5p content', () => {
		describe('when request params are valid', () => {
			const setup = () => {
				const contentId = new ObjectId(0);
				const id = '0000000';
				const metadata: IContentMetadata = {
					embedTypes: [],
					language: 'de',
					mainLibrary: 'mainLib',
					preloadedDependencies: [],
					defaultLanguage: '',
					license: '',
					title: '123',
				};
				const params: PostH5PContentCreateParams = {
					parentType: H5PContentParentType.BoardElement,
					parentId: new ObjectId().toString(),
					params: {
						params: undefined,
						metadata: {
							embedTypes: [],
							language: '',
							mainLibrary: '',
							preloadedDependencies: [],
							defaultLanguage: '',
							license: '',
							title: '',
						},
					},
					library: '123',
				};

				const loggedInClient = TestApiClient.createWithJwt(app, baseRoute);

				const result1 = { id, metadata };
				h5pEditor.saveOrUpdateContentReturnMetaData.mockResolvedValueOnce(result1);

				return { contentId, id, metadata, loggedInClient, params };
			};

			it('should return CREATED status', async () => {
				const { contentId, loggedInClient, params } = setup();

				const response = await loggedInClient.post(`/edit/${contentId.toString()}`, params);

				expect(response.status).toEqual(HttpStatus.CREATED);
			});
		});

		describe('when id is not mongo id', () => {
			const setup = () => {
				const params: PostH5PContentCreateParams = {
					parentType: H5PContentParentType.BoardElement,
					parentId: new ObjectId().toString(),
					params: {
						params: undefined,
						metadata: {
							embedTypes: [],
							language: '',
							mainLibrary: '',
							preloadedDependencies: [],
							defaultLanguage: '',
							license: '',
							title: '',
						},
					},
					library: '123',
				};

				const loggedInClient = TestApiClient.createWithJwt(app, baseRoute);

				return { loggedInClient, params };
			};

			it('should return BAD_REQUEST status', async () => {
				const { loggedInClient, params } = setup();

				const response = await loggedInClient.post(`/edit/123`, params);

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
			});
		});
	});
});
