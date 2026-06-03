/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class LibrariesBodyParams {
	@ApiProperty()
	@IsArray()
	@IsString({ each: true })
	public libraries!: string[];
}

export class ContentBodyParams {
	@ApiProperty()
	public contentId!: string;

	@ApiProperty()
	@IsString()
	@IsOptional()
	public field!: string;
}

export class LibraryParametersBodyParams {
	@ApiProperty()
	@IsString()
	public libraryParameters!: string;
}

export type AjaxPostBodyParams = LibrariesBodyParams | ContentBodyParams | LibraryParametersBodyParams | undefined;
