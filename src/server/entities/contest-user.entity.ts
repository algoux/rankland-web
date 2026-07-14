import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';
import type { ExternalUser, Image, I18NStringSet, Text } from '@algoux/standard-ranklist';

import { nullableOutputTransformer } from './nullable-output.transformer';
import { stringOrJsonTransformer } from './string-or-json.transformer';

@Entity('contest_user')
@Index('IDX_contest_user_contest_user', ['contestId', 'userId'], { unique: true })
@Index('IDX_contest_user_sort', ['contestId', 'sortIndex'])
@Index('IDX_contest_user_official', ['contestId', 'official'])
@Index('IDX_contest_user_banned', ['contestId', 'banned'])
export class ContestUserEntity {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  public id: string;

  @Column({ name: 'contest_id', type: 'bigint', unsigned: true })
  public contestId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 128 })
  public userId: string;

  @Column({ type: 'text', transformer: stringOrJsonTransformer })
  public name: Text | I18NStringSet;

  @Column({ type: 'text', nullable: true, transformer: [nullableOutputTransformer, stringOrJsonTransformer] })
  public avatar?: Image | string | null;

  @Column({ type: 'text', nullable: true, transformer: [nullableOutputTransformer, stringOrJsonTransformer] })
  public photo?: Image | string | null;

  @Column({ type: 'text', nullable: true, transformer: [nullableOutputTransformer, stringOrJsonTransformer] })
  public organization?: Text | I18NStringSet | null;

  @Column({ type: 'varchar', length: 255, nullable: true, transformer: nullableOutputTransformer })
  public location?: string | null;

  @Column({ name: 'team_members', type: 'json', nullable: true, transformer: nullableOutputTransformer })
  public teamMembers?: ExternalUser[] | null;

  @Column({ type: 'json', nullable: true, transformer: nullableOutputTransformer })
  public markers?: string[] | null;

  @Column({ type: 'boolean', default: true })
  public official: boolean;

  @Column({ type: 'boolean', default: false })
  public banned: boolean;

  @Column({ name: 'broadcaster_token', type: 'varchar', length: 255, nullable: true, transformer: nullableOutputTransformer })
  public broadcasterToken?: string | null;

  @Column({ name: 'sort_index', type: 'int', unsigned: true })
  public sortIndex: number;

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
