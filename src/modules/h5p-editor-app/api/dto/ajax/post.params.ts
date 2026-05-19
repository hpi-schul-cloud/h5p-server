import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AjaxPostQueryParams {
	@IsString()
	@IsNotEmpty()
	public action!: string;

	@IsString()
	@IsOptional()
	public machineName?: string;

	@IsString()
	@IsOptional()
	public majorVersion?: string;

	@IsString()
	@IsOptional()
	public minorVersion?: string;

	@IsString()
	@IsOptional()
	public language?: string;

	@IsString()
	@IsOptional()
	public id?: string;
}
