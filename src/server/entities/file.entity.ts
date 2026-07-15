import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('file')
@Index('IDX_file_contest_id', ['contestId'])
export class FileEntity {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  public id: string;

  @Column({ name: 'contest_id', type: 'bigint', unsigned: true })
  public contestId: string;

  @Column({ type: 'varchar', length: 32, default: '' })
  public category: string;

  @Column({ type: 'varchar', length: 256 })
  public name: string;

  @Column({ type: 'varchar', length: 256 })
  public path: string;

  @Column({ type: 'int', unsigned: true })
  public size: number;

  @Column({ name: 'hash_type', type: 'varchar', length: 32 })
  public hashType: string;

  @Column({ name: 'hash_value', type: 'varchar', length: 128 })
  public hashValue: string;

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

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', precision: 6, nullable: true })
  public deletedAt: Date | null;
}
