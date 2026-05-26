# Live Header Action Conditional Separator Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React conditional header action separator behavior for live ranklists that do not pass `meta`.

**Architecture:** Split the shared header action trigger style into a base icon-link class and a separate divider class. Bind the divider class to the export trigger only when `hasViewCount` is true, while keeping the share trigger always separated.

**Tech Stack:** Vue 3 SFC, Ant Design Vue buttons/dropdowns, scoped LESS, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Add a live header action style helper**

Add near the other live layout helpers:

```ts
async function getHeaderActionTriggerStyle(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      paddingLeft: style.paddingLeft,
      borderLeftWidth: style.borderLeftWidth,
      borderRadius: style.borderRadius,
    };
  });
}
```

- [x] **Step 2: Assert no-meta export/share separator behavior**

In the main `/live/:id` full-chain test, after asserting the export/share buttons are visible, add:

```ts
expect(await getHeaderActionTriggerStyle(page, '[data-id="rankland-ranklist-export-menu-button"]')).toMatchObject({
  paddingLeft: '0px',
  borderLeftWidth: '0px',
  borderRadius: '0px',
});
expect(await getHeaderActionTriggerStyle(page, '[data-id="rankland-ranklist-share-menu-button"]')).toMatchObject({
  paddingLeft: '8px',
  borderLeftWidth: '1px',
  borderRadius: '0px',
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts
```

Expected: fail because current live export trigger still has `paddingLeft: 8px` and `borderLeftWidth: 1px`.

### Task 2: Implement Conditional Separator Classes

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Bind export separator only when meta/view count exists**

Update export trigger class binding:

```vue
:class="[
  'rankland-ranklist-header-action-trigger',
  { 'rankland-ranklist-header-action-separated': hasViewCount },
]"
```

- [x] **Step 2: Keep share always separated**

Update share trigger class:

```vue
class="rankland-ranklist-header-action-trigger rankland-ranklist-header-action-separated"
```

- [x] **Step 3: Split base and separator CSS**

Replace the current trigger separator style with:

```less
.rankland-ranklist-header-actions .rankland-ranklist-header-action-trigger {
  width: auto;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.rankland-ranklist-header-actions .rankland-ranklist-header-action-separated {
  padding-left: 8px;
  border-left: 1px solid #9ca3af;
}
```

- [x] **Step 4: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: live and ranklist full-chain tests pass.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-live-header-action-conditional-separator-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record conditional live header action separator parity in the current slice, `/live/:id` coverage, SRK Vue wrapper status, deferred product decisions, and known risks.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/live.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-live-header-action-conditional-separator-parity-design.md docs/superpowers/plans/2026-05-26-live-header-action-conditional-separator-parity.md
git commit -m "feat: 收口 Live 头部操作条件分隔线一致性"
```
