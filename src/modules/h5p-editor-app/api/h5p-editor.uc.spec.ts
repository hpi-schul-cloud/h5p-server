import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@infra/auth-guard';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { Logger } from '@infra/logger';
import { H5PAjaxEndpoint, H5PEditor, H5PPlayer } from '@lumieducation/h5p-server';
import { H5PContentParentType, H5pContentService, LibraryStorage } from '@modules/h5p-core';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import * as fs from 'node:fs';
import { Readable } from 'node:stream';
import { H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig } from '../h5p-editor-app.config';
import { H5PEditorUc } from './h5p-editor.uc';

jest.mock('node:fs', () => ({
	...jest.requireActual('node:fs'),
	unlinkSync: jest.fn(),
	rmSync: jest.fn(),
	mkdtempSync: jest.fn().mockReturnValue('/tmp/h5p-svg-test'),
}));

jest.mock('node:fs/promises', () => ({
	...jest.requireActual('node:fs/promises'),
	writeFile: jest.fn().mockResolvedValue(undefined),
}));

describe('H5PEditorUc', () => {
	let module: TestingModule;
	let uc: H5PEditorUc;

	let h5pAjaxEndpoint: DeepMocked<H5PAjaxEndpoint>;
	let h5pContentService: DeepMocked<H5pContentService>;
	let authorizationClientAdapter: DeepMocked<AuthorizationClientAdapter>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5PEditorUc,
				{
					provide: H5P_EDITOR_CONFIG_TOKEN,
					useValue: createMock<H5PEditorConfig>({ libraryList: [] }),
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
					provide: H5PAjaxEndpoint,
					useValue: createMock<H5PAjaxEndpoint>(),
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
					provide: H5pContentService,
					useValue: createMock<H5pContentService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(H5PEditorUc);
		h5pAjaxEndpoint = module.get(H5PAjaxEndpoint);
		h5pContentService = module.get(H5pContentService);
		authorizationClientAdapter = module.get(AuthorizationClientAdapter);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('getRange', () => {
		const setupContentMocks = () => {
			const contentId = 'test-content-id';
			const userId = 'test-user-id';
			const file = 'test.txt';

			h5pContentService.getContentById.mockResolvedValue({
				parentType: H5PContentParentType.BoardElement,
				parentId: 'parent-id',
				metadata: { title: 'Test' },
			} as never);

			authorizationClientAdapter.checkPermissionsByReference.mockResolvedValue(undefined);

			return { contentId, userId, file };
		};

		const createMockRequest = (rangeValue: number | { start: number; end: number }[]) => {
			const req = createMock<Request>();
			req.range.mockReturnValue(rangeValue as never);

			return req;
		};

		describe('when range header is malformed (range === -2)', () => {
			it('should throw BadRequestException with "invalid range" message via getContentFile', async () => {
				const { contentId, userId, file } = setupContentMocks();
				const req = createMockRequest(-2);

				// Mock getContentFile to call the range callback immediately
				h5pAjaxEndpoint.getContentFile.mockImplementation(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(_contentId, _file, _user, rangeCallback): Promise<any> => {
						// Call the range callback with a file size - this triggers our getRange method
						rangeCallback?.(1000);

						return Promise.resolve({
							mimetype: 'text/plain',
							range: { start: 0, end: 5 },
							stats: { size: 1000, birthtime: new Date() },
							stream: Readable.from(['test']),
						});
					}
				);

				await expect(uc.getContentFile(contentId, file, req, userId)).rejects.toThrow(
					new BadRequestException('invalid range')
				);
			});

			it('should throw BadRequestException with "invalid range" message via getTemporaryFile', async () => {
				const currentUser: ICurrentUser = {
					userId: 'test-user-id',
					schoolId: 'test-school-id',
					accountId: 'test-account-id',
					roles: [],
					isExternalUser: false,
					support: false,
				};
				const file = 'test.txt';
				const req = createMockRequest(-2);

				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValue(undefined);

				// Mock getTemporaryFile to call the range callback immediately
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				h5pAjaxEndpoint.getTemporaryFile.mockImplementation((_file, _user, rangeCallback): Promise<any> => {
					// Call the range callback with a file size - this triggers our getRange method
					rangeCallback?.(1000);

					return Promise.resolve({
						mimetype: 'text/plain',
						range: { start: 0, end: 5 },
						stats: { size: 1000, birthtime: new Date() },
						stream: Readable.from(['test']),
					});
				});

				await expect(uc.getTemporaryFile(file, req, currentUser)).rejects.toThrow(
					new BadRequestException('invalid range')
				);
			});
		});

		describe('when range header is unsatisfiable (range === -1)', () => {
			it('should throw BadRequestException with "unsatisfiable range" message via getContentFile', async () => {
				const { contentId, userId, file } = setupContentMocks();
				const req = createMockRequest(-1);

				h5pAjaxEndpoint.getContentFile.mockImplementation(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(_contentId, _file, _user, rangeCallback): Promise<any> => {
						rangeCallback?.(1000);

						return Promise.resolve({
							mimetype: 'text/plain',
							range: { start: 0, end: 5 },
							stats: { size: 1000, birthtime: new Date() },
							stream: Readable.from(['test']),
						});
					}
				);

				await expect(uc.getContentFile(contentId, file, req, userId)).rejects.toThrow(
					new BadRequestException('unsatisfiable range')
				);
			});
		});

		describe('when range has multiple parts (multipart)', () => {
			it('should throw BadRequestException with "multipart ranges are unsupported" message via getContentFile', async () => {
				const { contentId, userId, file } = setupContentMocks();
				const req = createMockRequest([
					{ start: 0, end: 2 },
					{ start: 4, end: 6 },
				]);

				h5pAjaxEndpoint.getContentFile.mockImplementation(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(_contentId, _file, _user, rangeCallback): Promise<any> => {
						rangeCallback?.(1000);

						return Promise.resolve({
							mimetype: 'text/plain',
							range: { start: 0, end: 5 },
							stats: { size: 1000, birthtime: new Date() },
							stream: Readable.from(['test']),
						});
					}
				);

				await expect(uc.getContentFile(contentId, file, req, userId)).rejects.toThrow(
					new BadRequestException('multipart ranges are unsupported')
				);
			});
		});

		describe('when range is valid', () => {
			it('should return the file with range info via getContentFile', async () => {
				const { contentId, userId, file } = setupContentMocks();
				const req = createMockRequest([{ start: 0, end: 5 }]);

				h5pAjaxEndpoint.getContentFile.mockImplementation(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(_contentId, _file, _user, rangeCallback): Promise<any> => {
						const range = rangeCallback?.(1000);

						return Promise.resolve({
							mimetype: 'text/plain',
							range,
							stats: { size: 1000, birthtime: new Date() },
							stream: Readable.from(['test']),
						});
					}
				);

				const result = await uc.getContentFile(contentId, file, req, userId);

				expect(result.contentRange).toEqual({ start: 0, end: 5 });
			});
		});

		describe('when no range header is present', () => {
			it('should return undefined range via getContentFile', async () => {
				const { contentId, userId, file } = setupContentMocks();
				const req = createMock<Request>();
				req.range.mockReturnValue(undefined as never);

				h5pAjaxEndpoint.getContentFile.mockImplementation(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(_contentId, _file, _user, rangeCallback): Promise<any> => {
						const range = rangeCallback?.(1000);

						return Promise.resolve({
							mimetype: 'text/plain',
							range,
							stats: { size: 1000, birthtime: new Date() },
							stream: Readable.from(['test']),
						});
					}
				);

				const result = await uc.getContentFile(contentId, file, req, userId);

				expect(result.contentRange).toBeUndefined();
			});
		});
	});

	describe('postAjax', () => {
		const createCurrentUser = (): ICurrentUser => ({
			userId: 'test-user-id',
			schoolId: 'test-school-id',
			accountId: 'test-account-id',
			roles: [],
			isExternalUser: false,
			support: false,
		});

		const createSvgFile = (): Express.Multer.File =>
			({
				originalname: 'test.svg',
				mimetype: 'image/svg+xml',
				buffer: Buffer.from('<svg></svg>'),
				size: 11,
			}) as Express.Multer.File;

		const createNonSvgFile = (): Express.Multer.File =>
			({
				originalname: 'test.png',
				mimetype: 'image/png',
				buffer: Buffer.from('png data'),
				size: 8,
			}) as Express.Multer.File;

		beforeEach(() => {
			authorizationClientAdapter.checkPermissionsByReference.mockResolvedValue(undefined);
			authorizationClientAdapter.getUser.mockResolvedValue({ language: 'de' } as never);
			(fs.unlinkSync as jest.Mock).mockClear();
			(fs.rmSync as jest.Mock).mockClear();
			(fs.mkdtempSync as jest.Mock).mockReturnValue('/tmp/h5p-svg-test');
		});

		describe('when SVG file is uploaded and postAjax succeeds', () => {
			it('should clean up temporary SVG file in finally block', async () => {
				const currentUser = createCurrentUser();
				const svgFile = createSvgFile();

				h5pAjaxEndpoint.postAjax.mockResolvedValue([]);

				await uc.postAjax(currentUser, { action: 'libraries' }, {} as never, svgFile);

				expect(fs.unlinkSync).toHaveBeenCalled();
				expect(fs.rmSync).toHaveBeenCalled();
			});
		});

		describe('when SVG file is uploaded and postAjax throws an error', () => {
			it('should still clean up temporary SVG file in finally block', async () => {
				const currentUser = createCurrentUser();
				const svgFile = createSvgFile();

				h5pAjaxEndpoint.postAjax.mockRejectedValue(new Error('postAjax failed'));

				await expect(uc.postAjax(currentUser, { action: 'libraries' }, {} as never, svgFile)).rejects.toThrow(
					InternalServerErrorException
				);

				expect(fs.unlinkSync).toHaveBeenCalled();
				expect(fs.rmSync).toHaveBeenCalled();
			});
		});

		describe('when non-SVG file is uploaded', () => {
			it('should not attempt to clean up any temporary file', async () => {
				const currentUser = createCurrentUser();
				const pngFile = createNonSvgFile();

				h5pAjaxEndpoint.postAjax.mockResolvedValue([]);

				await uc.postAjax(currentUser, { action: 'libraries' }, {} as never, pngFile);

				expect(fs.unlinkSync).not.toHaveBeenCalled();
				expect(fs.rmSync).not.toHaveBeenCalled();
			});
		});

		describe('when no file is uploaded', () => {
			it('should not attempt to clean up any temporary file', async () => {
				const currentUser = createCurrentUser();

				h5pAjaxEndpoint.postAjax.mockResolvedValue([]);

				await uc.postAjax(currentUser, { action: 'libraries' }, {} as never);

				expect(fs.unlinkSync).not.toHaveBeenCalled();
				expect(fs.rmSync).not.toHaveBeenCalled();
			});
		});

		describe('when h5pFile is provided', () => {
			const createH5pFile = (): Express.Multer.File =>
				({
					originalname: 'library.h5p',
					mimetype: 'application/zip',
					buffer: Buffer.from('h5p library content'),
					size: 19,
				}) as Express.Multer.File;

			it('should pass libraryUploadFile with correct properties to postAjax', async () => {
				const currentUser = createCurrentUser();
				const h5pFile = createH5pFile();

				h5pAjaxEndpoint.postAjax.mockResolvedValue([]);

				await uc.postAjax(currentUser, { action: 'libraries' }, {} as never, undefined, h5pFile);

				expect(h5pAjaxEndpoint.postAjax).toHaveBeenCalledWith(
					'libraries',
					{},
					'de',
					expect.any(Object),
					undefined, // contentUploadFile
					undefined, // query.id
					undefined,
					expect.objectContaining({
						data: h5pFile.buffer,
						mimetype: 'application/zip',
						name: 'library.h5p',
						size: 19,
						tempFilePath: 'unknown.type',
					})
				);
			});
		});

		describe('when h5pFile is undefined', () => {
			it('should pass undefined for libraryUploadFile to postAjax', async () => {
				const currentUser = createCurrentUser();

				h5pAjaxEndpoint.postAjax.mockResolvedValue([]);

				await uc.postAjax(currentUser, { action: 'libraries' }, {} as never, undefined, undefined);

				expect(h5pAjaxEndpoint.postAjax).toHaveBeenCalledWith(
					'libraries',
					{},
					'de',
					expect.any(Object),
					undefined, // contentUploadFile
					undefined, // query.id
					undefined,
					undefined // libraryUploadFile should be undefined
				);
			});
		});
	});
});
