import { createMock } from '@golevelup/ts-jest/lib/mocks';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { H5PEditor } from '@lumieducation/h5p-server';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN, H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN } from '@modules/h5p-core';
import { h5pContentFactory } from '@modules/h5p-core/testing';
import { H5PEditorTestModule } from '@modules/h5p-editor-app/h5p-editor-test.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/database';
import { TestApiClient } from '@testing/test-api-client';

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	const baseRoute = '/h5p-editor';

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [H5PEditorTestModule],
		})
			.overrideProvider(H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(AuthorizationClientAdapter)
			.useValue(createMock<AuthorizationClientAdapter>())
			.overrideProvider(H5PEditor)
			.useValue(createMock<H5PEditor>())
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('delete h5p content', () => {
		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const someId = new ObjectId().toHexString();

				const response = await TestApiClient.createUnauthenticated(app, baseRoute).post(`delete/${someId}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in', () => {
			describe('when id in params is not a mongo id', () => {
				const setup = () => {
					const loggedInClient = TestApiClient.createWithJwt(app, baseRoute);

					return { loggedInClient };
				};

				it('should return 400', async () => {
					const { loggedInClient } = setup();

					const response = await loggedInClient.post(`delete/123`);

					expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
					expect(response.body).toEqual(
						expect.objectContaining({
							validationErrors: [{ errors: ['contentId must be a mongodb id'], field: ['contentId'] }],
						})
					);
				});
			});

			describe('when requested content is not found', () => {
				const setup = () => {
					const loggedInClient = TestApiClient.createWithJwt(app, baseRoute);

					return { loggedInClient };
				};

				it('should return 404', async () => {
					const { loggedInClient } = setup();
					const someId = new ObjectId().toHexString();

					const response = await loggedInClient.post(`delete/${someId}`);

					expect(response.status).toEqual(HttpStatus.NOT_FOUND);
				});
			});

			describe('when content is found', () => {
				const setup = async () => {
					const loggedInClient = TestApiClient.createWithJwt(app, baseRoute);

					const parentId = new ObjectId().toHexString();
					const h5pContent = h5pContentFactory.build({ parentId });

					await em.persist([h5pContent]).flush();
					em.clear();

					return { contentId: h5pContent.id, loggedInClient };
				};

				it('should respond with code 201', async () => {
					const { contentId, loggedInClient } = await setup();

					const response = await loggedInClient.post(`delete/${contentId}`);

					expect(response.status).toEqual(HttpStatus.CREATED);
				});
			});
		});
	});
});
