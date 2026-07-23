/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export {
	ContentStorage,
	H5PContentParentType,
	H5pContentService,
	H5PUploadFile,
	LanguageType,
	LibraryStorage,
	LumiUserWithContentData,
} from './domain';
export {
	H5P_AVAILABLE_LIBRARIES,
	H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN,
	H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN,
} from './h5p-core.const';
export { H5PCoreModule } from './h5p-core.module';
