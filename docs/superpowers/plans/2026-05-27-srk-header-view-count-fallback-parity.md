# SRK Header View Count Fallback Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React header view-count fallback so missing `meta.viewCnt` displays `-` with the eye icon.

**Architecture:** Reuse the existing RanklandRanklist header DOM and data ids. Extend the full-chain mock backend with one deterministic ranklist metadata variant, then make `hasViewCount` reflect metadata presence instead of only numeric `viewCnt`.

**Tech Stack:** Vue 3 Options API, Ant Design Vue icons, Playwright full-chain E2E, existing Node mock backend.

---

### Task 1: Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/support/start-full-chain-e2e.js`
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [ ] **Step 1: Add mock metadata without `viewCnt`**

In `tests/e2e/support/start-full-chain-e2e.js`, inside the `GET /^\/rank\/[^/]+$/` branch, return `{ ...ranklistInfo }` with `viewCnt` deleted when `url.pathname === '/rank/no-view-count-key'`.

- [ ] **Step 2: Add the failing full-chain test**

Add a ranklist full-chain test that resets the mock backend, opens `/ranklist/no-view-count-key?focus=yes`, and expects `[data-id="rankland-ranklist-view-count"]` to have text `-` and a visible `.anticon-eye`.

- [ ] **Step 3: Verify RED**

Run:

```bash
corepack pnpm exec playwright test tests/e2e/full-chain/ranklist.spec.ts -g "renders the legacy view count fallback when metadata omits viewCnt"
```

Expected: FAIL because the view-count block is absent.

### Task 2: Renderer Fix

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [ ] **Step 1: Implement minimal fix**

Change `hasViewCount` so the header renders when a metadata object exists:

```ts
hasViewCount(): boolean {
  return !!this.meta;
}
```

Keep the existing template interpolation `{{ meta.viewCnt || '-' }}`.

- [ ] **Step 2: Verify GREEN**

Run:

```bash
corepack pnpm exec playwright test tests/e2e/full-chain/ranklist.spec.ts -g "renders the legacy view count fallback when metadata omits viewCnt"
```

Expected: PASS.

### Task 3: Docs And Full Gate

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Update migration docs**

Record the verified slice, RED/GREEN result, and next recommended focus.

- [ ] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass; generated router may keep the existing JS language skip warning.

- [ ] **Step 3: Commit**

Run:

```bash
git add docs/superpowers/specs/2026-05-27-srk-header-view-count-fallback-parity-design.md docs/superpowers/plans/2026-05-27-srk-header-view-count-fallback-parity.md tests/e2e/support/start-full-chain-e2e.js tests/e2e/full-chain/ranklist.spec.ts src/client/components/rankland-ranklist.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原榜单头部浏览量缺失占位"
```
