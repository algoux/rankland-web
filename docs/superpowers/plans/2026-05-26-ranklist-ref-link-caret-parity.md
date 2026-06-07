# Ranklist Ref Link Caret Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old Ant Design caret-down icon on the hidden reference-link dropdown trigger.

**Architecture:** Reuse the direct `@ant-design/icons-vue` dependency already declared for header action icon parity. Register `CaretDownOutlined` in `rankland-ranklist.vue` and render it inside the existing extra ref-link trigger without changing the dropdown structure.

**Tech Stack:** Vue 3 SFC, Ant Design Vue, `@ant-design/icons-vue`, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add caret icon assertion**

After the existing extra ref-link trigger text assertion, add:

```ts
await expect(page.locator('[data-id="rankland-ranklist-ref-link-extra-action"] .anticon-caret-down')).toBeVisible();
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fail because the current trigger contains only text.

### Task 2: Implement Caret Icon

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Import and register `CaretDownOutlined`**

Update the icon import:

```ts
import { CaretDownOutlined, DownloadOutlined, ShareAltOutlined } from '@ant-design/icons-vue';
```

Add `CaretDownOutlined` to the component `components` block.

- [x] **Step 2: Render the caret icon after the existing text**

Update the extra ref-link trigger:

```vue
<span data-id="rankland-ranklist-ref-link-extra-action" class="rankland-ranklist-ref-link-extra-action">
  and {{ extraRefLinks.length }} more <CaretDownOutlined />
</span>
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
- Modify: `docs/superpowers/plans/2026-05-26-ranklist-ref-link-caret-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record ref-link caret icon parity in the current slice, `/ranklist/:id` status, SRK wrapper status, and latest gate evidence.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-ranklist-ref-link-caret-parity-design.md docs/superpowers/plans/2026-05-26-ranklist-ref-link-caret-parity.md
git commit -m "feat: 收口榜单相关链接下拉图标一致性"
```
