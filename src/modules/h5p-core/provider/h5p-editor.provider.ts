import { cacheImplementations, ContentTypeCache, H5PEditor } from '@lumieducation/h5p-server';
import { IH5PEditorOptions, ITranslationFunction } from '@lumieducation/h5p-server/build/src/types';
import SvgSanitizer from '@lumieducation/h5p-svg-sanitizer';
import { Cache } from 'cache-manager';
import { ContentStorage, LibraryStorage, TemporaryFileStorage, Translator } from '../domain/service';
import { H5P_CORE_CONFIG_TOKEN, H5PCoreConfig } from '../h5p-core.config';
import EditorPermissionSystem from './editor-permission-system';
import { H5P_CACHE_PROVIDER_TOKEN } from './h5p-cache.provider';
import { h5pConfig, h5pUrlGenerator } from './h5p-service-config';

export const H5PEditorProvider = {
	provide: H5PEditor,
	inject: [ContentStorage, LibraryStorage, TemporaryFileStorage, H5P_CACHE_PROVIDER_TOKEN, H5P_CORE_CONFIG_TOKEN],
	async useFactory(
		contentStorage: ContentStorage,
		libraryStorage: LibraryStorage,
		temporaryStorage: TemporaryFileStorage,
		cacheAdapter: Cache,
		h5pEditorConfig: H5PCoreConfig
	): Promise<H5PEditor> {
		const cache = new cacheImplementations.CachedKeyValueStorage('kvcache', cacheAdapter);
		const cachedLibraryStorage = new cacheImplementations.CachedLibraryStorage(libraryStorage, cacheAdapter);

		const contentTypeCache = new ContentTypeCache(h5pConfig, cache);
		try {
			const result = await contentTypeCache.downloadContentTypesFromHub();
			// eslint-disable-next-line no-console
			console.log(`Downloaded ${result.length} content types from H5P Hub`);
			// eslint-disable-next-line no-console
			console.log(`Result:`, result);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Error downloading content types from H5P Hub:', error);
		}

		const { availableLanguages, maxFileSize, maxTotalSize } = h5pEditorConfig;

		h5pConfig.maxFileSize = maxFileSize;
		h5pConfig.maxTotalSize = maxTotalSize;

		const permissionSystem = new EditorPermissionSystem();
		const h5pOptions: IH5PEditorOptions = {
			enableHubLocalization: true,
			enableLibraryNameLocalization: true,
			permissionSystem,
			fileSanitizers: [new SvgSanitizer()],
		};

		const translationFunction: ITranslationFunction = await Translator.translate(availableLanguages);
		const h5pEditor = new H5PEditor(
			cache,
			h5pConfig,
			cachedLibraryStorage,
			contentStorage,
			temporaryStorage,
			translationFunction,
			h5pUrlGenerator,
			h5pOptions
		);
		h5pEditor.setRenderer((model) => model);

		return h5pEditor;
	},
};
