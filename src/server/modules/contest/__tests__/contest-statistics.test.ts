import { describe, expect, it, vi } from 'vitest';
import ContestService from '../contest.service';

function createService(rawAggregate: unknown) {
  const getRawOne = vi.fn(async () => rawAggregate);
  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    addSelect: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    getRawOne,
  };
  const repository = {
    createQueryBuilder: vi.fn(() => queryBuilder),
  };
  const typeOrmClient = {
    getDataSource: () => ({
      getRepository: vi.fn(() => repository),
    }),
  };

  return {
    service: new ContestService(typeOrmClient as any, {} as any),
    queryBuilder,
  };
}

describe('ContestService public statistics', () => {
  it('returns zeroes for an empty aggregate', async () => {
    const { service } = createService(undefined);

    await expect(service.getPublicStatistics()).resolves.toEqual({
      totalSrkCount: 0,
      totalViewCount: 0,
    });
  });

  it('counts and sums only active contests with an SRK file', async () => {
    const { service, queryBuilder } = createService({
      totalSrkCount: '2',
      totalViewCount: '17',
    });

    await expect(service.getPublicStatistics()).resolves.toEqual({
      totalSrkCount: 2,
      totalViewCount: 17,
    });
    expect(queryBuilder.where).toHaveBeenCalledWith('`contest`.`deleted_at` IS NULL');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('`contest`.`srk_file_id` IS NOT NULL');
  });
});
