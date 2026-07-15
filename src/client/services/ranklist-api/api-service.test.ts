import { describe, expect, it, vi } from 'vitest';
import { ErrCode } from '@common/enums/err-code.enum';
import { ApiException, HttpException } from './request';
import { LogicException, LogicExceptionKind } from './logic-exception';
import { ApiService } from './api-service';
import type { RanklandRequestAdapter } from './types';

type GetMock = ReturnType<typeof vi.fn>;

function makeAdapter(getMock: GetMock): RanklandRequestAdapter {
  return { get: getMock } as unknown as RanklandRequestAdapter;
}

function buildService(apiGet: GetMock = vi.fn()) {
  const service = new ApiService({
    legacyApi: makeAdapter(apiGet),
    apiClient: {
      getPublicContest: vi.fn(),
      getPublicFile: vi.fn(),
      getPublicContests: vi.fn(),
      getPublicCollection: vi.fn(),
      getPublicStatistics: vi.fn(),
    } as any,
  });
  return { service, apiGet };
}

describe('ApiService legacy Rankland API boundary', () => {
  it('translates missing live ranklist info into LogicException(NotFound)', async () => {
    const { service: apiMissing } = buildService(vi.fn().mockRejectedValue(new ApiException(11, 'not found')));
    const { service: contestMissing } = buildService(
      vi.fn().mockRejectedValue(new ApiException(ErrCode.ContestNotFound, 'not found')),
    );
    const { service: httpMissing } = buildService(
      vi.fn().mockRejectedValue(new HttpException(404, 'Not Found')),
    );

    await expect(apiMissing.getLiveRanklistInfo({ uniqueKey: 'missing-live' })).rejects.toMatchObject({
      name: 'LogicException',
      kind: LogicExceptionKind.NotFound,
    });
    await expect(contestMissing.getLiveRanklistInfo({ uniqueKey: 'missing-live' })).rejects.toMatchObject({
      name: 'LogicException',
      kind: LogicExceptionKind.NotFound,
    });
    await expect(httpMissing.getLiveRanklistInfo({ uniqueKey: 'missing-live' })).rejects.toBeInstanceOf(LogicException);
  });

  it('translates missing live ranklist snapshots into LogicException(NotFound)', async () => {
    const { service: apiMissing } = buildService(vi.fn().mockRejectedValue(new ApiException(11, 'not found')));
    const { service: contestMissing } = buildService(
      vi.fn().mockRejectedValue(new ApiException(ErrCode.ContestNotFound, 'not found')),
    );
    const { service: httpMissing } = buildService(
      vi.fn().mockRejectedValue(new HttpException(404, 'Not Found')),
    );

    await expect(apiMissing.getLiveRanklist({ id: 'missing-live' })).rejects.toMatchObject({
      name: 'LogicException',
      kind: LogicExceptionKind.NotFound,
    });
    await expect(contestMissing.getLiveRanklist({ id: 'missing-live' })).rejects.toMatchObject({
      name: 'LogicException',
      kind: LogicExceptionKind.NotFound,
    });
    await expect(httpMissing.getLiveRanklist({ id: 'missing-live' })).rejects.toBeInstanceOf(LogicException);
  });

  it('keeps only the explicitly excluded routes on the legacy request adapter', async () => {
    const apiGet = vi.fn().mockResolvedValue({ ranks: [] });
    const { service } = buildService(apiGet);

    await service.searchRanklist({ kw: 'hello' });
    await service.getLiveRanklistInfo({ uniqueKey: 'live-key' });
    await service.getLiveRanklist({ id: 'live-id', token: 't0k3n' });

    expect(apiGet.mock.calls[0][0]).toBe('/rank/search?query=hello');
    expect(apiGet.mock.calls[1][0]).toMatch(/^\/ranking\/config\/live-key\?_t=\d+$/);
    expect(apiGet.mock.calls[2][0]).toMatch(/^\/ranking\/live-id\?token=t0k3n&_t=\d+$/);
  });
});
