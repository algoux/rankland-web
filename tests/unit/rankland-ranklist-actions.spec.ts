import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import fixture from '../fixtures/ranklist.srk.json';
import {
  buildRanklandEmbedCode,
  createGeneralExcelWorkbook,
  createGymGhostExportFile,
  createSrkExportFile,
  createVJudgeReplayWorkbook,
  normalizeRanklandShareUrl,
} from '@client/components/rankland-ranklist-actions';

describe('rankland ranklist browser actions', () => {
  it('builds standard SRK export file metadata', () => {
    const file = createSrkExportFile(fixture as srk.Ranklist, 'test-key');

    expect(file.filename).toBe('test-key.srk.json');
    expect(file.type).toBe('application/json;charset=utf-8');
    expect(JSON.parse(file.content).contest.title).toBe('Test Contest 2024');
  });

  it('strips the legacy live-only _now field from exported SRK JSON', () => {
    const ranklist = {
      ...JSON.parse(JSON.stringify(fixture)),
      _now: '2024-01-01T00:00:00.000Z',
    } as srk.Ranklist & { _now: string };

    const file = createSrkExportFile(ranklist, 'live-test-key');

    expect(JSON.parse(file.content)).not.toHaveProperty('_now');
    expect(ranklist._now).toBe('2024-01-01T00:00:00.000Z');
  });

  it('builds Codeforces Gym Ghost DAT export metadata', async () => {
    const file = await createGymGhostExportFile(fixture as srk.Ranklist, 'test-key');

    expect(file.filename).toBe('test-key_gymghost.dat');
    expect(file.type).toBe('text/plain;charset=utf-8');
    expect(file.content).toContain('@contest "Test Contest 2024"');
    expect(file.content).toContain('@teams 2');
    expect(file.content).toContain('Team Alpha');
  });

  it('builds VJudge Replay workbook content', async () => {
    const workbook = await createVJudgeReplayWorkbook(fixture as srk.Ranklist);
    const sheet = workbook.Sheets.Main;

    expect(workbook.SheetNames).toEqual(['Main']);
    expect(sheet.A1.v).toContain('Team Alpha');
    expect(sheet.B1.v).toContain('/');
  });

  it('builds general Excel workbook content', async () => {
    const workbook = await createGeneralExcelWorkbook(fixture as srk.Ranklist);

    expect(workbook.SheetNames).toContain('Main');
    expect(workbook.SheetNames).toContain('Official');
    expect(workbook.SheetNames).toContain('Unofficial');
    expect(workbook.Sheets.Main.A1.v).toBe('Rank');
  });

  it('removes focus-only query keys from copied page links', () => {
    const url = normalizeRanklandShareUrl(
      'https://rl.algoux.org/live/live-test-key?token=t0&focus=yes&scrollSolution=1&%E8%81%9A%E7%84%A6=yes',
    );

    expect(url).toBe('https://rl.algoux.org/live/live-test-key?token=t0&scrollSolution=1');
  });

  it('builds ranklist and live embed iframe snippets with focus mode enabled', () => {
    expect(
      buildRanklandEmbedCode({
        origin: 'https://rl.algoux.org',
        kind: 'ranklist',
        id: 'test-key',
      }),
    ).toBe(
      '<iframe src="https://rl.algoux.org/ranklist/test-key?focus=yes" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width: 100%; height: 600px"></iframe>',
    );

    expect(
      buildRanklandEmbedCode({
        origin: 'https://rl.algoux.org',
        kind: 'live',
        id: 'live-test-key',
      }),
    ).toBe(
      '<iframe src="https://rl.algoux.org/live/live-test-key?focus=yes" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width: 100%; height: 600px"></iframe>',
    );
  });
});
