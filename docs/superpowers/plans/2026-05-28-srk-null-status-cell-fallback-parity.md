# SRK Null Status Cell Fallback Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React SRK table fallback text for legal `result: null` problem status cells.

**Architecture:** Add a local `RanklandStatusCell` component and pass it through the renderer `status-cell` slot. Add a full-chain mock SRK variant so the behavior is proved through the public `/ranklist/:id` route rather than by patching package internals.

**Tech Stack:** Vue 3, `@algoux/standard-ranklist-renderer-component-vue`, SRK renderer core utilities, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: RED - capture null status fallback parity

**Files:**
- Modify: `tests/e2e/support/start-full-chain-e2e.js`
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add a null-status mock fixture variant**

In `tests/e2e/support/start-full-chain-e2e.js`, add a helper that clones `srk` and changes Team Beta's Problem B status to `result: null`.

- [x] **Step 2: Route the mock key**

In the same mock server, return a dedicated ranklist info object for `/rank/null-status-key` with `fileID: "file-null-status-1"`, and return the cloned SRK variant from `/file/download?id=file-null-status-1`.

- [x] **Step 3: Add the full-chain assertion**

Add a Ranklist full-chain test:

```ts
test('renders old React problem alias fallback for null status cells', async ({ page, request }) => {
  await request.post(`${mockBaseURL}/__reset`);
  await denyExternalCalls(page);

  const response = await page.goto('/ranklist/null-status-key?focus=yes');

  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-id="rankland-ranklist-title"]')).toHaveText('Test Contest 2024');
  const nullStatusCell = page.locator('tr', { hasText: 'Team Beta' }).locator('td').last();
  await expect(nullStatusCell).toHaveText('B');
  expect(await nullStatusCell.getAttribute('class')).toBeNull();
});
```

- [x] **Step 4: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders old React problem alias fallback for null status cells"
```

Expected: FAIL because the current Vue renderer renders the fallback `<td>` empty.

Observed: FAIL. The focused full-chain test resolved Team Beta's null-status `<td>` and received an empty string instead of old React fallback text `B`.

### Task 2: GREEN - restore fallback status cell rendering

**Files:**
- Create: `src/client/components/rankland-status-cell.vue`
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add `RanklandStatusCell`**

Create `src/client/components/rankland-status-cell.vue` with a local status cell implementation that mirrors renderer classes and restores the fallback `problemKey` branch.

- [x] **Step 2: Wire the `status-cell` slot**

In `src/client/components/rankland-ranklist.vue`, import `RanklandStatusCell`, register it, and pass the `Ranklist` `status-cell` slot props into it.

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders old React problem alias fallback for null status cells|renders the ranklist detail page"
```

Expected: PASS. The null-status fallback renders `B`, and the main Ranklist flow still opens the solution modal and verifies existing status-cell interactions.

Observed: PASS. The focused run passed the main Ranklist detail page and the null-status fallback scenario; the fallback cell renders `B` with no status-block class.

### Task 3: Docs, full gate, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-28-srk-null-status-cell-fallback-parity.md`

- [x] **Step 1: Update migration docs**

Record this slice as `SRK null status cell fallback parity`, including old React fallback evidence and focused RED/GREEN results.

Observed: docs now record `SRK null status cell fallback parity`, old React fallback evidence, focused RED/GREEN evidence, and full gate as pending until the fresh slice gate completes.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with Node 24, pnpm 8, generated client routes, migration tests, and whitespace check.

Observed: PASS. The full gate used Node `v24.11.1` and pnpm `8.15.9`; `gen:client-router` generated 6 client routes, `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 61 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-status-cell.vue src/client/components/rankland-ranklist.vue tests/e2e/support/start-full-chain-e2e.js tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-srk-null-status-cell-fallback-parity-design.md docs/superpowers/plans/2026-05-28-srk-null-status-cell-fallback-parity.md
git commit -m "fix: 还原 SRK 空状态单元格题号"
```

Observed: PASS. Created commit `fix: 还原 SRK 空状态单元格题号`.

- [x] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
ps -ax -o pid,command | rg 'playwright|vite|tsx|node.*rankland|mock-api|full-chain|9232|3100|3101'
```

Expected: clean branch status, no whitespace errors, and no lingering Playwright/Vite/mock full-chain server.

Observed: PASS. `git status --short --branch` was clean on `migration/live-page-foundation`, `git show --check --oneline HEAD` reported the slice commit without whitespace errors, `git diff --check` passed, and the process scan found only the current `rg`, Chrome renderer, and editor TypeScript server false positives, with no lingering Playwright/Vite/mock full-chain server.
