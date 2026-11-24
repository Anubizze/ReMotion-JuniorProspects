import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { exercises } from './exercises.data';

@ApiTags('exercises')
@Controller('exercises')
export class ExerciseController {
  @Get()
  @ApiOperation({ summary: 'Получить доступные упражнения' })
  list() { return exercises; }

  @Get(':exerciseId')
  @ApiOperation({ summary: 'Получить сведения об упражнении' })
  @ApiParam({ name: 'exerciseId', example: 'elbow-extension' })
  get(@Param('exerciseId') exerciseId: string) {
    const exercise = exercises.find((item) => item.id === exerciseId);
    if (!exercise) throw new NotFoundException('Упражнение не найдено');
    return exercise;
  }
}
