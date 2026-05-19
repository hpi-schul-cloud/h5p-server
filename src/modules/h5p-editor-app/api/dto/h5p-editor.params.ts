/* eslint-disable max-classes-per-file */
import { IContentMetadata } from '@lumieducation/h5p-server';
import { H5PContentParentType, LanguageType } from '@modules/h5p-content-management';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { IsEnum, IsMongoId, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class GetH5PContentParams {
	@ApiPropertyOptional({ enum: LanguageType, enumName: 'LanguageType' })
	@IsEnum(LanguageType)
	@IsOptional()
	language?: LanguageType;

	@ApiProperty()
	@IsMongoId()
	contentId!: string;
}

export class GetH5PEditorParamsCreate {
	@ApiProperty({ enum: LanguageType, enumName: 'LanguageType' })
	@IsEnum(LanguageType)
	language!: LanguageType;
}

export class GetH5PEditorParams {
	@ApiProperty()
	@IsMongoId()
	contentId!: string;

	@ApiProperty({ enum: LanguageType, enumName: 'LanguageType' })
	@IsEnum(LanguageType)
	language!: LanguageType;
}

export class SaveH5PEditorParams {
	@ApiProperty()
	@IsMongoId()
	contentId!: string;
}

export class PostH5PContentCreateParams {
	@ApiProperty({ enum: H5PContentParentType, enumName: 'H5PContentParentType' })
	@IsEnum(H5PContentParentType)
	parentType!: H5PContentParentType;

	@ApiProperty()
	@IsMongoId()
	parentId!: EntityId;

	@ApiProperty()
	@IsNotEmpty()
	@IsObject()
	params!: {
		params: unknown;
		metadata: IContentMetadata;
	};

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	library!: string;
}
