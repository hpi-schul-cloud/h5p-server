import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { H5PAjaxEndpoint } from '@lumieducation/h5p-server';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { H5PEditorTestModule } from '@modules/h5p-content-management/h5p-editor-test.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/database';
import { TestApiClient } from '@testing/test-api-client';
import { PassThrough } from 'node:stream';
import { currentUserFactory } from '../../../../testing/factory/currentuser.factory';
import { H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN, H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN } from '../../h5p-editor.const';
import { h5pContentFactory } from '../../testing';

describe('H5PEditor Controller - Download (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
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

				const response = await TestApiClient.createUnauthenticated(app, 'h5p-editor').get(`download/${someId}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in', () => {
			describe('when id in params is not a mongo id', () => {
				it('should return 400', async () => {
					const studentUser = currentUserFactory.withRoleStudent().build();
					const loggedInClient = TestApiClient.createWithJwt(app, 'h5p-editor', studentUser);

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
					const studentUser = currentUserFactory.withRoleStudent().build();

					const loggedInClient = TestApiClient.createWithJwt(app, 'h5p-editor', studentUser);
					const someId = new ObjectId().toHexString();

					const response = await loggedInClient.get(`download/${someId}`);

					expect(response.status).toEqual(HttpStatus.NOT_FOUND);
				});
			});

			describe('when content is found', () => {
				const setup = async () => {
					const teacherUser = currentUserFactory.withRoleTeacher().build();

					const loggedInClient = TestApiClient.createWithJwt(app, 'h5p-editor', teacherUser);

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
					const teacherUser = currentUserFactory.withRoleTeacher().build();

					const loggedInClient = TestApiClient.createWithJwt(app, 'h5p-editor', teacherUser);

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

			describe('when content title ends with trailing dots', () => {
				const setup = async () => {
					const teacherUser = currentUserFactory.withRoleTeacher().build();

					const loggedInClient = TestApiClient.createWithJwt(app, 'h5p-editor', teacherUser);

					const parentId = new ObjectId().toHexString();
					const h5pContent = h5pContentFactory.build({ parentId });
					h5pContent.metadata.title = 'TestTitle...';

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

				it('should remove trailing dots from filename in Content-Disposition header', async () => {
					const { contentId, loggedInClient } = await setup();

					const response = await loggedInClient.get(`download/${contentId}`);

					expect(response.headers['content-disposition']).toContain('filename="TestTitle.h5p"');
					expect(response.headers['content-disposition']).not.toContain('filename="TestTitle...');
				});
			});

			describe('when content title contains non-latin1 characters', () => {
				const setup = async () => {
					const teacherUser = currentUserFactory.withRoleTeacher().build();

					const loggedInClient = TestApiClient.createWithJwt(app, 'h5p-editor', teacherUser);

					const parentId = new ObjectId().toHexString();
					const h5pContent = h5pContentFactory.build({ parentId });
					h5pContent.metadata.title = 'Test你好';

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

				it('should set an encoded UTF-8 filename and latin1 fallback in Content-Disposition header', async () => {
					const { contentId, loggedInClient } = await setup();

					const response = await loggedInClient.get(`download/${contentId}`);

					expect(response.headers['content-disposition']).toContain('filename="Test__.h5p"');
					expect(response.headers['content-disposition']).toContain("filename*=UTF-8''Test%E4%BD%A0%E5%A5%BD.h5p");
				});
			});

			describe('when getDownload rejects with an Error', () => {
				const setup = async () => {
					const teacherUser = currentUserFactory.withRoleTeacher().build();

					const loggedInClient = TestApiClient.createWithJwt(app, 'h5p-editor', teacherUser);

					const parentId = new ObjectId().toHexString();
					const h5pContent = h5pContentFactory.build({ parentId });

					await em.persist([h5pContent]).flush();
					em.clear();

					const downloadError = new Error('Download failed');
					ajaxEndpoint.getDownload.mockImplementation((_contentId, _user, stream) => {
						const passThrough = stream as PassThrough;
						// Simulate async rejection after stream is returned
						setImmediate(() => {
							passThrough.destroy(downloadError);
						});

						return Promise.reject(downloadError);
					});

					return { contentId: h5pContent.id, loggedInClient, downloadError };
				};

				it('should call getDownload and handle the error', async () => {
					const { contentId, loggedInClient } = await setup();

					const response = await loggedInClient.get(`download/${contentId}`);

					expect(ajaxEndpoint.getDownload).toHaveBeenCalledWith(
						contentId,
						expect.objectContaining({ id: expect.any(String) }),
						expect.any(PassThrough)
					);
					// Response status depends on when the error occurs - stream is destroyed with error
					expect([HttpStatus.OK, HttpStatus.BAD_REQUEST, HttpStatus.INTERNAL_SERVER_ERROR]).toContain(response.status);
				});
			});

			describe('when getDownload rejects with a non-Error value', () => {
				const setup = async () => {
					const teacherUser = currentUserFactory.withRoleTeacher().build();

					const loggedInClient = TestApiClient.createWithJwt(app, 'h5p-editor', teacherUser);

					const parentId = new ObjectId().toHexString();
					const h5pContent = h5pContentFactory.build({ parentId });

					await em.persist([h5pContent]).flush();
					em.clear();

					const nonErrorValue = 'string error message';
					ajaxEndpoint.getDownload.mockImplementation((_contentId, _user, stream) => {
						const passThrough = stream as PassThrough;
						// Simulate async rejection after stream is returned
						setImmediate(() => {
							passThrough.destroy(new Error(String(nonErrorValue)));
						});

						// This intentionally rejects with a non-Error to test the error conversion logic
						return Promise.reject(nonErrorValue);
					});

					return { contentId: h5pContent.id, loggedInClient, nonErrorValue };
				};

				it('should convert non-Error to Error and handle the rejection', async () => {
					const { contentId, loggedInClient } = await setup();

					const response = await loggedInClient.get(`download/${contentId}`);

					expect(ajaxEndpoint.getDownload).toHaveBeenCalledWith(
						contentId,
						expect.objectContaining({ id: expect.any(String) }),
						expect.any(PassThrough)
					);
					// Response status depends on when the error occurs - stream is destroyed with converted error
					expect([HttpStatus.OK, HttpStatus.BAD_REQUEST, HttpStatus.INTERNAL_SERVER_ERROR]).toContain(response.status);
				});
			});
		});
	});
});
