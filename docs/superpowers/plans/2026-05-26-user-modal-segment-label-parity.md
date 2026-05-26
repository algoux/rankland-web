# User Modal Segment Label Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `所在奖区` segment label behavior in the Vue RankLand user modal.

**Architecture:** Keep the calculation inside `RanklandRanklist`, where the active user payload, rendered static ranklist, active filter marker, and theme are already available. Mirror the old `findUserMatchedMainICPCSeries` rule and render a small label only when the active row has a matched segment.

**Tech Stack:** Vue 3 SFC, `@algoux/standard-ranklist-renderer-component-vue`, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Open the user modal in the ranklist full-chain path**

After export/share assertions, click Team Alpha's `.srk-user-cell`.

- [x] **Step 2: Assert the old segment line**

Assert:

```ts
const userModal = page.locator('[data-id="rankland-ranklist-user-modal"]');
await expect(userModal.locator('.srk-modal')).toBeVisible();
await expect(userModal.locator('[data-id="rankland-user-modal-segment"]')).toContainText('所在奖区（Rank）：');
await expect(userModal.locator('[data-id="rankland-user-modal-segment-label"]')).toHaveText('Gold');
await expect(userModal.locator('[data-id="rankland-user-modal-segment-label"]')).toHaveClass(/bg-segment-gold/);
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fails because `rankland-user-modal-segment` is missing.

### Task 2: Implement Segment Calculation And Rendering

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add segment model type**

Add:

```ts
interface ActiveUserSegment {
  seriesTitle: string;
  segmentTitle: string;
  segmentStyle: string;
}
```

- [x] **Step 2: Add computed `activeUserSegment`**

Use `activeUserPayload.ranklist.series`, `activeUserPayload.ranklist.markers`, `activeUserPayload.row.rankValues`, `resolveUserMarkers`, and `filter.marker` to select the matched ICPC series and segment.

- [x] **Step 3: Render the segment line**

Add after markers:

```vue
<p v-if="activeUserSegment" data-id="rankland-user-modal-segment" class="rankland-user-modal-line rankland-user-modal-segment">
  所在奖区（{{ activeUserSegment.seriesTitle }}）：
  <span
    data-id="rankland-user-modal-segment-label"
    class="rankland-user-modal-segment-label"
    :class="`bg-segment-${activeUserSegment.segmentStyle}`"
  >
    {{ activeUserSegment.segmentTitle }}
  </span>
</p>
```

- [x] **Step 4: Restore old CSS**

Add `.rankland-user-modal-segment-label` and `bg-segment-*` classes with preset SRK colors.

- [x] **Step 5: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: all ranklist full-chain tests pass.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-user-modal-segment-label-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record user modal segment label parity in route and SRK wrapper status.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-user-modal-segment-label-parity-design.md docs/superpowers/plans/2026-05-26-user-modal-segment-label-parity.md
git commit -m "feat: 收口用户弹窗奖区标签一致性"
```
