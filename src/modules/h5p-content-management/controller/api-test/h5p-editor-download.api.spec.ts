import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { H5PAjaxEndpoint } from '@lumieducation/h5p-server';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { H5PEditorTestModule } from '@modules/h5p-content-management/h5p-editor-test.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/database';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { PassThrough } from 'node:stream';
import { H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN, H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN } from '../../h5p-editor.const';
import { h5pContentFactory } from '../../testing';

describe('H5PEditor Controller - Download (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let ajaxEndpoint: DeepMocked<H5PAjaxEndpoint>;

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
		testApiClient = new TestApiClient(app, 'h5p-editor');
	});

	afterEach(async () => {
		jest.resetAllMocks();
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('download h5p content', () => {
		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const someId = new ObjectId().toHexString();

				const response = await testApiClient.get(`download/${someId}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in', () => {
			describe('when id in params is not a mongo id', () => {
				it('should return 400', async () => {
					const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

					const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

					const response = await loggedInClient.get('download/123');

					expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
					expect(response.body).toEqual(
						expect.objectContaining({
							validationErrors: [{ errors: ['contentId must be a mongodb id'], field: ['contentId'] }],
						})
					);
				});
			});

			describe('when requested content is not found', () => {
				it('should return 404', async () => {
					const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

					const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);
					const someId = new ObjectId().toHexString();

					const response = await loggedInClient.get(`download/${someId}`);

					expect(response.status).toEqual(HttpStatus.NOT_FOUND);
				});
			});

			describe('when content is found', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

					const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser);

					const parentId = new ObjectId().toHexString();
					const h5pContent = h5pContentFactory.build({ parentId });

					await em.persist([h5pContent]).flush();
					em.clear();

					// Mock getDownload to write some content to the stream
					ajaxEndpoint.getDownload.mockImplementation((_contentId, _user, stream) => {
						const passThrough = stream as PassThrough;
						passThrough.write('PK'); // H5P files are ZIP archives starting with "PK"
						passThrough.end();

						return Promise.resolve();
					});

					return { contentId: h5pContent.id, h5pContent, loggedInClient };
				};

				it('should respond with code 200', async () => {
					const { contentId, loggedInClient } = await setup();

					const response = await loggedInClient.get(`download/${contentId}`);

					expect(response.status).toEqual(HttpStatus.OK);
				});

				it('should set Content-Type to application/zip', async () => {
					const { contentId, loggedInClient } = await setup();

					const response = await loggedInClient.get(`download/${contentId}`);

					expect(response.headers['content-type']).toContain('application/zip');
				});

				it('should set Content-Disposition header with filename', async () => {
					const { contentId, h5pContent, loggedInClient } = await setup();

					const response = await loggedInClient.get(`download/${contentId}`);

					const expectedFilename = `${h5pContent.metadata.title}.h5p`;
					expect(response.headers['content-disposition']).toContain('attachment');
					expect(response.headers['content-disposition']).toContain(`filename="${expectedFilename}"`);
				});

				it('should call ajaxEndpoint.getDownload with correct params', async () => {
					const { contentId, loggedInClient } = await setup();

					await loggedInClient.get(`download/${contentId}`);

					expect(ajaxEndpoint.getDownload).toHaveBeenCalledWith(
						contentId,
						expect.objectContaining({ id: expect.any(String) }),
						expect.any(PassThrough)
					);
				});
			});

			describe('when content title contains special characters', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

					const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser);

					const parentId = new ObjectId().toHexString();
					const h5pContent = h5pContentFactory.build({ parentId });
					h5pContent.metadata.title = 'Test<Title>With:Special';

					await em.persist([h5pContent]).flush();
					em.clear();

					ajaxEndpoint.getDownload.mockImplementation((_contentId, _user, stream) => {
						const passThrough = stream as PassThrough;
						passThrough.write('PK');
						passThrough.end();

						return Promise.resolve();
					});

					return { contentId: h5pContent.id, loggedInClient };
				};

				it('should sanitize filename in Content-Disposition header', async () => {
					const { contentId, loggedInClient } = await setup();

					const response = await loggedInClient.get(`download/${contentId}`);

					expect(response.headers['content-disposition']).toContain('Test_Title_With_Special.h5p');
				});
			});
		});
	});
});
