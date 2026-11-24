import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

const lessons = [{
  id: 'elbow-extension-basics', exercise_id: 'elbow-extension',
  title: 'Разгибание локтя: техника выполнения', video_url: null,
  available: false,
  description: 'Видео инструктора пока не добавлено. Клиент может показать собственное выбранное видео.',
}];

@ApiTags('lessons')
@Controller('lessons')
export class LessonController {
  @Get(':lessonId')
  @ApiOperation({ summary: 'Получить сведения о видеоуроке' })
  @ApiParam({ name: 'lessonId', example: 'elbow-extension-basics' })
  get(@Param('lessonId') lessonId: string) {
    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson) throw new NotFoundException('Урок не найден');
    return lesson;
  }
}
