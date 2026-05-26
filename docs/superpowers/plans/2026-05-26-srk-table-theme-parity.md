# SRK Table Theme Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pass the RankLand shell light/dark theme into the low-level SRK Vue table renderer.

**Architecture:** Keep theme propagation local to `RanklandRanklist`, because it is the shared wrapper around the third-party SRK table. Read `document.documentElement.classList` after mount, observe html class changes with `MutationObserver`, and pass the resulting value to `<Ranklist :theme="ranklistTheme" />`.

**Tech Stack:** Vue 3 SFC, Playwright full-chain tests, `@algoux/standard-ranklist-renderer-component-vue`, pnpm.

---

### Task 1: Write RED Full-Chain Coverage

**Files:**
- Modify: `tests/fixtures/ranklist.srk.json`
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add theme-dependent problem style to the fixture**

Change Problem A style to:

```json
"style": {
  "backgroundColor": {
    "light": "#58a2d1",
    "dark": "#0f172a"
  }
}
```

- [x] **Step 2: Add dark matchMedia helper**

Add a helper that stubs `window.matchMedia` so the shell starts in dark mode.

- [x] **Step 3: Add the failing test**

Add a `/ranklist/:id` full-chain test that asserts the first `.srk-problem-header` background image contains `rgb(15, 23, 42)` while `html` is dark.

- [x] **Step 4: Run the focused test and verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fails because the SRK table still renders Problem A with the light background color.

### Task 2: Implement Theme Propagation

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add theme state and observer fields**

Add to component data:

```ts
ranklistTheme: 'light' as 'light' | 'dark',
themeObserver: undefined as MutationObserver | undefined,
```

- [x] **Step 2: Pass theme into the low-level table**

Update `<Ranklist />`:

```vue
<Ranklist
  :data="ranklistState.staticRanklist"
  :theme="ranklistTheme"
  striped-rows
  ...
/>
```

- [x] **Step 3: Read and observe the document theme**

Add `mounted`, `beforeUnmount`, and `syncRanklistTheme()` logic so html class changes update `ranklistTheme`.

- [x] **Step 4: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: all ranklist full-chain tests pass.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-srk-table-theme-parity.md`

- [x] **Step 1: Run full migration gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record SRK table theme parity under `/ranklist/:id`, SRK Vue wrapper infrastructure, deferred decisions, and known risks.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/fixtures/ranklist.srk.json tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-srk-table-theme-parity-design.md docs/superpowers/plans/2026-05-26-srk-table-theme-parity.md
git commit -m "feat: 收口 SRK 表格主题一致性"
```
