# SRK Filter Controls Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `StyledRanklistRenderer` filter-control UI and official-only semantics in the Vue shared ranklist wrapper.

**Architecture:** Keep filtering state in `rankland-ranklist.vue` and pure row filtering in `rankland-ranklist-state.ts`. Replace only the visual controls with Ant Design Vue primitives while preserving stable test selectors and the existing state shape. Use fixture markers to expose the marker control in full-chain E2E.

**Tech Stack:** Vue 3 Options API, ant-design-vue 4 Select/Switch/Radio, Vitest, Playwright full-chain E2E.

---

### Task 1: Red Tests

**Files:**
- Modify: `tests/fixtures/ranklist.srk.json`
- Modify: `tests/unit/rankland-ranklist-state.spec.ts`
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add deterministic marker fixture data**

Add top-level `markers` with `gold` and `silver`, and assign `team-alpha` to `gold` and `team-beta` to `silver`.

- [x] **Step 2: Add official-only unit coverage**

Add a unit case proving rows with missing `user.official` are excluded when `officialOnly` is true.

- [x] **Step 3: Add full-chain Ant Design filter coverage**

Assert organization filter, official switch, and marker filter render Ant Design Vue classes and still filter visible rows through browser interactions.

- [x] **Step 4: Run focused tests and confirm RED**

Run:

```bash
corepack pnpm exec vitest run tests/unit/rankland-ranklist-state.spec.ts
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: unit fails on missing-official semantics; full-chain fails because controls are native, not Ant Design Vue.

### Task 2: Ant Design Vue Controls

**Files:**
- Modify: `src/client/main.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `src/client/components/rankland-ranklist-state.ts`

- [x] **Step 1: Register controls**

Register `Select`, `Switch`, and `Radio` in the global Ant Design Vue component list.

- [x] **Step 2: Replace filter markup**

Use:

```vue
<a-select mode="multiple" allow-clear>
<a-switch size="small">
<a-radio-group button-style="solid">
<a-radio-button>
```

Bind them to the existing `filter` state and keep the stable `data-id` attributes.

- [x] **Step 3: Fix official-only filtering**

Change row filtering so `officialOnly` requires `row.user?.official === true`.

- [x] **Step 4: Run focused verification**

Run:

```bash
corepack pnpm exec vitest run tests/unit/rankland-ranklist-state.spec.ts
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: PASS.

### Task 3: Gates, Docs, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-srk-filter-controls-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration docs**

Record SRK filter-control parity as verified and keep remaining exact table pixel parity as product-review-driven if no broader table slice is completed.

- [x] **Step 3: Commit the slice**

Run:

```bash
git status --short
git add src/client/main.ts src/client/components/rankland-ranklist.vue src/client/components/rankland-ranklist-state.ts tests/fixtures/ranklist.srk.json tests/unit/rankland-ranklist-state.spec.ts tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-srk-filter-controls-parity-design.md docs/superpowers/plans/2026-05-26-srk-filter-controls-parity.md
git commit -m "feat: 收口榜单筛选控件一致性"
```

Expected: commit succeeds with only this slice's files.
