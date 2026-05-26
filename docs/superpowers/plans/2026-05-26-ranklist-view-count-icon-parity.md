# Ranklist View Count Icon Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React eye-icon view count in the shared Vue ranklist header.

**Architecture:** Reuse the direct `@ant-design/icons-vue` dependency already present in `rankland-web`. Register `EyeOutlined` in `rankland-ranklist.vue` and render it inside the existing view-count span, keeping the stable `data-id` and current metadata data flow.

**Tech Stack:** Vue 3 SFC, Ant Design Vue, `@ant-design/icons-vue`, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [x] **Step 1: Update ranklist view-count assertions**

Replace the existing ranklist assertion:

```ts
await expect(page.locator('[data-id="rankland-ranklist-view-count"]')).toHaveText('浏览 42');
```

with:

```ts
await expect(page.locator('[data-id="rankland-ranklist-view-count"]')).toHaveText('42');
await expect(page.locator('[data-id="rankland-ranklist-view-count"] .anticon-eye')).toBeVisible();
```

- [x] **Step 2: Update collection selected-ranklist view-count assertions**

Replace the existing collection assertion:

```ts
await expect(page.locator('[data-id="rankland-ranklist-view-count"]')).toHaveText('浏览 42');
```

with:

```ts
await expect(page.locator('[data-id="rankland-ranklist-view-count"]')).toHaveText('42');
await expect(page.locator('[data-id="rankland-ranklist-view-count"] .anticon-eye')).toBeVisible();
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/collection.spec.ts
```

Expected: fail because the current wrapper renders `浏览 42` and no `.anticon-eye`.

### Task 2: Implement Eye Icon View Count

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Import and register `EyeOutlined`**

Update the icon import:

```ts
import { CaretDownOutlined, DownloadOutlined, EyeOutlined, ShareAltOutlined } from '@ant-design/icons-vue';
```

Add `EyeOutlined` to the component `components` block.

- [x] **Step 2: Render old view-count content**

Update the view-count span:

```vue
<span v-if="hasViewCount" data-id="rankland-ranklist-view-count" class="rankland-ranklist-view-count">
  <EyeOutlined /> {{ meta.viewCnt || '-' }}
</span>
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/collection.spec.ts
```

Expected: all ranklist and collection full-chain tests pass.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-ranklist-view-count-icon-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record view-count icon parity in the current slice, `/ranklist/:id` and `/collection/:id` coverage, SRK wrapper status, and latest gate evidence.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/collection.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-ranklist-view-count-icon-parity-design.md docs/superpowers/plans/2026-05-26-ranklist-view-count-icon-parity.md
git commit -m "feat: 收口榜单浏览量图标一致性"
```
