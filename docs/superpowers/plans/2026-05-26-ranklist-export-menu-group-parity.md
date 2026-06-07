# Ranklist Export Menu Group Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old Ant Design `导出为` group title in the ranklist export dropdown.

**Architecture:** Keep the existing Ant Design Vue Dropdown/Menu structure and export action buttons. Insert an `a-menu-item-group` inside the export `a-menu`, move the four existing `a-menu-item`s under it, and preserve all stable `data-id` selectors and click handlers.

**Tech Stack:** Vue 3 SFC, Ant Design Vue Menu, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add export group title assertion**

After the export/share icon assertions, add:

```ts
await page.locator('[data-id="rankland-ranklist-export-menu-button"]').hover();
await expect(page.locator('[data-id="rankland-ranklist-export-menu-group"]')).toContainText('导出为');
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fail because the current export menu has no group title or `rankland-ranklist-export-menu-group`.

### Task 2: Implement Export Menu Group

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Wrap export items in a menu group**

Inside `a-menu data-id="rankland-ranklist-export-menu-overlay"`, replace the four flat items with:

```vue
<a-menu-item-group key="export-group" data-id="rankland-ranklist-export-menu-group" title="导出为">
  <a-menu-item key="export-srk">
    <button data-id="rankland-ranklist-export-srk-action" type="button" @click="downloadSrkJson">
      标准榜单格式 (srk)
    </button>
  </a-menu-item>
  <a-menu-item key="export-gym-ghost">
    <button
      data-id="rankland-ranklist-export-gym-ghost-action"
      type="button"
      @click="downloadGymGhostDat"
    >
      Codeforces Gym Ghost (dat)
    </button>
  </a-menu-item>
  <a-menu-item key="export-vjudge">
    <button data-id="rankland-ranklist-export-vjudge-action" type="button" @click="downloadVJudgeReplay">
      Virtual Judge Replay (xlsx)
    </button>
  </a-menu-item>
  <a-menu-item key="export-xlsx">
    <button data-id="rankland-ranklist-export-xlsx-action" type="button" @click="downloadGeneralExcel">
      Excel 表格 (xlsx)
    </button>
  </a-menu-item>
</a-menu-item-group>
```

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: all ranklist full-chain tests pass.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-ranklist-export-menu-group-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record export menu group parity in the current slice, `/ranklist/:id` coverage, SRK wrapper status, and latest gate evidence.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-ranklist-export-menu-group-parity-design.md docs/superpowers/plans/2026-05-26-ranklist-export-menu-group-parity.md
git commit -m "feat: 收口榜单导出菜单分组一致性"
```
