import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('id_worker_registry')
@Index('IDX_id_worker_registry_worker_reserved', ['workerId', 'reservedUntilMs'])
export class IdWorkerRegistryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  public id: string;

  @Column({ name: 'worker_id', type: 'smallint', unsigned: true, nullable: true })
  public workerId?: number | null;

  @Column({ name: 'reserved_until_ms', type: 'bigint', unsigned: true, nullable: true })
  public reservedUntilMs?: string | null;

  @Column({ type: 'varchar', length: 255 })
  public host: string;

  @Column({ type: 'int', unsigned: true })
  public pid: number;

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
