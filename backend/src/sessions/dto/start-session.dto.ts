import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class StartSessionDto {
  @ApiProperty({ example: 'elbow-extension' })
  @IsString() @MaxLength(80) exercise_id: string;
}
