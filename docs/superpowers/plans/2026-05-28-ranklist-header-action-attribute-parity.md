# Ranklist Header Action Attribute Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Vue-only `title` and `aria-label` attributes from SRK header export/share action anchors while preserving existing dropdown behavior.

**Architecture:** Add browser DOM assertions to the existing Ranklist and Live full-chain specs, then make the smallest Vue template edit. Keep all stable `data-id` hooks, Ant Design Vue Dropdown/Menu usage, class contracts, and action handlers unchanged.

**Tech Stack:** Vue 3 SFC, Ant Design Vue Dropdown/Menu, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Add RED Full-Chain Attribute Assertions

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [ ] **Step 1: Update Ranklist header action assertions**

Add these checks immediately after the existing no-`href` assertions for `ranklistExportTrigger` and `ranklistShareTrigger`:

```ts
expect(await ranklistExportTrigger.getAttribute('title')).toBeNull();
expect(await ranklistShareTrigger.getAttribute('title')).toBeNull();
expect(await ranklistExportTrigger.getAttribute('aria-label')).toBeNull();
expect(await ranklistShareTrigger.getAttribute('aria-label')).toBeNull();
```

- [ ] **Step 2: Update Live header action assertions**

Add these checks immediately after the existing no-`href` assertions for `liveExportTrigger` and `liveShareTrigger`:

```ts
expect(await liveExportTrigger.getAttribute('title')).toBeNull();
expect(await liveShareTrigger.getAttribute('title')).toBeNull();
expect(await liveExportTrigger.getAttribute('aria-label')).toBeNull();
expect(await liveShareTrigger.getAttribute('aria-label')).toBeNull();
```

- [ ] **Step 3: Run focused RED checks**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page, preserves queries, polls live ranklist, and guards WebSocket setup"
```

Expected: both fail on `toBeNull()` because the current Vue triggers emit `title` and `aria-label`.

### Task 2: Remove Extra Vue Trigger Attributes

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [ ] **Step 1: Remove export trigger attributes**

Change:

```vue
title="导出"
aria-label="导出"
```

to no attributes on `data-id="rankland-ranklist-export-menu-button"`.

- [ ] **Step 2: Remove share trigger attributes**

Change:

```vue
title="分享"
aria-label="分享"
```

to no attributes on `data-id="rankland-ranklist-share-menu-button"`.

- [ ] **Step 3: Run focused GREEN checks**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page, preserves queries, polls live ranklist, and guards WebSocket setup"
```

Expected: both focused specs pass.

### Task 3: Widen Regression And Docs

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`

- [ ] **Step 1: Run route-level regressions**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts
```

Expected: Ranklist and Live full-chain files pass.

- [ ] **Step 2: Update migration docs**

Record that SRK header action attribute parity is verified: export/share triggers omit old-React-absent `title` and `aria-label` while keeping no-`href` anchor DOM, class lists, Ant Design Vue dropdowns, and export/share behavior.

- [ ] **Step 3: Run full completed-slice gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, router generation completes, migration tests pass, and `git diff --check` has no output.

### Task 4: Commit And Post-Check

**Files:**
- Commit all changed files for this slice only.

- [ ] **Step 1: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts docs/migration/status.md docs/migration/final-integration-review.md docs/migration/manual-acceptance-checklist.md docs/superpowers/specs/2026-05-28-ranklist-header-action-attribute-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-header-action-attribute-parity.md
git commit -m "fix: 还原榜单操作属性"
```

- [ ] **Step 2: Post-check**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: branch clean, latest commit is `fix: 还原榜单操作属性`, and whitespace checks have no output.
