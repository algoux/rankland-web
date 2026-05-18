import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import fixture from '../fixtures/ranklist.srk.json';
import {
  buildRanklandEmbedCode,
  createSrkExportFile,
  normalizeRanklandShareUrl,
} from '@client/components/rankland-ranklist-actions';

describe('rankland ranklist browser actions', () => {
  it('builds standard SRK export file metadata', () => {
    const file = createSrkExportFile(fixture as srk.Ranklist, 'test-key');

    expect(file.filename).toBe('test-key.srk.json');
    expect(file.type).toBe('application/json;charset=utf-8');
    expect(JSON.parse(file.content).contest.title).toBe('Test Contest 2024');
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
