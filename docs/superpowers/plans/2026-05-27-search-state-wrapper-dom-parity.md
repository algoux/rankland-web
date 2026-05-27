# Search State Wrapper DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `/search` loading, error, result, and recent wrapper DOM/class contracts by removing Vue-only state/section wrappers.

**Architecture:** Add focused Playwright full-chain assertions to the existing `/search` state tests, then make route-local Vue template/CSS edits. The change is scoped to `search.view.vue` and does not affect route metadata, API services, or shared components.

**Tech Stack:** Vue 3 SFC, Ant Design Vue Input/List/Spin, Playwright full-chain E2E.

---

### Task 1: RED - capture state wrapper DOM/class parity

**Files:**
- Modify: `tests/e2e/full-chain/search.spec.ts`

- [x] **Step 1: Add recent wrapper assertions**

In `shows recent ranklists for an empty query through CSR and listAllRanklists`, after `[data-id="search-recent-section"]` visibility assertion, add:

```ts
await expect(page.locator('[data-id="search-recent-section"]')).toHaveJSProperty('tagName', 'DIV');
await expect(page.locator('[data-id="search-recent-section"]')).not.toHaveClass(/search-section/);
```

- [x] **Step 2: Add loading wrapper assertion**

In `renders the legacy Ant Design loading spinner while ranklists are loading`, after the existing `mt-10` class assertion, add:

```ts
await expect(page.locator('[data-id="search-loading"]')).not.toHaveClass(/search-state/);
```

- [x] **Step 3: Add error wrapper assertion**

In `renders the legacy search load error color when ranklist initialization fails`, after the existing `mt-10` class assertion, add:

```ts
await expect(page.locator('[data-id="search-error"]')).not.toHaveClass(/search-state/);
```

- [x] **Step 4: Add result wrapper assertions**

In `shows Fuse results for kw query and preserves result count selector`, after `[data-id="search-result-section"]` visibility assertion, add:

```ts
await expect(page.locator('[data-id="search-result-section"]')).toHaveJSProperty('tagName', 'DIV');
await expect(page.locator('[data-id="search-result-section"]')).not.toHaveClass(/search-section/);
```

- [x] **Step 5: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows recent ranklists|renders the legacy Ant Design loading spinner|renders the legacy search load error color|shows Fuse results"
```

Expected: FAIL because current Vue renders result/recent as `SECTION.search-section` and loading/error with `.search-state`.

Result: FAIL reproduced the wrapper parity gap. Recent/result wrappers reported `tagName: "SECTION"` instead of `"DIV"`, and loading/error wrappers still carried `.search-state`.

### Task 2: GREEN - restore old state wrapper tags/classes

**Files:**
- Modify: `src/client/modules/search/search.view.vue`

- [x] **Step 1: Remove Vue-only state classes**

Replace:

```vue
<a-spin v-if="loading" data-id="search-loading" class="search-state mt-10" />

<div v-else-if="loadError" data-id="search-error" class="search-state mt-10">
```

with:

```vue
<a-spin v-if="loading" data-id="search-loading" class="mt-10" />

<div v-else-if="loadError" data-id="search-error" class="mt-10">
```

- [x] **Step 2: Restore result and recent wrappers**

Replace the result wrapper:

```vue
<section
  v-else-if="hasKeyword"
  data-id="search-result-section"
  class="search-section mt-10"
  :data-result-count="searchRows.length"
>
```

with:

```vue
<div
  v-else-if="hasKeyword"
  data-id="search-result-section"
  class="mt-10"
  :data-result-count="searchRows.length"
>
```

Replace its closing `</section>` with `</div>`.

Replace:

```vue
<section v-else data-id="search-recent-section" class="search-section mt-10">
```

with:

```vue
<div v-else data-id="search-recent-section" class="mt-10">
```

Replace its closing `</section>` with `</div>`.

- [x] **Step 3: Make the old mt-10 token carry spacing**

Replace:

```less
.search-section,
.search-state {
  margin-top: 40px;
}
```

with:

```less
.mt-10 {
  margin-top: 40px;
}
```

Keep `search-section-title`, `search-list`, `search-error-message`, and row styles unchanged.

- [x] **Step 4: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows recent ranklists|renders the legacy Ant Design loading spinner|renders the legacy search load error color|shows Fuse results"
```

Expected: PASS.

Result: PASS. The focused `/search` full-chain state tests verified recent/result `DIV` wrappers, no `.search-section`, no `.search-state`, and preserved loading/error/result/recent behavior.

### Task 3: Full verification, docs, commit

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

Result: PASS. Full gate used Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, passed build, 35 unit files / 151 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 59 passed / 1 skipped full-chain tests; `git diff --check` passed.

- [x] **Step 2: Update migration docs**

Record Search state wrapper DOM parity in the current focus, route progress coverage, manual checklist, final integration review, and next recommended focus.

- [ ] **Step 3: Commit**

Run:

```bash
git add tests/e2e/full-chain/search.spec.ts src/client/modules/search/search.view.vue docs/superpowers/specs/2026-05-27-search-state-wrapper-dom-parity-design.md docs/superpowers/plans/2026-05-27-search-state-wrapper-dom-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原搜索页状态外层 DOM"
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: commit succeeds on `migration/live-page-foundation`, post-checks pass.
