import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RehabSession } from './session.entity';

@Entity('session_metrics')
export class SessionMetric {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => RehabSession, (session) => session.metrics, { onDelete: 'CASCADE' }) session: RehabSession;
  @Column() repetitions: number;
  @Column({ name: 'elbow_angle', type: 'real', nullable: true }) elbowAngle: number | null;
  @Column() phase: string;
  @Column({ type: 'real' }) confidence: number;
  @CreateDateColumn({ name: 'recorded_at' }) recordedAt: Date;
}
