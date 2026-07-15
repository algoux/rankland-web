import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';
import type * as srk from '@algoux/standard-ranklist';

import { nullableOutputTransformer } from './nullable-output.transformer';

@Entity('contest')
@Index('IDX_contest_uk', ['uk'], { unique: true })
export class ContestEntity {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  public id: string;

  @Column({ type: 'varchar', length: 64 })
  public uk: string;

  @Column({ type: 'varchar', length: 255 })
  public name: string;

  @Column({ type: 'json' })
  public title: srk.I18NStringSet;

  @Column({ name: 'start_at', type: 'datetime', precision: 0 })
  public startAt: Date;

  @Column({ name: 'duration_s', type: 'int', unsigned: true })
  public durationS: number;

  @Column({ name: 'frozen_duration_s', type: 'int', unsigned: true, nullable: true })
  public frozenDurationS: number | null;

  @Column({ type: 'json', nullable: true })
  public banner: srk.Contest['banner'] | null;

  @Column({ name: 'ref_links', type: 'json', nullable: true })
  public refLinks: srk.Contest['refLinks'] | null;

  @Column({ type: 'json', nullable: true })
  public problems: srk.Problem[] | null;

  @Column({ type: 'json', nullable: true })
  public markers: srk.Marker[] | null;

  @Column({ type: 'json', nullable: true })
  public series: srk.RankSeries[] | null;

  @Column({ type: 'json', nullable: true })
  public sorter: srk.Sorter | null;

  @Column({ type: 'json', nullable: true, transformer: nullableOutputTransformer })
  public contributors?: srk.Contributor[] | null;

  @Column({ name: 'srk_file_id', type: 'bigint', unsigned: true, nullable: true })
  public srkFileId: string | null;

  @Column({ name: 'view_count', type: 'int', unsigned: true, default: 0 })
  public viewCount: number;

  @Column({ name: 'redirect_uk', type: 'varchar', length: 64, nullable: true })
  public redirectUk: string | null;

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
