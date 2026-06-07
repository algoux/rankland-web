# Converter-Backed Exports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Codeforces Gym Ghost DAT, Virtual Judge Replay XLSX, and general Excel XLSX exports in the shared Vue ranklist wrapper.

**Architecture:** Add the old framework-neutral converter package as a production dependency, then lazy-load it from browser click handlers so SSR and initial route rendering do not evaluate `xlsx`. Keep deterministic filename/status logic in the existing ranklist action helper and keep browser side effects in `rankland-ranklist.vue`.

**Tech Stack:** Vue 3 Options API, Vite SSR, `@algoux/standard-ranklist-convert-to@0.2.2`, `xlsx@0.18.5`, Vitest, Playwright full-chain E2E.

---

## File Map

- Modify `package.json` and `pnpm-lock.yaml` to add `@algoux/standard-ranklist-convert-to@0.2.2`.
- Modify `src/client/components/rankland-ranklist-actions.ts` with lazy converter helpers and export file metadata types.
- Modify `tests/unit/rankland-ranklist-actions.spec.ts` with converter-backed export assertions.
- Modify `src/client/components/rankland-ranklist.vue` to enable the three buttons and call the helpers.
- Modify `tests/e2e/full-chain/ranklist.spec.ts` to cover Gym Ghost, VJudge Replay, and Excel downloads on `/ranklist/:id`.
- Modify `tests/e2e/full-chain/live.spec.ts` to cover enabled converter-backed actions on `/live/:id`.
- Update `docs/migration/status.md` after the implementation slice is verified.

## Task 1: Dependency Boundary

- [ ] **Step 1: Add the converter package**

Run:

```bash
corepack pnpm add @algoux/standard-ranklist-convert-to@0.2.2
```

Expected: `package.json` gains `@algoux/standard-ranklist-convert-to` and `pnpm-lock.yaml` gains the converter plus `xlsx@0.18.5`.

- [ ] **Step 2: Inspect dependency resolution**

Run:

```bash
corepack pnpm why @algoux/standard-ranklist-convert-to xlsx @algoux/standard-ranklist-utils
```

Expected: the converter resolves as a production dependency; `xlsx@0.18.5` is only present through the converter; no React dependencies are introduced.

- [ ] **Step 3: Commit dependency boundary if desired**

Run:

```bash
git diff -- package.json pnpm-lock.yaml
git add package.json pnpm-lock.yaml
git commit -m "chore: 添加榜单转换导出依赖"
```

Expected: a small dependency-only commit. Skip this commit if the implementation owner prefers a single feature commit.

## Task 2: Converter Helper Tests

- [ ] **Step 1: Extend `tests/unit/rankland-ranklist-actions.spec.ts` imports**

Use this import block:

```ts
import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import fixture from '../fixtures/ranklist.srk.json';
import {
  buildRanklandEmbedCode,
  createGymGhostExportFile,
  createSrkExportFile,
  createVJudgeReplayWorkbook,
  createGeneralExcelWorkbook,
  normalizeRanklandShareUrl,
} from '@client/components/rankland-ranklist-actions';
```

- [ ] **Step 2: Add failing helper tests**

Append these tests inside `describe('rankland ranklist browser actions', () => { ... })`:

```ts
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
```

- [ ] **Step 3: Run RED unit test**

Run:

```bash
corepack pnpm exec vitest run tests/unit/rankland-ranklist-actions.spec.ts
```

Expected: FAIL because the new helper exports do not exist.

## Task 3: Converter Helper Implementation

- [ ] **Step 1: Add converter helper types and functions to `src/client/components/rankland-ranklist-actions.ts`**

Add below `createSrkExportFile`:

```ts
export interface TextExportFile extends SrkExportFile {
  encoding?: string;
}

async function importRanklistConverters() {
  return import('@algoux/standard-ranklist-convert-to');
}

export async function createGymGhostExportFile(ranklist: srk.Ranklist, name: string): Promise<TextExportFile> {
  const { CodeforcesGymGhostDATConverter } = await importRanklistConverters();
  const file = new CodeforcesGymGhostDATConverter().convert(ranklist);

  return {
    filename: `${name}_gymghost.${file.ext}`,
    content: file.content,
    type: 'text/plain;charset=utf-8',
    encoding: file.encoding,
  };
}

export async function createVJudgeReplayWorkbook(ranklist: srk.Ranklist) {
  const { VJudgeReplayConverter } = await importRanklistConverters();
  return new VJudgeReplayConverter().convert(ranklist);
}

export async function createGeneralExcelWorkbook(ranklist: srk.Ranklist) {
  const { GeneralExcelConverter } = await importRanklistConverters();
  return new GeneralExcelConverter().convert(ranklist);
}

export async function writeVJudgeReplayFile(ranklist: srk.Ranklist, name: string) {
  const { VJudgeReplayConverter } = await importRanklistConverters();
  return new VJudgeReplayConverter().convertAndWrite(ranklist, `${name}_vjreplay.xlsx`);
}

export async function writeGeneralExcelFile(ranklist: srk.Ranklist, name: string) {
  const { GeneralExcelConverter } = await importRanklistConverters();
  return new GeneralExcelConverter().convertAndWrite(ranklist, `${name}.xlsx`);
}
```

- [ ] **Step 2: Run helper tests**

Run:

```bash
corepack pnpm exec vitest run tests/unit/rankland-ranklist-actions.spec.ts
```

Expected: PASS. If `workbook.Sheets.Main.A1.v` differs because fixture headers differ, inspect the actual cell and adjust only the expected fixture-specific assertion.

## Task 4: Vue Wrapper Integration

- [ ] **Step 1: Extend `rankland-ranklist.vue` helper imports**

Use this helper import block:

```ts
import {
  buildRanklandEmbedCode,
  createGymGhostExportFile,
  createSrkExportFile,
  normalizeRanklandShareUrl,
  type RanklandEmbedKind,
  writeGeneralExcelFile,
  writeVJudgeReplayFile,
} from './rankland-ranklist-actions';
```

- [ ] **Step 2: Enable the three converter buttons**

Replace the disabled buttons with:

```vue
              <button data-id="rankland-ranklist-export-gym-ghost-action" type="button" @click="downloadGymGhostDat">
                Codeforces Gym Ghost (dat)
              </button>
              <button data-id="rankland-ranklist-export-vjudge-action" type="button" @click="downloadVJudgeReplay">
                Virtual Judge Replay (xlsx)
              </button>
              <button data-id="rankland-ranklist-export-xlsx-action" type="button" @click="downloadGeneralExcel">
                Excel 表格 (xlsx)
              </button>
```

- [ ] **Step 3: Add methods below `downloadSrkJson()`**

Add:

```ts
    async downloadGymGhostDat() {
      try {
        const file = await createGymGhostExportFile(this.ranklist, this.actionName);
        const blob = new Blob([file.content], { type: file.type });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = file.filename;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
        this.actionStatus = 'Gym Ghost 已导出';
      } catch (error) {
        this.actionStatus = 'Gym Ghost 导出失败';
      }
    },
    async downloadVJudgeReplay() {
      try {
        await writeVJudgeReplayFile(this.ranklist, this.actionName);
        this.actionStatus = 'VJudge Replay 已导出';
      } catch (error) {
        this.actionStatus = 'VJudge Replay 导出失败';
      }
    },
    async downloadGeneralExcel() {
      try {
        await writeGeneralExcelFile(this.ranklist, this.actionName);
        this.actionStatus = 'Excel 已导出';
      } catch (error) {
        this.actionStatus = 'Excel 导出失败';
      }
    },
```

- [ ] **Step 4: Run focused unit tests**

Run:

```bash
corepack pnpm exec vitest run tests/unit/rankland-ranklist-actions.spec.ts tests/unit/rankland-ranklist-state.spec.ts
```

Expected: PASS.

## Task 5: Full-Chain Ranklist Coverage

- [ ] **Step 1: Extend `/ranklist/:id` E2E export assertions**

In `tests/e2e/full-chain/ranklist.spec.ts`, after the SRK download assertion, add:

```ts
    const gymGhostDownloadPromise = page.waitForEvent('download');
    await page.locator('[data-id="rankland-ranklist-export-gym-ghost-action"]').click();
    const gymGhostDownload = await gymGhostDownloadPromise;
    expect(gymGhostDownload.suggestedFilename()).toBe('test-key_gymghost.dat');
    const gymGhostDownloadPath = await gymGhostDownload.path();
    expect(gymGhostDownloadPath).not.toBeNull();
    const gymGhostContent = await readFile(gymGhostDownloadPath!, 'utf8');
    expect(gymGhostContent).toContain('@contest "Test Contest 2024"');
    expect(gymGhostContent).toContain('Team Alpha');
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('Gym Ghost 已导出');

    const vjudgeDownloadPromise = page.waitForEvent('download');
    await page.locator('[data-id="rankland-ranklist-export-vjudge-action"]').click();
    const vjudgeDownload = await vjudgeDownloadPromise;
    expect(vjudgeDownload.suggestedFilename()).toBe('test-key_vjreplay.xlsx');
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('VJudge Replay 已导出');

    const excelDownloadPromise = page.waitForEvent('download');
    await page.locator('[data-id="rankland-ranklist-export-xlsx-action"]').click();
    const excelDownload = await excelDownloadPromise;
    expect(excelDownload.suggestedFilename()).toBe('test-key.xlsx');
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('Excel 已导出');
```

- [ ] **Step 2: Run ranklist full-chain E2E**

Run:

```bash
FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/ranklist.spec.ts
```

Expected: PASS.

## Task 6: Full-Chain Live Coverage

- [ ] **Step 1: Extend `/live/:id` E2E export assertions**

In `tests/e2e/full-chain/live.spec.ts`, after asserting the export menu is visible, add:

```ts
    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').click();
    await expect(page.locator('[data-id="rankland-ranklist-export-gym-ghost-action"]')).toBeEnabled();
    await expect(page.locator('[data-id="rankland-ranklist-export-vjudge-action"]')).toBeEnabled();
    await expect(page.locator('[data-id="rankland-ranklist-export-xlsx-action"]')).toBeEnabled();

    const liveGymGhostDownloadPromise = page.waitForEvent('download');
    await page.locator('[data-id="rankland-ranklist-export-gym-ghost-action"]').click();
    const liveGymGhostDownload = await liveGymGhostDownloadPromise;
    expect(liveGymGhostDownload.suggestedFilename()).toBe('live-test-key_gymghost.dat');
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('Gym Ghost 已导出');
```

- [ ] **Step 2: Run live full-chain E2E**

Run:

```bash
FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts
```

Expected: PASS.

## Task 7: Wide Verification And Commit

- [ ] **Step 1: Confirm runtime**

Run:

```bash
node -v
corepack pnpm -v
```

Expected: Node `v24.x` and pnpm `8.15.9`.

- [ ] **Step 2: Run build**

Run:

```bash
corepack pnpm run build
```

Expected: PASS. Inspect generated output for a separate converter/xlsx chunk if Vite prints chunk information.

- [ ] **Step 3: Run migration gate**

Run:

```bash
corepack pnpm test:migration
```

Expected: PASS.

- [ ] **Step 4: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 5: Update migration status**

Update `docs/migration/status.md`:

- mark SRK Vue wrapper as including converter-backed exports;
- remove converter-backed exports from known risks once verified;
- set the latest slice commit message to `feat: 补齐 converter-backed 榜单导出`.

- [ ] **Step 6: Review and commit**

Run:

```bash
git diff --stat
git add package.json pnpm-lock.yaml src/client/components/rankland-ranklist-actions.ts src/client/components/rankland-ranklist.vue tests/unit/rankland-ranklist-actions.spec.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts docs/migration/status.md
git commit -m "feat: 补齐 converter-backed 榜单导出"
```

Expected: one verified feature commit.
