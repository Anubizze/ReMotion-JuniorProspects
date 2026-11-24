import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class FinishSessionDto {
  @ApiProperty({ example: 8 }) @IsInt() @Min(0) repetitions: number;
  @ApiProperty({ example: 125 }) @IsInt() @Min(0) duration_seconds: number;
  @ApiPropertyOptional({ example: 143, nullable: true }) @IsOptional() @IsNumber() @Min(0) @Max(180) average_elbow_angle: number | null;
}
