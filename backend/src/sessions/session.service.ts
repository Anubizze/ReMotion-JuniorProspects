import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { exercises } from '../exercises/exercises.data';
import { CreateMetricDto } from './dto/create-metric.dto';
import { FinishSessionDto } from './dto/finish-session.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { RehabSession } from './session.entity';
import { SessionMetric } from './session-metric.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(RehabSession) private readonly sessions: Repository<RehabSession>,
    @InjectRepository(SessionMetric) private readonly metrics: Repository<SessionMetric>,
    private readonly ai: AiService,
  ) {}

  async start(dto: StartSessionDto) {
    if (!exercises.some((item) => item.id === dto.exercise_id)) throw new BadRequestException('Неизвестный exercise_id');
    const session = await this.sessions.save(this.sessions.create({ exerciseId: dto.exercise_id, status: 'active' }));
    return { id: session.id, exercise_id: session.exerciseId, status: session.status, started_at: session.startedAt };
  }

  private async find(id: string) {
    const session = await this.sessions.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Тренировочная сессия не найдена');
    return session;
  }

  async addMetric(id: string, dto: CreateMetricDto) {
    const session = await this.find(id);
    if (session.status !== 'active') throw new BadRequestException('Сессия уже завершена');
    const metric = this.metrics.create({ session, repetitions: dto.repetitions, elbowAngle: dto.elbow_angle ?? null, phase: dto.phase, confidence: dto.confidence });
    await this.metrics.save(metric);
    session.repetitions = Math.max(session.repetitions, dto.repetitions);
    await this.sessions.save(session);
    return { id: metric.id, session_id: session.id, repetitions: metric.repetitions, elbow_angle: metric.elbowAngle, phase: metric.phase, confidence: metric.confidence, recorded_at: metric.recordedAt };
  }

  async finish(id: string, dto: FinishSessionDto) {
    const session = await this.find(id);
    if (session.status !== 'active') throw new BadRequestException('Сессия уже завершена');
    session.status = 'completed'; session.repetitions = dto.repetitions;
    session.durationSeconds = dto.duration_seconds; session.averageElbowAngle = dto.average_elbow_angle ?? null;
    session.finishedAt = new Date();
    const saved = await this.sessions.save(session);
    return this.toResult(saved);
  }

  async result(id: string) {
    const session = await this.sessions.findOne({ where: { id }, relations: { metrics: true } });
    if (!session) throw new NotFoundException('Тренировочная сессия не найдена');
    return { ...this.toResult(session), metrics: (session.metrics ?? []).sort((a,b) => a.recordedAt.getTime()-b.recordedAt.getTime()).map((m) => ({ repetitions: m.repetitions, elbow_angle: m.elbowAngle, phase: m.phase, confidence: m.confidence, recorded_at: m.recordedAt })) };
  }

  async analyze(id: string) {
    const session = await this.sessions.findOne({ where: { id }, relations: { metrics: true } });
    if (!session) throw new NotFoundException('Тренировочная сессия не найдена');
    if (session.status !== 'completed') throw new BadRequestException('Сначала завершите тренировочную сессию');
    if (session.aiAssessment) return { ...JSON.parse(session.aiAssessment), cached: true };
    const result = await this.ai.analyzeSession(session);
    session.aiAssessment = JSON.stringify(result);
    await this.sessions.save(session);
    return { ...result, cached: false };
  }

  async history(limit = 20) {
    const items = await this.sessions.find({ order: { startedAt: 'DESC' }, take: limit });
    return items.map((session) => this.toResult(session));
  }

  private toResult(session: RehabSession) {
    return { id: session.id, exercise_id: session.exerciseId, status: session.status, repetitions: session.repetitions, duration_seconds: session.durationSeconds, average_elbow_angle: session.averageElbowAngle, ai_assessment: session.aiAssessment ? JSON.parse(session.aiAssessment) : null, started_at: session.startedAt, finished_at: session.finishedAt };
  }
}
