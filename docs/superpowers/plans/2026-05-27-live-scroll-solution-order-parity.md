# Live Scroll-Solution Order Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React Toastify `newestOnTop={false}` ordering for visible live realtime submission rows.

**Architecture:** Add a full-chain regression test that emits two realtime WebSocket messages and checks DOM order. Then update the Vue live page to append newly displayed rows and trim to the visible limit without changing queue timing or row chrome.

**Tech Stack:** Vue 3 options API, Playwright full-chain E2E, existing mock WebSocket harness.

---

### Task 1: RED - capture realtime row order

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Parameterize the realtime message helper**

Update the helper near the top of `tests/e2e/full-chain/live.spec.ts`:

```ts
function makeRealtimeSolutionBytes({
  problemAlias = 'A',
  result = 'AC',
  solved = 2,
  userId = 'team-alpha',
}: {
  problemAlias?: string;
  result?: string;
  solved?: number;
  userId?: string;
} = {}) {
  const fields = [
    [0, 0, 0, 0, 0, 0, 0, 7],
    bytes(problemAlias),
    bytes(userId),
    bytes(result),
    [solved],
  ];
  const header = [fields.length, ...fields.map((field) => field.length)];
  return [...header, ...fields.flat()];
}
```

- [x] **Step 2: Add the failing full-chain test**

Add a test after the existing realtime layout/order-adjacent coverage:

```ts
test('keeps visible realtime rows in legacy oldest-first Toastify order', async ({ page, request }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await denyExternalCalls(page);
  await stubWebSocket(page);
  await request.post(`${mockBaseURL}/__reset`);

  await page.goto('/live/live-test-key?token=t0&scrollSolution=1&focus=yes');

  const wsUrl = `ws://127.0.0.1:${mockPort}/ranking/record/live-rid-1?token=t0`;
  await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('connected');
  await emitRealtimeSolution(page, wsUrl, {
    problemAlias: 'A',
    result: 'FB',
    solved: 2,
    userId: 'team-alpha',
  });
  await emitRealtimeSolution(page, wsUrl, {
    problemAlias: 'B',
    result: 'FB',
    solved: 1,
    userId: 'team-beta',
  });

  const rows = page.locator('[data-id="live-scroll-solution-item"]');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0).locator('.user-name')).toHaveText('Team Alpha');
  await expect(rows.nth(0).locator('.problem')).toHaveText('A');
  await expect(rows.nth(1).locator('.user-name')).toHaveText('Team Beta');
  await expect(rows.nth(1).locator('.problem')).toHaveText('B');
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "keeps visible realtime rows in legacy oldest-first Toastify order"
```

Expected: FAIL because the first row is `Team Beta` / `B`.

### Task 2: GREEN - append visible rows

**Files:**
- Modify: `src/client/modules/live/live.view.vue`

- [x] **Step 1: Apply minimal implementation**

Change `showScrollSolution` from prepending to appending:

```ts
this.scrollSolutions = [...this.scrollSolutions, displayed].slice(-this.scrollSolutionVisibleLimit);
```

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "keeps visible realtime rows in legacy oldest-first Toastify order"
```

Expected: PASS.

### Task 3: Full verification and docs

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, route generation succeeds, migration tests pass, and whitespace check passes.

- [x] **Step 2: Update migration docs**

Record Live scroll-solution oldest-first row order parity in the current focus, Live route row, SRK/Live notes, acceptance checklist, and final integration review.

- [x] **Step 3: Commit**

Run:

```bash
git add tests/e2e/full-chain/live.spec.ts src/client/modules/live/live.view.vue docs/superpowers/specs/2026-05-27-live-scroll-solution-order-parity-design.md docs/superpowers/plans/2026-05-27-live-scroll-solution-order-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原 Live 实时提交显示顺序"
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: commit succeeds on `migration/live-page-foundation`, post-checks pass.
