# Ranklist Header Action Anchor Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the SRK header export/share triggers to old React no-`href` anchor DOM and exact utility-class contracts.

**Architecture:** The full-chain tests own the public DOM contract for ranklist metadata and live no-metadata paths. The Vue SFC keeps Ant Design Vue `Dropdown` and overlay menu items, but replaces the trigger `a-button` components with plain anchors and retargets trigger styling to stable `data-id` selectors.

**Tech Stack:** Vue 3 SFC, Ant Design Vue Dropdown/Menu, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: RED Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Add ranklist exact trigger DOM assertions**

Insert after the existing ranklist export/share utility-class assertions:

```ts
const ranklistExportTrigger = page.locator('[data-id="rankland-ranklist-export-menu-button"]');
const ranklistShareTrigger = page.locator('[data-id="rankland-ranklist-share-menu-button"]');
await expect(ranklistExportTrigger).toHaveJSProperty('tagName', 'A');
await expect(ranklistShareTrigger).toHaveJSProperty('tagName', 'A');
expect(await ranklistExportTrigger.getAttribute('href')).toBeNull();
expect(await ranklistShareTrigger.getAttribute('href')).toBeNull();
expect(await ranklistExportTrigger.evaluate((element) => Array.from(element.classList))).toEqual([
  'border-0',
  'border-solid',
  'border-gray-400',
  'mr-2',
  'pl-2',
  'border-l',
  'ant-dropdown-trigger',
]);
expect(await ranklistShareTrigger.evaluate((element) => Array.from(element.classList))).toEqual([
  'pl-2',
  'border-0',
  'border-l',
  'border-solid',
  'border-gray-400',
  'ant-dropdown-trigger',
]);
for (const trigger of [ranklistExportTrigger, ranklistShareTrigger]) {
  const classList = await trigger.evaluate((element) => Array.from(element.classList));
  expect(classList).not.toContain('ant-btn');
  expect(classList).not.toContain('ant-btn-sm');
  expect(classList).not.toContain('rankland-ranklist-header-action-trigger');
  expect(classList).not.toContain('rankland-ranklist-header-action-separated');
}
```

- [x] **Step 2: Add live no-metadata exact trigger DOM assertions**

Insert after the existing live export/share utility-class assertions:

```ts
const liveExportTrigger = page.locator('[data-id="rankland-ranklist-export-menu-button"]');
const liveShareTrigger = page.locator('[data-id="rankland-ranklist-share-menu-button"]');
await expect(liveExportTrigger).toHaveJSProperty('tagName', 'A');
await expect(liveShareTrigger).toHaveJSProperty('tagName', 'A');
expect(await liveExportTrigger.getAttribute('href')).toBeNull();
expect(await liveShareTrigger.getAttribute('href')).toBeNull();
expect(await liveExportTrigger.evaluate((element) => Array.from(element.classList))).toEqual([
  'border-0',
  'border-solid',
  'border-gray-400',
  'mr-2',
  'ant-dropdown-trigger',
]);
expect(await liveShareTrigger.evaluate((element) => Array.from(element.classList))).toEqual([
  'pl-2',
  'border-0',
  'border-l',
  'border-solid',
  'border-gray-400',
  'ant-dropdown-trigger',
]);
for (const trigger of [liveExportTrigger, liveShareTrigger]) {
  const classList = await trigger.evaluate((element) => Array.from(element.classList));
  expect(classList).not.toContain('ant-btn');
  expect(classList).not.toContain('ant-btn-sm');
  expect(classList).not.toContain('rankland-ranklist-header-action-trigger');
  expect(classList).not.toContain('rankland-ranklist-header-action-separated');
}
```

- [x] **Step 3: Verify ranklist RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
```

Expected: FAIL because the current triggers are `BUTTON` elements with Ant Design and Vue-only classes.

- [x] **Step 4: Verify live RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page, preserves queries, polls live ranklist, and guards WebSocket setup"
```

Expected: FAIL because the current triggers are `BUTTON` elements with Ant Design and Vue-only classes.

### Task 2: GREEN Implementation

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Replace export `a-button` with a plain anchor**

Change the export trigger from:

```vue
<a-button
  data-id="rankland-ranklist-export-menu-button"
  :class="[
    'rankland-ranklist-header-action-trigger border-0 border-solid border-gray-400 mr-2',
    { 'rankland-ranklist-header-action-separated pl-2 border-l': hasViewCount },
  ]"
  size="small"
  title="导出"
  aria-label="导出"
>
  <DownloadOutlined />
</a-button>
```

to:

```vue
<a
  data-id="rankland-ranklist-export-menu-button"
  :class="[
    'border-0 border-solid border-gray-400 mr-2',
    { 'pl-2 border-l': hasViewCount },
  ]"
  title="导出"
  aria-label="导出"
>
  <DownloadOutlined />
</a>
```

- [x] **Step 2: Replace share `a-button` with a plain anchor**

Change:

```vue
<a-button
  data-id="rankland-ranklist-share-menu-button"
  class="rankland-ranklist-header-action-trigger rankland-ranklist-header-action-separated pl-2 border-0 border-l border-solid border-gray-400"
  size="small"
  title="分享"
  aria-label="分享"
>
  <ShareAltOutlined />
</a-button>
```

to:

```vue
<a
  data-id="rankland-ranklist-share-menu-button"
  class="pl-2 border-0 border-l border-solid border-gray-400"
  title="分享"
  aria-label="分享"
>
  <ShareAltOutlined />
</a>
```

- [x] **Step 3: Retarget trigger styling**

Replace the trigger style block with selectors that do not require Vue-only classes:

```less
.rankland-ranklist-header-actions [data-id='rankland-ranklist-export-menu-button'],
.rankland-ranklist-header-actions [data-id='rankland-ranklist-share-menu-button'] {
  width: auto;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: var(--rankland-link-color);
  cursor: pointer;
}

.rankland-ranklist-header-actions [data-id='rankland-ranklist-export-menu-button']:hover,
.rankland-ranklist-header-actions [data-id='rankland-ranklist-export-menu-button']:focus,
.rankland-ranklist-header-actions [data-id='rankland-ranklist-share-menu-button']:hover,
.rankland-ranklist-header-actions [data-id='rankland-ranklist-share-menu-button']:focus {
  background: transparent;
  color: var(--rankland-link-hover-color);
}

.rankland-ranklist-header-actions [data-id='rankland-ranklist-export-menu-button'] :deep(.anticon),
.rankland-ranklist-header-actions [data-id='rankland-ranklist-share-menu-button'] :deep(.anticon) {
  color: inherit;
}

.rankland-ranklist-header-actions [data-id='rankland-ranklist-export-menu-button'].border-l,
.rankland-ranklist-header-actions [data-id='rankland-ranklist-share-menu-button'].border-l {
  padding-left: 8px;
  border-left: 1px solid #9ca3af;
}

.rankland-ranklist-header-actions [data-id='rankland-ranklist-export-menu-button'].border-l:hover,
.rankland-ranklist-header-actions [data-id='rankland-ranklist-export-menu-button'].border-l:focus,
.rankland-ranklist-header-actions [data-id='rankland-ranklist-share-menu-button'].border-l:hover,
.rankland-ranklist-header-actions [data-id='rankland-ranklist-share-menu-button'].border-l:focus {
  border-left-color: #9ca3af;
}
```

- [x] **Step 4: Verify focused GREEN**

Run both focused commands from Task 1.

Expected: both focused tests pass.

- [x] **Step 5: Verify ranklist/live regressions**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts
```

Expected: ranklist passes 9 tests and live passes 11 tests.

### Task 3: Migration Docs And Gate

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/superpowers/plans/2026-05-28-ranklist-header-action-anchor-parity.md`

- [x] **Step 1: Update migration docs**

Record `Ranklist header action anchor parity`, including exact old no-`href` anchor DOM, exact utility class lists for metadata/no-metadata paths, no Ant Design button classes, no Vue-only action trigger classes, and focused RED/GREEN evidence.

- [x] **Step 2: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, migration gate pass, and no whitespace errors.

- [x] **Step 3: Commit the slice**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-ranklist-header-action-anchor-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-header-action-anchor-parity.md
git diff --cached --check
git commit -m "fix: 还原榜单操作锚点"
```

Expected: Commit succeeds with only this slice's files.

- [x] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch, latest commit check clean, and no whitespace errors.
