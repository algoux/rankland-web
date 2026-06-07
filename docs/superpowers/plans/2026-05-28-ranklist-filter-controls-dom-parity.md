# Ranklist Filter Controls DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React direct-child DOM structure for SRK filter controls.

**Architecture:** Keep the shared Vue ranklist wrapper and full-chain ranklist harness. Extend the existing filter-controls test to assert direct-child DOM and wrapper tags, then remove only the Vue-only label wrappers and unused wrapper class.

**Tech Stack:** Vue 3 SFC, scoped LESS, Ant Design Vue controls, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - Capture Filter Controls DOM Contract

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add a filter DOM helper**

Add a helper near existing filter helpers that returns:

- direct child tag names under `[data-id="rankland-ranklist-filters"]`;
- count of direct `label` children;
- organization Select parent tag and parent data-id;
- official wrapper tag, parent data-id, and class list.

- [x] **Step 2: Assert old React direct-child structure**

In `renders legacy Ant Design filter controls and preserves filtering behavior`, assert:

- the filters direct child sequence begins with `SPAN`, Select root, official wrapper `SPAN`, marker root;
- there are no direct `LABEL` children;
- organization Select parent data-id is `rankland-ranklist-filters`;
- official wrapper tag is `SPAN`;
- official wrapper has `ml-5`, `inline-flex`, `items-center`, and the stable migrated `rankland-ranklist-checkbox` hook;
- official wrapper does not have `rankland-ranklist-filter`.

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected: FAIL because current Vue still renders direct `LABEL` wrappers.

Observed: FAIL because current Vue reported two direct `LABEL` wrappers, organization Select parent `LABEL`, and official wrapper `LABEL` with `.rankland-ranklist-filter`.

### Task 2: GREEN - Remove Vue-Only Filter Labels

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove organization wrapper label**

Move the `筛选` text span and `<a-select>` directly under `[data-id="rankland-ranklist-filters"]`.

- [x] **Step 2: Convert official wrapper label to span**

Change the official wrapper from:

```vue
<label class="rankland-ranklist-filter rankland-ranklist-checkbox ml-5 inline-flex items-center">
```

to:

```vue
<span class="rankland-ranklist-checkbox ml-5 inline-flex items-center">
```

- [x] **Step 3: Remove unused `.rankland-ranklist-filter` style**

Delete the scoped `:global(.rankland-ranklist-filter)` rule if no production DOM still uses it.

- [x] **Step 4: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected: PASS.

Observed: PASS with 1 focused ranklist filter-controls test.

- [x] **Step 5: Run ranklist full-chain regression**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: PASS, including mobile layout and spacing checks.

Observed: PASS with 9 ranklist full-chain tests.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/superpowers/plans/2026-05-28-ranklist-filter-controls-dom-parity.md`

- [x] **Step 1: Update migration docs**

Record:

- slice name: `Ranklist filter controls DOM parity`;
- RED evidence for Vue-only `LABEL` wrappers;
- GREEN evidence for focused ranklist filter-controls test;
- ranklist full-chain regression and full gate evidence;
- route progress updates for `/ranklist/:id` and the shared SRK wrapper.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated client routes, build/unit/SSR/shallow/full-chain migration tests green, and no whitespace errors.

Observed: PASS with Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, build success, 35 unit files / 152 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 60 passed / 1 skipped default full-chain Playwright tests, and no `git diff --check` output.

- [ ] **Step 3: Commit the completed slice**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-ranklist-filter-controls-dom-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-filter-controls-dom-parity.md
git diff --cached --check
git commit -m "fix: 还原榜单筛选控件 DOM"
```

- [ ] **Step 4: Run post-commit checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch status, HEAD patch check passes, and no whitespace errors.
