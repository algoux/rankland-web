# SRK Share Link Hash Omission Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React share-link behavior by omitting URL fragments from copied SRK page links.

**Architecture:** Keep the existing shared browser action helper and the existing Vue share menu. Add a failing unit test and a real full-chain copy-link assertion, then update `normalizeRanklandShareUrl` to drop `url.hash`.

**Tech Stack:** TypeScript, Vue 3, ant-design-vue dropdown/menu, Vitest, Playwright full-chain E2E.

---

### Task 1: RED Coverage

**Files:**
- Modify: `tests/unit/rankland-ranklist-actions.spec.ts`
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Update the helper unit test**

Change the existing `normalizeRanklandShareUrl` test to include a hash:

```ts
it('removes focus-only query keys and fragments from copied page links', () => {
  const url = normalizeRanklandShareUrl(
    'https://rl.algoux.org/live/live-test-key?token=t0&focus=yes&scrollSolution=1&%E8%81%9A%E7%84%A6=yes#scoreboard',
  );

  expect(url).toBe('https://rl.algoux.org/live/live-test-key?token=t0&scrollSolution=1');
});
```

- [x] **Step 2: Add full-chain copied-link evidence**

In `tests/e2e/full-chain/ranklist.spec.ts`, after the existing copy-link assertion for `/ranklist/test-key`, update the current history state without reloading:

```ts
await page.evaluate(() => {
  window.history.replaceState(
    null,
    '',
    '/ranklist/test-key?token=t0&focus=yes&%E8%81%9A%E7%84%A6=yes#scoreboard',
  );
});
```

Then open the share menu, click `rankland-ranklist-copy-link-action`, and expect:

```ts
expect(
  await page.evaluate(() => (window as unknown as { __ranklandClipboardText?: string }).__ranklandClipboardText),
).toBe(`http://127.0.0.1:${process.env.FULL_CHAIN_APP_PORT || '3100'}/ranklist/test-key?token=t0`);
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec vitest run tests/unit/rankland-ranklist-actions.spec.ts -t "removes focus-only query keys and fragments from copied page links"
```

Expected: FAIL because the current helper preserves `#scoreboard`.

Observed: FAIL because received URL still ended with `#scoreboard`.

### Task 2: Minimal Implementation

**Files:**
- Modify: `src/client/components/rankland-ranklist-actions.ts`

- [x] **Step 1: Drop hash from normalized share URLs**

In `normalizeRanklandShareUrl`, remove the hash from the returned string:

```ts
return `${url.protocol}//${url.host}${url.pathname}${search ? `?${search}` : ''}`;
```

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec vitest run tests/unit/rankland-ranklist-actions.spec.ts -t "removes focus-only query keys and fragments from copied page links"
```

Expected: PASS.

Observed: PASS, 1 focused unit test.

- [x] **Step 3: Run ranklist share full-chain GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR"
```

Expected: PASS, including the copied-link hash omission assertion.

Observed: PASS, 1 focused ranklist full-chain test. An initial attempt that used `page.goto` correctly exposed extra network requests in the existing request-count assertions; the test now uses `history.replaceState` to exercise copied URL behavior without reloading data.

### Task 3: Verification, Docs, And Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-28-srk-share-link-hash-omission-parity.md`

- [x] **Step 1: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node 24, pnpm 8, generated routes stable, migration tests pass, and whitespace check passes.

Observed: PASS with Node `v24.11.1`, pnpm `8.15.9`, 6 generated client routes, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 60 passed / 1 skipped full-chain Playwright tests, and `git diff --check`.

- [x] **Step 2: Update migration docs**

Record `SRK share link hash omission parity`, RED/GREEN evidence, full-chain coverage, full gate evidence, and unchanged review-driven next focus.

- [x] **Step 3: Commit**

Commit as:

```bash
git commit -m "fix: 还原 SRK 分享链接片段处理"
```

Committed as current `HEAD` with message `fix: 还原 SRK 分享链接片段处理`.
