import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LibraryFileUrlParams {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	ubername!: string;

	@ApiProperty({ description: 'Wildcard path for file', type: [String] })
	@IsNotEmpty()
	file!: string | string[];
}
