# Ranklist Header Action Icons Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React icon-only export/share action triggers in the Vue ranklist header.

**Architecture:** Keep the current Ant Design Vue Dropdown/Button structure and stable `data-id`s. Register Ant Design Vue icon components locally in `rankland-ranklist.vue`, place them inside the existing buttons, and add title/aria labels to preserve button intent.

**Tech Stack:** Vue 3 SFC, Ant Design Vue, `@ant-design/icons-vue`, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add icon assertions to existing header action coverage**

After the existing export/share visibility assertions, add:

```ts
await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"] .anticon-download')).toBeVisible();
await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"] .anticon-share-alt')).toBeVisible();
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fail because the current buttons contain visible text but no Ant Design icon spans.

### Task 2: Implement Header Action Icons

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add icon package as a direct dependency**

Run:

```bash
corepack pnpm add @ant-design/icons-vue@7.0.1
```

Expected: `package.json` declares `@ant-design/icons-vue` so Vite can resolve the icon components under pnpm.

- [x] **Step 2: Import Ant Design Vue icons**

Add:

```ts
import { DownloadOutlined, ShareAltOutlined } from '@ant-design/icons-vue';
```

- [x] **Step 3: Register icons in the component**

Add `DownloadOutlined` and `ShareAltOutlined` to the `components` block.

- [x] **Step 4: Replace button text with icon components**

Update the buttons:

```vue
<a-button data-id="rankland-ranklist-export-menu-button" size="small" title="导出" aria-label="导出">
  <DownloadOutlined />
</a-button>
```

```vue
<a-button data-id="rankland-ranklist-share-menu-button" size="small" title="分享" aria-label="分享">
  <ShareAltOutlined />
</a-button>
```

- [x] **Step 5: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: all ranklist full-chain tests pass.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-ranklist-header-action-icons-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record header action icon parity in the current slice, `/ranklist/:id` status, SRK wrapper status, and latest gate evidence.

- [x] **Step 3: Commit**

Run:

```bash
git add package.json pnpm-lock.yaml src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-ranklist-header-action-icons-parity-design.md docs/superpowers/plans/2026-05-26-ranklist-header-action-icons-parity.md
git commit -m "feat: 收口榜单头部操作图标一致性"
```
