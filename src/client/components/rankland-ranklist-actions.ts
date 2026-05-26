import type * as srk from '@algoux/standard-ranklist';
import { ranklandRoutes } from '@common/rankland-router';

export type RanklandEmbedKind = 'ranklist' | 'live';

export interface SrkExportFile {
  filename: string;
  content: string;
  type: string;
}

type RanklistWithRuntimeNow = srk.Ranklist & { _now?: unknown };

export function createRanklistExportData(ranklist: srk.Ranklist): srk.Ranklist {
  const exportData = { ...(ranklist as RanklistWithRuntimeNow) };
  delete exportData._now;
  return exportData as srk.Ranklist;
}

export function createSrkExportFile(ranklist: srk.Ranklist, name: string): SrkExportFile {
  return {
    filename: `${name}.srk.json`,
    content: JSON.stringify(createRanklistExportData(ranklist)),
    type: 'application/json;charset=utf-8',
  };
}

export interface TextExportFile extends SrkExportFile {
  encoding?: string;
}

async function importRanklistConverters() {
  return import('@algoux/standard-ranklist-convert-to');
}

export async function createGymGhostExportFile(ranklist: srk.Ranklist, name: string): Promise<TextExportFile> {
  const { CodeforcesGymGhostDATConverter } = await importRanklistConverters();
  const file = new CodeforcesGymGhostDATConverter().convert(createRanklistExportData(ranklist));

  return {
    filename: `${name}_gymghost.${file.ext}`,
    content: file.content,
    type: 'text/plain;charset=utf-8',
    encoding: file.encoding,
  };
}

export async function createVJudgeReplayWorkbook(ranklist: srk.Ranklist) {
  const { VJudgeReplayConverter } = await importRanklistConverters();
  return new VJudgeReplayConverter().convert(createRanklistExportData(ranklist));
}

export async function createGeneralExcelWorkbook(ranklist: srk.Ranklist) {
  const { GeneralExcelConverter } = await importRanklistConverters();
  return new GeneralExcelConverter().convert(createRanklistExportData(ranklist));
}

export async function writeVJudgeReplayFile(ranklist: srk.Ranklist, name: string) {
  const { VJudgeReplayConverter } = await importRanklistConverters();
  return new VJudgeReplayConverter().convertAndWrite(createRanklistExportData(ranklist), `${name}_vjreplay.xlsx`);
}

export async function writeGeneralExcelFile(ranklist: srk.Ranklist, name: string) {
  const { GeneralExcelConverter } = await importRanklistConverters();
  return new GeneralExcelConverter().convertAndWrite(createRanklistExportData(ranklist), `${name}.xlsx`);
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
