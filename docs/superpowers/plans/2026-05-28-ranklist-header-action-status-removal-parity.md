# Ranklist Header Action Status Removal Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Vue-only inline SRK header action status text after exports while preserving export downloads and share notifications.

**Architecture:** Update existing full-chain export tests to assert the absence of the status node after export clicks, then delete the Vue state/render path that produced the inline status. Keep converter helpers, download behavior, Ant Design Vue Dropdown/Menu, and share `notification.success` unchanged.

**Tech Stack:** Vue 3 SFC, Ant Design Vue Dropdown/Menu/notification, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Add RED Full-Chain No-Status Assertions

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [ ] **Step 1: Add Ranklist no-status assertions after exports**

In `tests/e2e/full-chain/ranklist.spec.ts`, after the SRK download content assertion, add:

```ts
await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveCount(0);
```

Replace the existing Gym Ghost status assertion:

```ts
await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('Gym Ghost 已导出');
```

with:

```ts
await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveCount(0);
```

Replace the existing VJudge Replay status assertion:

```ts
await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('VJudge Replay 已导出');
```

with:

```ts
await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveCount(0);
```

Replace the existing Excel status assertion:

```ts
await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('Excel 已导出');
```

with:

```ts
await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveCount(0);
```

- [ ] **Step 2: Add Live no-status assertion after export**

In `tests/e2e/full-chain/live.spec.ts`, replace:

```ts
await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('Gym Ghost 已导出');
```

with:

```ts
await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveCount(0);
```

- [ ] **Step 3: Run focused RED checks**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page, preserves queries, polls live ranklist, and guards WebSocket setup"
```

Expected: both fail because the current Vue header renders `rankland-ranklist-action-status` after export actions.

### Task 2: Remove Vue Inline Action Status

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [ ] **Step 1: Remove the header status node**

Delete this template block:

```vue
<span v-if="actionStatus" data-id="rankland-ranklist-action-status" class="rankland-ranklist-action-status">
  {{ actionStatus }}
</span>
```

- [ ] **Step 2: Remove component state**

Delete this `data()` property:

```ts
actionStatus: '',
```

Delete this `resetControls()` assignment:

```ts
this.actionStatus = '';
```

- [ ] **Step 3: Remove status assignments**

Delete these export/copy failure assignments:

```ts
this.actionStatus = 'SRK 已导出';
this.actionStatus = 'Gym Ghost 已导出';
this.actionStatus = 'Gym Ghost 导出失败';
this.actionStatus = 'VJudge Replay 已导出';
this.actionStatus = 'VJudge Replay 导出失败';
this.actionStatus = 'Excel 已导出';
this.actionStatus = 'Excel 导出失败';
this.actionStatus = '复制失败';
```

- [ ] **Step 4: Remove unused style rule**

Delete:

```less
.rankland-ranklist-action-status {
  align-self: center;
  color: #237804;
}
```

- [ ] **Step 5: Run focused GREEN checks**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page, preserves queries, polls live ranklist, and guards WebSocket setup"
```

Expected: both focused specs pass.

### Task 3: Widen Regression And Docs

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`

- [ ] **Step 1: Run route-level regressions**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts
```

Expected: Ranklist and Live full-chain files pass.

- [ ] **Step 2: Update migration docs**

Record that SRK header action status removal parity is verified: export actions preserve downloads but no longer render Vue-only inline status text, while share-copy success notifications remain Ant Design Vue notifications.

- [ ] **Step 3: Run full completed-slice gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, router generation completes, migration tests pass, and `git diff --check` has no output.

### Task 4: Commit And Post-Check

**Files:**
- Commit all changed files for this slice only.

- [ ] **Step 1: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts docs/migration/status.md docs/migration/final-integration-review.md docs/migration/manual-acceptance-checklist.md docs/superpowers/specs/2026-05-28-ranklist-header-action-status-removal-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-header-action-status-removal-parity.md
git commit -m "fix: 移除榜单操作状态"
```

- [ ] **Step 2: Post-check**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: branch clean, latest commit is `fix: 移除榜单操作状态`, and whitespace checks have no output.
