# Search Shell DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `/search` shell DOM by removing Vue-only root and panel wrappers while preserving current search behavior.

**Architecture:** Add focused full-chain DOM assertions to the existing `/search` recent-list route test, then make a minimal SFC template/CSS change in `search.view.vue`. The slice is route-local and does not affect common routing, API services, or generated files.

**Tech Stack:** Vue 3 SFC, Ant Design Vue Input/List/Spin, Playwright full-chain E2E.

---

### Task 1: RED - capture search shell DOM parity

**Files:**
- Modify: `tests/e2e/full-chain/search.spec.ts`

- [x] **Step 1: Add shell DOM assertions**

In the `shows recent ranklists for an empty query through CSR and listAllRanklists` test, after `[data-id="search-page"]` visibility/class assertions, add:

```ts
await expect(page.locator('[data-id="search-page"]')).toHaveJSProperty('tagName', 'DIV');
await expect(page.locator('[data-id="search-page"]')).not.toHaveClass(/search-page/);
await expect(page.locator('[data-id="search-page"] > div').first()).toBeVisible();
await expect(page.locator('[data-id="search-page"] > div').first()).not.toHaveClass(/search-panel/);
await expect(page.locator('[data-id="search-page"] > section.search-panel')).toHaveCount(0);
await expect(page.locator('[data-id="search-page"]')).not.toHaveCSS('min-height', '560px');
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows recent ranklists"
```

Expected: FAIL because the current Vue root is `MAIN`, carries `.search-page`, wraps content in `SECTION.search-panel`, and computes `min-height: 560px` in an 800px-high desktop viewport.

Result: FAIL reproduced the shell DOM gap. The focused test expected `tagName: "DIV"` and received `"MAIN"` from `[data-id="search-page"]`.

### Task 2: GREEN - restore old search shell tags/classes

**Files:**
- Modify: `src/client/modules/search/search.view.vue`

- [x] **Step 1: Change the root and wrapper tags**

Replace:

```vue
<main data-id="search-page" class="search-page normal-content">
```

with:

```vue
<div data-id="search-page" class="normal-content">
```

Replace:

```vue
<section class="search-panel">
```

with:

```vue
<div>
```

Replace the matching closing `</section>` and `</main>` with `</div>` and `</div>`.

- [x] **Step 2: Remove Vue-only shell CSS**

Delete:

```less
.search-page {
  min-height: 70vh;
}
```

Keep `.normal-content`, `.search-hydrated`, search state, list, and responsive styles unchanged.

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows recent ranklists"
```

Expected: PASS.

Result: PASS. The focused `/search` full-chain recent-list test verified the old `div.normal-content > div` shell DOM while preserving CSR list-all loading, hidden hydration marker, Ant Design search input, and recent rows.

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

Record `/search` shell DOM parity in the current focus, route progress coverage, manual checklist, final integration review, and next recommended focus.

- [ ] **Step 3: Commit**

Run:

```bash
git add tests/e2e/full-chain/search.spec.ts src/client/modules/search/search.view.vue docs/superpowers/specs/2026-05-27-search-shell-dom-parity-design.md docs/superpowers/plans/2026-05-27-search-shell-dom-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原搜索页外壳 DOM"
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: commit succeeds on `migration/live-page-foundation`, post-checks pass.
