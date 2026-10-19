import type { ApiService } from '@/services/ranklist-api';
import type {
  LiveContestConfig,
  LiveContestTransport,
} from '@/services/ranklist-api/live-contest-types';

export interface LivePageData {
  requestedUk: string;
  config: LiveContestConfig;
}

export async function loadLivePageData({
  api,
  id,
}: {
  api: ApiService;
  id: string;
}): Promise<LivePageData> {
  const transport = createLiveContestTransport(api);
  return {
    requestedUk: id,
    config: await transport.getContest(id),
  };
}

export function createLiveContestTransport(api: ApiService): LiveContestTransport {
  return api.createLiveContestTransport(async (bytes) => {
    const { decodeLiveContestEventPage } = await import(
      '@/services/ranklist-api/live-contest-protobuf'
    );
    return decodeLiveContestEventPage(bytes);
  });
}
