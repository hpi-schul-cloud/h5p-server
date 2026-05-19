import { cacheImplementations, H5PPlayer, ITranslationFunction } from '@lumieducation/h5p-server';
import { Cache } from 'cache-manager';
import { ContentStorage, LibraryStorage, Translator } from '../domain';
import { H5P_CORE_CONFIG_TOKEN, H5PCoreConfig } from '../h5p-core.config';
import { H5P_CACHE_PROVIDER_TOKEN } from './h5p-cache.provider';
import { h5pConfig, h5pUrlGenerator } from './h5p-service-config';

export const H5PPlayerProvider = {
	provide: H5PPlayer,
	inject: [ContentStorage, LibraryStorage, H5P_CACHE_PROVIDER_TOKEN, H5P_CORE_CONFIG_TOKEN],
	useFactory: async (
		contentStorage: ContentStorage,
		libraryStorage: LibraryStorage,
		cacheAdapter: Cache,
		h5pEditorConfig: H5PCoreConfig
	): Promise<H5PPlayer> => {
		const libraryCache = new cacheImplementations.CachedLibraryStorage(libraryStorage, cacheAdapter);
		const { availableLanguages, maxFileSize, maxTotalSize } = h5pEditorConfig;

		h5pConfig.maxFileSize = maxFileSize;
		h5pConfig.maxTotalSize = maxTotalSize;

		const translationFunction: ITranslationFunction = await Translator.translate(availableLanguages);
		const h5pPlayer = new H5PPlayer(
			libraryCache,
			contentStorage,
			h5pConfig,
			undefined,
			h5pUrlGenerator,
			translationFunction,
			undefined
		);

		h5pPlayer.setRenderer((model) => model);

		return h5pPlayer;
	},
};
