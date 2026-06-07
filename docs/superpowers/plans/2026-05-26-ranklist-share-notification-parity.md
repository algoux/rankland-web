# Ranklist Share Notification Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore Ant Design notification feedback for successful ranklist share-copy actions.

**Architecture:** Keep the existing share-copy commands and clipboard helper. Change only the success path in `copyText` to call Ant Design Vue `notification.success`, leaving copy failures and export statuses on the existing inline status path.

**Tech Stack:** Vue 3 SFC, Ant Design Vue notification, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Add a notification helper to each affected spec**

Add near the other helpers:

```ts
async function expectNotificationMessage(page: Page, message: string) {
  await expect(page.locator('.ant-notification-notice-message', { hasText: message })).toBeVisible();
}
```

In `live.spec.ts`, `Page` is already imported from Playwright.

- [x] **Step 2: Update ranklist copy-link and copy-embed assertions**

Replace:

```ts
await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('链接已复制');
```

with:

```ts
await expectNotificationMessage(page, '链接已复制');
```

Replace:

```ts
await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('嵌入代码已复制');
```

with:

```ts
await expectNotificationMessage(page, '嵌入代码已复制');
```

- [x] **Step 3: Update live copy-embed assertion**

Replace:

```ts
await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('嵌入代码已复制');
```

with:

```ts
await expectNotificationMessage(page, '嵌入代码已复制');
```

- [x] **Step 4: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts
```

Expected: fail because copy success currently renders inline `actionStatus`, not Ant Design notification.

### Task 2: Implement Copy Success Notification

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Import Ant Design Vue notification**

Add:

```ts
import { notification } from 'ant-design-vue';
```

- [x] **Step 2: Use notification on copy success**

Update `copyText`:

```ts
async copyText(text: string, successMessage: string) {
  try {
    await this.writeClipboardText(text);
    notification.success({
      message: successMessage,
      duration: 2,
      style: {
        width: '280px',
      },
    });
  } catch (error) {
    this.actionStatus = '复制失败';
  }
},
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts
```

Expected: all ranklist and live full-chain tests pass.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-ranklist-share-notification-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record share notification parity in the current slice, `/ranklist/:id` and `/live/:id` coverage, SRK wrapper status, and latest gate evidence.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-ranklist-share-notification-parity-design.md docs/superpowers/plans/2026-05-26-ranklist-share-notification-parity.md
git commit -m "feat: 收口榜单分享复制提示一致性"
```
