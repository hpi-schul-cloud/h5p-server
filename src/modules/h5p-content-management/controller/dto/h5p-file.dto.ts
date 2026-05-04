import { File } from '@infra/s3-client';
import type { Readable } from 'node:stream';

export class H5pFileDto implements File {
	constructor(file: H5pFileDto) {
		this.name = file.name;
		this.data = file.data;
		this.mimeType = file.mimeType;
	}

	name: string;

	data: Readable;

	mimeType: string;
}
