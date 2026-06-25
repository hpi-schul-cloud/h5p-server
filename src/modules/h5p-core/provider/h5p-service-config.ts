import { H5PConfig, UrlGenerator } from '@lumieducation/h5p-server';
import { randomUUID } from 'node:crypto';

const STATIC_FILES_BASE = '/h5pstatics';

export const h5pConfig = new H5PConfig(undefined);

h5pConfig.baseUrl = '/api/v3/h5p-editor';

h5pConfig.ajaxUrl = '/ajax';
h5pConfig.contentFilesUrl = '/content';
h5pConfig.contentUserDataUrl = '/contentUserData';
h5pConfig.contentWhitelist =
	'svg json png jpg jpeg gif bmp tif tiff webm mp4 ogg mp3 m4a wav txt pdf rtf doc docx xls xlsx ppt pptx odt ods odp csv md textile vtt webvtt glb gltf';

h5pConfig.librariesUrl = '/libraries';
h5pConfig.paramsUrl = '/params';
h5pConfig.playUrl = '/play';
h5pConfig.setFinishedUrl = '/finishedData';
h5pConfig.temporaryFilesUrl = '/temp-files';

h5pConfig.coreUrl = `${STATIC_FILES_BASE}/core`;
h5pConfig.editorLibraryUrl = `${STATIC_FILES_BASE}/editor`;

h5pConfig.contentUserStateSaveInterval = false;
h5pConfig.setFinishedEnabled = false;

// Workaround: distroless image has no shell, so we set uuid directly to avoid spawning sh.
try {
	h5pConfig.uuid = randomUUID();
	// eslint-disable-next-line no-console
	console.log(`Generated UUID for H5P config: ${h5pConfig.uuid}`);
} catch (error) {
	// eslint-disable-next-line no-console
	console.error('Error generating UUID for H5P config:', error);
	h5pConfig.uuid = 'default-uuid';
}

export const h5pUrlGenerator = new UrlGenerator(h5pConfig);
