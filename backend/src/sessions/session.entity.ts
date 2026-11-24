import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SessionMetric } from './session-metric.entity';

@Entity('training_sessions')
export class RehabSession {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'exercise_id' }) exerciseId: string;
  @Column({ default: 'active' }) status: 'active' | 'completed';
  @Column({ default: 0 }) repetitions: number;
  @Column({ name: 'duration_seconds', default: 0 }) durationSeconds: number;
  @Column({ name: 'average_elbow_angle', type: 'real', nullable: true }) averageElbowAngle: number | null;
  @Column({ name: 'ai_assessment', type: 'text', nullable: true }) aiAssessment: string | null;
  @CreateDateColumn({ name: 'started_at' }) startedAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @Column({ name: 'finished_at', type: 'datetime', nullable: true }) finishedAt: Date | null;
  @OneToMany(() => SessionMetric, (metric) => metric.session, { cascade: true }) metrics: SessionMetric[];
}
