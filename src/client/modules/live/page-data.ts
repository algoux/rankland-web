import type { Ranklist } from '@algoux/standard-ranklist';
import type { ApiService, IApiLiveRanklistInfo } from '@/services/ranklist-api';

export interface LivePageData {
  liveInfo: IApiLiveRanklistInfo;
  ranklist: Ranklist;
}

export async function loadLivePageData({
  api,
  id,
  token,
}: {
  api: ApiService;
  id: string;
  token?: string;
}): Promise<LivePageData> {
  const liveInfo = await api.getLiveRanklistInfo({ uniqueKey: id });
  const ranklist = await api.getLiveRanklist({ id: liveInfo.id, token });
  return {
    liveInfo,
    ranklist,
  };
}
