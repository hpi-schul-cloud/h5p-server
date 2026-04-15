import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ContentFileUrlParams {
	@ApiProperty()
	@IsMongoId()
	id!: string;

	@ApiProperty({ description: 'Wildcard path for file', type: [String] })
	@IsNotEmpty()
	filename!: string | string[];
}
