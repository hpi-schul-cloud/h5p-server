import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@infra/auth-guard';
import {
	AuthorizationBodyParamsReferenceType,
	AuthorizationClientAdapter,
	AuthorizationContextBuilder,
} from '@infra/authorization-client';
import { Logger } from '@infra/logger';
import { H5PAjaxEndpoint, H5PEditor, H5PPlayer } from '@lumieducation/h5p-server';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PassThrough } from 'node:stream';
import { H5P_EDITOR_CONFIG_TOKEN } from '../h5p-editor.config';
import { H5PContentRepo } from '../repo';
import { LibraryStorage } from '../service';
import { h5pContentFactory } from '../testing';
import { H5PEditorUc } from './h5p-editor.uc';

const createParams = () => {
	const content = h5pContentFactory.build();

	const mockCurrentUser: ICurrentUser = {
		accountId: 'mockAccountId',
		roles: ['student'],
		schoolId: 'mockSchoolId',
		userId: 'mockUserId',
		isExternalUser: false,
		support: false,
	};

	return { content, mockCurrentUser };
};

describe('downloadH5pContent', () => {
	let module: TestingModule;
	let uc: H5PEditorUc;
	let h5pAjaxEndpoint: DeepMocked<H5PAjaxEndpoint>;
	let h5pContentRepo: DeepMocked<H5PContentRepo>;
	let authorizationClientAdapter: DeepMocked<AuthorizationClientAdapter>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5PEditorUc,
				{
					provide: H5PAjaxEndpoint,
					useValue: createMock<H5PAjaxEndpoint>(),
				},
				{
					provide: H5PEditor,
					useValue: createMock<H5PEditor>(),
				},
				{
					provide: H5PPlayer,
					useValue: createMock<H5PPlayer>(),
				},
				{
					provide: LibraryStorage,
					useValue: createMock<LibraryStorage>(),
				},
				{
					provide: AuthorizationClientAdapter,
					useValue: createMock<AuthorizationClientAdapter>(),
				},
				{
					provide: H5PContentRepo,
					useValue: createMock<H5PContentRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: H5P_EDITOR_CONFIG_TOKEN,
					useValue: {},
				},
			],
		}).compile();

		uc = module.get(H5PEditorUc);
		h5pAjaxEndpoint = module.get(H5PAjaxEndpoint);
		h5pContentRepo = module.get(H5PContentRepo);
		authorizationClientAdapter = module.get(AuthorizationClientAdapter);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('WHEN user is authorized and service executes successfully', () => {
		const setup = () => {
			const { content, mockCurrentUser } = createParams();

			h5pContentRepo.findById.mockResolvedValueOnce(content);
			authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();
			h5pAjaxEndpoint.getDownload.mockResolvedValueOnce();

			return { content, mockCurrentUser };
		};

		it('should call h5pContentRepo.findById with correct contentId', async () => {
			const { content, mockCurrentUser } = setup();

			await uc.downloadH5pContent(mockCurrentUser, content.id);

			expect(h5pContentRepo.findById).toHaveBeenCalledWith(content.id);
		});

		it('should call authorizationClientAdapter.checkPermissionsByReference', async () => {
			const { content, mockCurrentUser } = setup();

			await uc.downloadH5pContent(mockCurrentUser, content.id);

			expect(authorizationClientAdapter.checkPermissionsByReference).toHaveBeenCalledWith(
				AuthorizationBodyParamsReferenceType.BOARDNODES,
				content.parentId,
				AuthorizationContextBuilder.read([])
			);
		});

		it('should call h5pAjaxEndpoint.getDownload with correct params', async () => {
			const { content, mockCurrentUser } = setup();

			await uc.downloadH5pContent(mockCurrentUser, content.id);

			expect(h5pAjaxEndpoint.getDownload).toHaveBeenCalledWith(
				content.id,
				expect.objectContaining({
					id: mockCurrentUser.userId,
				}),
				expect.any(PassThrough)
			);
		});

		it('should return filename and passThrough stream', async () => {
			const { content, mockCurrentUser } = setup();

			const result = await uc.downloadH5pContent(mockCurrentUser, content.id);

			expect(result).toEqual({
				filename: `${content.metadata.title}.h5p`,
				passThrough: expect.any(PassThrough),
			});
		});
	});

	describe('WHEN content does not exist', () => {
		const setup = () => {
			const { content, mockCurrentUser } = createParams();

			h5pContentRepo.findById.mockRejectedValueOnce(new NotFoundException());

			return { content, mockCurrentUser };
		};

		it('should throw NotFoundException', async () => {
			const { content, mockCurrentUser } = setup();

			const downloadPromise = uc.downloadH5pContent(mockCurrentUser, content.id);

			await expect(downloadPromise).rejects.toThrow(NotFoundException);
		});
	});

	describe('WHEN user is not authorized', () => {
		const setup = () => {
			const { content, mockCurrentUser } = createParams();

			h5pContentRepo.findById.mockResolvedValueOnce(content);
			authorizationClientAdapter.checkPermissionsByReference.mockRejectedValueOnce(new ForbiddenException());

			return { content, mockCurrentUser };
		};

		it('should throw ForbiddenException', async () => {
			const { content, mockCurrentUser } = setup();

			const downloadPromise = uc.downloadH5pContent(mockCurrentUser, content.id);

			await expect(downloadPromise).rejects.toThrow(ForbiddenException);
		});
	});

	describe('WHEN title contains special characters', () => {
		const setup = () => {
			const { content, mockCurrentUser } = createParams();
			content.metadata.title = String.raw`Test<Title>With:Special/Chars\And|More?Chars*`;

			h5pContentRepo.findById.mockResolvedValueOnce(content);
			authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();
			h5pAjaxEndpoint.getDownload.mockResolvedValueOnce();

			return { content, mockCurrentUser };
		};

		it('should sanitize special characters in filename', async () => {
			const { mockCurrentUser, content } = setup();

			const result = await uc.downloadH5pContent(mockCurrentUser, content.id);

			expect(result.filename).toBe('Test_Title_With_Special_Chars_And_More_Chars_.h5p');
		});
	});

	describe('WHEN title contains only invalid characters', () => {
		const setup = () => {
			const { content, mockCurrentUser } = createParams();
			content.metadata.title = '   '; // Only whitespace, will be empty after trim

			h5pContentRepo.findById.mockResolvedValueOnce(content);
			authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();
			h5pAjaxEndpoint.getDownload.mockResolvedValueOnce();

			return { content, mockCurrentUser };
		};

		it('should fallback to "content" as filename', async () => {
			const { mockCurrentUser, content } = setup();

			const result = await uc.downloadH5pContent(mockCurrentUser, content.id);

			expect(result.filename).toBe('content.h5p');
		});
	});

	describe('WHEN title has trailing dots', () => {
		const setup = () => {
			const { content, mockCurrentUser } = createParams();
			content.metadata.title = 'MyTitle...';

			h5pContentRepo.findById.mockResolvedValueOnce(content);
			authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();
			h5pAjaxEndpoint.getDownload.mockResolvedValueOnce();

			return { content, mockCurrentUser };
		};

		it('should remove trailing dots from filename', async () => {
			const { mockCurrentUser, content } = setup();

			const result = await uc.downloadH5pContent(mockCurrentUser, content.id);

			expect(result.filename).toBe('MyTitle.h5p');
		});
	});

	describe('WHEN title is very long', () => {
		const setup = () => {
			const { content, mockCurrentUser } = createParams();
			content.metadata.title = 'A'.repeat(250);

			h5pContentRepo.findById.mockResolvedValueOnce(content);
			authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();
			h5pAjaxEndpoint.getDownload.mockResolvedValueOnce();

			return { content, mockCurrentUser };
		};

		it('should truncate filename to 200 characters', async () => {
			const { mockCurrentUser, content } = setup();

			const result = await uc.downloadH5pContent(mockCurrentUser, content.id);

			expect(result.filename).toBe('A'.repeat(200) + '.h5p');
		});
	});

	describe('WHEN h5pAjaxEndpoint.getDownload throws an error', () => {
		const setup = () => {
			const { content, mockCurrentUser } = createParams();
			const error = new Error('Download failed');

			h5pContentRepo.findById.mockResolvedValueOnce(content);
			authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();
			// Use a deferred promise rejection to avoid unhandled promise warnings
			h5pAjaxEndpoint.getDownload.mockImplementation(
				() =>
					new Promise((_, reject) => {
						setImmediate(() => reject(error));
					})
			);

			return { content, mockCurrentUser, error };
		};

		it('should destroy the passThrough stream with the error', async () => {
			const { mockCurrentUser, content, error } = setup();

			const result = await uc.downloadH5pContent(mockCurrentUser, content.id);

			// Wait for the stream error event
			const streamError = await new Promise<Error>((resolve) => {
				result.passThrough.on('error', resolve);
			});

			expect(streamError.message).toBe(error.message);
			expect(result.passThrough.destroyed).toBe(true);
		});
	});
});
