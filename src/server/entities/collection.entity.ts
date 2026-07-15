import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

import { mysqlJsonValueTransformer } from './mysql-json-value.transformer';

@Entity('collection')
@Index('IDX_collection_uk', ['uk'], { unique: true })
export class CollectionEntity {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  public id: string;

  @Column({ type: 'varchar', length: 64 })
  public uk: string;

  @Column({ type: 'json', transformer: mysqlJsonValueTransformer })
  public content: unknown;

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
