import { describe, expect, it, vi } from 'vitest';
import { getMetadataArgsStorage, type QueryRunner } from 'typeorm';
import { ContestStatus } from '@common/modules/contest/contest-status';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestFinalization1792800000000 } from './migrations/1792800000000-ContestFinalization';

describe('Contest finalization migration', () => {
  it('adds created-by-default numeric status before backfilling all existing SRK associations', async () => {
    const query = vi.fn(async (_sql: string) => undefined);
    await new ContestFinalization1792800000000().up({ query } as unknown as QueryRunner);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0][0]).toMatch(/ALTER TABLE `contest` ADD `status` tinyint UNSIGNED NOT NULL DEFAULT 0/i);
    const backfill = query.mock.calls[1][0] as string;
    expect(backfill).toMatch(/UPDATE `contest` SET `status` = 99/);
    expect(backfill).toMatch(/WHERE `srk_file_id` IS NOT NULL\s*$/);
    expect(backfill).not.toMatch(/deleted_at/i);
    expect(backfill).toContain('`updated_at` = `updated_at`');
  });

  it('maps entity status to an unsigned tinyint with numeric Created default', () => {
    const status = getMetadataArgsStorage().columns.find((column) =>
      column.target === ContestEntity && column.propertyName === 'status',
    );
    expect(status?.options).toMatchObject({ type: 'tinyint', unsigned: true, default: 0 });
    expect(status?.options.default).toBe(ContestStatus.Created);
    expect(ContestStatus.Finalized).toBe(99);
  });

  it('drops only the lifecycle column on rollback without touching file references or event data', async () => {
    const query = vi.fn(async (_sql: string) => undefined);
    await new ContestFinalization1792800000000().down({ query } as unknown as QueryRunner);
    expect(query).toHaveBeenCalledOnce();
    expect(query).toHaveBeenCalledWith('ALTER TABLE `contest` DROP COLUMN `status`');
  });
});
