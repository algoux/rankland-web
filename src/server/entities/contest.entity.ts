import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { Contest, Contributor, Marker, Problem, RankSeries, Sorter } from '@algoux/standard-ranklist';

import { nullableOutputTransformer } from './nullable-output.transformer';

@Entity('contest')
@Index('IDX_contest_uk', ['uk'], { unique: true })
export class ContestEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', length: 64 })
  public uk: string;

  @Column({ type: 'varchar', length: 255 })
  public name: string;

  @Column({ type: 'json' })
  public contest: Contest;

  @Column({ type: 'json' })
  public problems: Problem[];

  @Column({ type: 'json' })
  public markers: Marker[];

  @Column({ type: 'json' })
  public series: RankSeries[];

  @Column({ type: 'json', nullable: true, transformer: nullableOutputTransformer })
  public sorter?: Sorter | null;

  @Column({ type: 'json', nullable: true, transformer: nullableOutputTransformer })
  public contributors?: Contributor[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  public updatedAt: Date;
}
