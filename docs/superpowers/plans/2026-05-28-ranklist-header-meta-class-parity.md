# Ranklist Header Meta Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only `.rankland-ranklist-header-meta` product class while preserving old React `div.text-center.mt-1` metadata block behavior.

**Architecture:** Keep the shared Vue ranklist renderer and stable `data-id` hook. Move metadata block presentation from the product class selector to a scoped selector that targets the stable hook plus old utility class shape.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - Capture Header Meta Class Contract

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Tighten header meta assertion**

In `renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend`, change the header utility assertion so:

- metadata block class list is exactly `['text-center', 'mt-1']`;
- metadata block class list does not contain `rankland-ranklist-header-meta`;
- existing metadata display, no-gap, text-size, child-DOM, and spacing checks remain unchanged.

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
```

Expected: FAIL because current Vue still renders `.rankland-ranklist-header-meta` in the metadata block class list.

Observed: FAIL as expected. Playwright reported the received metadata class list as `["rankland-ranklist-header-meta", "text-center", "mt-1"]` while the old React contract expects exactly `["text-center", "mt-1"]`.

### Task 2: GREEN - Remove Vue-Only Header Meta Class

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove header meta product class**

Change the metadata block to:

```vue
<div data-id="rankland-ranklist-header-meta" class="text-center mt-1">
```

- [x] **Step 2: Preserve metadata block layout with stable-hook selector**

Replace the `.rankland-ranklist-header-meta` style selector with:

```less
[data-id='rankland-ranklist-header-meta'].text-center.mt-1 {
  margin: 4px 0 0;
  font-size: 14px;
}
```

- [x] **Step 3: Run focused GREEN**

Run the focused command from Task 1.

Expected: PASS.

Observed: PASS, `1 passed (18.9s)`.

- [x] **Step 4: Run ranklist full-chain regression**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: PASS.

Observed: PASS, `9 passed (26.7s)`.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/superpowers/plans/2026-05-28-ranklist-header-meta-class-parity.md`

- [x] **Step 1: Update migration docs**

Record:

- slice name: `Ranklist header meta class parity`;
- RED evidence for the Vue-only header meta class;
- GREEN evidence for focused ranklist route test;
- ranklist full-chain regression and full gate evidence.

Observed: migration docs now record Ranklist header meta class parity as the current verified slice, including RED for `.rankland-ranklist-header-meta` in the metadata class list, GREEN for exact old `text-center mt-1` without the Vue-only class, ranklist full-chain 9-test regression evidence, and the full migration gate evidence from Task 3 Step 2.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated client routes, build/unit/SSR/shallow/full-chain migration tests green, and no whitespace errors.

Observed: PASS. `node -v` reported `v24.11.1`; `corepack pnpm -v` reported `8.15.9`; `gen:client-router` generated 8 client routes; `test:migration` passed build, 35 unit files / 152 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` exited cleanly.

- [x] **Step 3: Commit the completed slice**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-ranklist-header-meta-class-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-header-meta-class-parity.md
git diff --cached --check
git commit -m "fix: 还原榜单元信息类名"
```

Observed before commit: `git diff --check` exited cleanly. The intended slice files are ready to stage and `git diff --cached --check` must pass immediately before commit.
