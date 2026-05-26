# Ranklist Organization Filter Tag Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React organization-filter selected tag display in the shared Vue SRK ranklist wrapper.

**Architecture:** Keep the current Ant Design Vue multiple select and existing filter state. Add the old compact tag display props to the organization `a-select`, with a small component method that formats Ant Design Vue's omitted selected values as `已选择 N 个`.

**Tech Stack:** Vue 3 SFC, Ant Design Vue Select, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add selected-tag assertions to the ranklist filter test**

In `renders legacy Ant Design filter controls and preserves filtering behavior`, after the initial Team Alpha / Team Beta visibility assertions and before the existing single-organization filtering assertion, select both organizations and assert the old compact display:

```ts
    await selectRanklistOrganization(page, 'Org A');
    await selectRanklistOrganization(page, 'Org B');

    const organizationFilter = page.locator('[data-id="rankland-ranklist-organization-filter"]');
    await expect(organizationFilter.locator('.ant-select-selection-item')).toHaveText('已选择 2 个');

    await page.reload();
```

Keep the existing single `Org A` filtering block after the reload so it still verifies filtering semantics independently.

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fail because the current Vue select renders selected organization labels instead of `已选择 2 个`.

### Task 2: Implement Ant Design Vue Tag Collapse

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add old tag-collapse props to the organization select**

Update the organization `a-select`:

```vue
            <a-select
              v-model:value="filter.organizations"
              data-id="rankland-ranklist-organization-filter"
              mode="multiple"
              allow-clear
              placeholder="选择组织/单位"
              class="rankland-ranklist-select"
              :max-tag-count="0"
              :max-tag-placeholder="formatOrganizationSelectionPlaceholder"
            >
```

- [x] **Step 2: Add the formatter method**

Add in `methods`:

```ts
    formatOrganizationSelectionPlaceholder(omittedValues: unknown[]): string {
      return `已选择 ${omittedValues.length} 个`;
    },
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
- Modify: `docs/superpowers/plans/2026-05-26-ranklist-organization-filter-tag-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record organization-filter compact selected-tag parity in the current slice, `/ranklist/:id` coverage, shared SRK Vue wrapper status, deferred product decisions, and known risks.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-ranklist-organization-filter-tag-parity-design.md docs/superpowers/plans/2026-05-26-ranklist-organization-filter-tag-parity.md
git commit -m "feat: 收口榜单组织筛选标签一致性"
```
