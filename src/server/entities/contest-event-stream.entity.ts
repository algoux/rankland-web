import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('contest_event_stream')
export class ContestEventStreamEntity {
  @PrimaryColumn({ name: 'contest_id', type: 'bigint', unsigned: true })
  public contestId: string;

  @Column({ name: 'last_event_id', type: 'int', unsigned: true, default: 0 })
  public lastEventId: number;

  @Column({ name: 'stream_revision', type: 'int', unsigned: true, default: 1 })
  public streamRevision: number;

  @Column({ name: 'producer_id', type: 'varchar', length: 128, nullable: true })
  public producerId?: string | null;

  @Column({ name: 'producer_locked_at', type: 'datetime', precision: 6, nullable: true })
  public producerLockedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  public createdAt: Date;

  // Let MySQL own updates: TypeORM 0.3.26 emits second-precision CURRENT_TIMESTAMP for UpdateDateColumn.
  @Column({
    name: 'updated_at',
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    update: false,
  })
  public updatedAt: Date;
}
