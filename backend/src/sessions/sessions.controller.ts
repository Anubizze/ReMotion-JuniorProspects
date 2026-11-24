import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateMetricDto } from './dto/create-metric.dto';
import { FinishSessionDto } from './dto/finish-session.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { SessionService } from './session.service';

@ApiTags('sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionService) {}

  @Post('start') @ApiOperation({ summary: 'Начать тренировочную сессию' })
  start(@Body() dto: StartSessionDto) { return this.service.start(dto); }

  @Post(':sessionId/metrics') @ApiOperation({ summary: 'Сохранить метрику упражнения' })
  @ApiParam({ name: 'sessionId' })
  metrics(@Param('sessionId') id: string, @Body() dto: CreateMetricDto) { return this.service.addMetric(id, dto); }

  @Post(':sessionId/finish') @ApiOperation({ summary: 'Завершить тренировочную сессию' })
  @ApiParam({ name: 'sessionId' })
  finish(@Param('sessionId') id: string, @Body() dto: FinishSessionDto) { return this.service.finish(id, dto); }

  @Get('history') @ApiOperation({ summary: 'Получить историю сессий' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  history(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) { return this.service.history(Math.min(Math.max(limit ?? 20, 1), 100)); }

  @Get(':sessionId/results') @ApiOperation({ summary: 'Получить результат и метрики сессии' })
  @ApiParam({ name: 'sessionId' })
  results(@Param('sessionId') id: string) { return this.service.result(id); }

  @Post(':sessionId/analyze') @ApiOperation({ summary: 'Оценить метрики завершённой сессии с помощью AI' })
  @ApiParam({ name: 'sessionId' })
  analyze(@Param('sessionId') id: string) { return this.service.analyze(id); }
}
