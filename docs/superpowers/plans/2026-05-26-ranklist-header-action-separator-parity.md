# Ranklist Header Action Separator Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `pl-2 border-l` separator treatment for shared ranklist header export/share triggers.

**Architecture:** Keep the existing Ant Design Vue dropdown and button triggers. Add a local trigger class to both header action buttons and use a more specific scoped selector so it overrides the broad menu-button reset only for header triggers.

**Tech Stack:** Vue 3 SFC, Ant Design Vue buttons/dropdowns, scoped LESS, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add a header action trigger style helper**

Add near the other Playwright layout helpers:

```ts
async function getHeaderActionTriggerStyle(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      paddingLeft: style.paddingLeft,
      borderLeftWidth: style.borderLeftWidth,
      borderTopWidth: style.borderTopWidth,
      borderRightWidth: style.borderRightWidth,
      borderBottomWidth: style.borderBottomWidth,
      borderRadius: style.borderRadius,
    };
  });
}
```

- [x] **Step 2: Assert old `pl-2 border-l` styles**

In the main `/ranklist/:id` full-chain test, after the export/share icon assertions, add:

```ts
for (const selector of [
  '[data-id="rankland-ranklist-export-menu-button"]',
  '[data-id="rankland-ranklist-share-menu-button"]',
]) {
  expect(await getHeaderActionTriggerStyle(page, selector)).toMatchObject({
    paddingLeft: '8px',
    borderLeftWidth: '1px',
    borderTopWidth: '0px',
    borderRightWidth: '0px',
    borderBottomWidth: '0px',
    borderRadius: '0px',
  });
}
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fail because current header action triggers still have no left padding or left divider.

### Task 2: Restore Header Action Separators

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add trigger classes to both header action buttons**

Update the two header action buttons:

```vue
<a-button
  data-id="rankland-ranklist-export-menu-button"
  class="rankland-ranklist-header-action-trigger"
  size="small"
  title="导出"
  aria-label="导出"
>
```

```vue
<a-button
  data-id="rankland-ranklist-share-menu-button"
  class="rankland-ranklist-header-action-trigger"
  size="small"
  title="分享"
  aria-label="分享"
>
```

- [x] **Step 2: Add scoped old icon-link separator style**

Add after the broad button reset:

```less
.rankland-ranklist-header-actions .rankland-ranklist-header-action-trigger {
  width: auto;
  padding: 0 0 0 8px;
  border-top: 0;
  border-right: 0;
  border-bottom: 0;
  border-left: 1px solid #9ca3af;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: all ranklist full-chain tests pass.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-ranklist-header-action-separator-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record header action separator parity in the current slice, `/ranklist/:id` coverage, SRK Vue wrapper status, deferred product decisions, and known risks.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-ranklist-header-action-separator-parity-design.md docs/superpowers/plans/2026-05-26-ranklist-header-action-separator-parity.md
git commit -m "feat: 收口榜单头部操作分隔线一致性"
```
