import type { Readable } from 'node:stream';

export interface GetLibraryFile {
	data: Readable;
	contentType: string;
	contentLength: number;
	contentRange?: { start: number; end: number };
}
