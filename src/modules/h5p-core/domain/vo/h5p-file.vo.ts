import { File } from '@infra/s3-client';
import { ValueObject } from '@shared/domain/value-object.decorator';
import { Allow, IsString } from 'class-validator';
import type { Readable } from 'node:stream';

@ValueObject()
export class H5pFileVo implements File {
	constructor(file: H5pFileVo) {
		this.name = file.name;
		this.data = file.data;
		this.mimeType = file.mimeType;
	}

	@IsString()
	public name!: string;

	@Allow()
	public data!: Readable;

	@IsString()
	public mimeType!: string;
}
