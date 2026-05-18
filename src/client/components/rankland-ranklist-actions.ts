import type * as srk from '@algoux/standard-ranklist';
import { ranklandRoutes } from '@common/rankland-router';

export type RanklandEmbedKind = 'ranklist' | 'live';

export interface SrkExportFile {
  filename: string;
  content: string;
  type: string;
}

export function createSrkExportFile(ranklist: srk.Ranklist, name: string): SrkExportFile {
  return {
    filename: `${name}.srk.json`,
    content: JSON.stringify(ranklist),
    type: 'application/json;charset=utf-8',
  };
}

export function normalizeRanklandShareUrl(fullUrl: string): string {
  const url = new URL(fullUrl);
  url.searchParams.delete('focus');
  url.searchParams.delete('\u805a\u7126');

  const search = url.searchParams.toString();
  return `${url.protocol}//${url.host}${url.pathname}${search ? `?${search}` : ''}${url.hash}`;
}

export function buildRanklandEmbedCode(opts: { origin: string; kind: RanklandEmbedKind; id: string }): string {
  const origin = opts.origin.replace(/\/+$/, '');
  const path =
    opts.kind === 'live'
      ? ranklandRoutes.live.build({ id: opts.id, focus: 'yes' })
      : ranklandRoutes.ranklist.build({ id: opts.id, focus: 'yes' });

  return `<iframe src="${origin}${path}" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width: 100%; height: 600px"></iframe>`;
}
