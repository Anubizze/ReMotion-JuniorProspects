import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseController } from './exercises/exercise.controller';
import { LessonController } from './lessons/lesson.controller';
import { SessionsController } from './sessions/sessions.controller';
import { SessionService } from './sessions/session.service';
import { RehabSession } from './sessions/session.entity';
import { SessionMetric } from './sessions/session-metric.entity';
import { HealthController } from './health.controller';
import { AiService } from './ai/ai.service';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'sqljs', location: process.env.DATABASE_PATH ?? './seriq.sqlite',
    autoSave: true, entities: [RehabSession, SessionMetric], synchronize: true,
  }), TypeOrmModule.forFeature([RehabSession, SessionMetric])],
  controllers: [HealthController, ExerciseController, LessonController, SessionsController],
  providers: [SessionService, AiService],
})
export class AppModule {}
