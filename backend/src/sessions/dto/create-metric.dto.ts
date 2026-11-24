import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateMetricDto {
  @ApiProperty({ example: 3 }) @IsNumber() @Min(0) repetitions: number;
  @ApiPropertyOptional({ example: 142, nullable: true }) @IsOptional() @IsNumber() @Min(0) @Max(180) elbow_angle: number | null;
  @ApiProperty({ example: 'Разогните руку' }) @IsString() @MaxLength(80) phase: string;
  @ApiProperty({ example: 0.89 }) @IsNumber() @Min(0) @Max(1) confidence: number;
}
