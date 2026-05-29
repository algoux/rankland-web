import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('contest_event_stream')
export class ContestEventStreamEntity {
  @PrimaryColumn({ name: 'contest_id', type: 'varchar', length: 36 })
  public contestId: string;

  @Column({ name: 'last_event_id', type: 'int', unsigned: true, default: 0 })
  public lastEventId: number;

  @Column({ name: 'stream_revision', type: 'int', unsigned: true, default: 1 })
  public streamRevision: number;

  @Column({ name: 'producer_id', type: 'varchar', length: 128, nullable: true })
  public producerId?: string | null;

  @Column({ name: 'producer_locked_at', type: 'datetime', precision: 3, nullable: true })
  public producerLockedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  public updatedAt: Date;
}
