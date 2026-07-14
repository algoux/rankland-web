import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';
import { rankland_live_contest_common } from '@common/proto/rankland_live_contest';

@Entity('contest_event')
@Index('IDX_contest_event_contest_revision_event', ['contestId', 'streamRevision', 'eventId'], { unique: true })
@Index('IDX_contest_event_solution', ['contestId', 'solutionId'])
@Index('IDX_contest_event_type', ['contestId', 'type'])
@Index('IDX_contest_event_solution_type_lookup', ['contestId', 'streamRevision', 'type', 'solutionId'])
export class ContestEventEntity {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  public id: string;

  @Column({ name: 'contest_id', type: 'bigint', unsigned: true })
  public contestId: string;

  @Column({ name: 'event_id', type: 'int', unsigned: true })
  public eventId: number;

  @Column({ name: 'stream_revision', type: 'int', unsigned: true })
  public streamRevision: number;

  @Column({ type: 'tinyint', unsigned: true })
  public type: rankland_live_contest_common.EventType;

  @Column({ name: 'producer_id', type: 'varchar', length: 128 })
  public producerId: string;

  @Column({ name: 'solution_id', type: 'int', unsigned: true, nullable: true })
  public solutionId?: number | null;

  @Column({ name: 'user_id', type: 'varchar', length: 128, nullable: true })
  public userId?: string | null;

  @Column({ name: 'problem_alias', type: 'varchar', length: 64, nullable: true })
  public problemAlias?: string | null;

  @Column({ name: 'percentage_progress', type: 'int', unsigned: true, nullable: true })
  public percentageProgress?: number | null;

  @Column({ name: 'previous_result', type: 'tinyint', unsigned: true, nullable: true })
  public previousResult?: number | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  public result?: number | null;

  @Column({ name: 'time_ns', type: 'bigint', nullable: true })
  public timeNs?: string | null;

  @Column({ name: 'solution_submit_time_ns', type: 'bigint', nullable: true })
  public solutionSubmitTimeNs?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  public createdAt: Date;

  @Column({ name: 'payload_hash', type: 'char', length: 64 })
  public payloadHash: string;

  @Column({ name: 'payload_bytes', type: 'longblob' })
  public payloadBytes: Buffer;
}
