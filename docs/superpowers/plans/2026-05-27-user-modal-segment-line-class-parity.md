# User Modal Segment Line Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old `mt-4 mb-0` class tokens on the shared SRK user modal segment line.

**Architecture:** Add the old class tokens to the existing segment line `<p>`. Keep `.rankland-user-modal-segment` as the scoped style source for the verified `16px`/`0px` spacing.

**Tech Stack:** Vue 3 SFC, SRK Vue Modal, Playwright full-chain E2E.

---

### Task 1: Restore User Modal Segment Line Classes

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Write the failing test**

Add these assertions after the segment line text assertion:

```ts
await expect(segmentLine).toHaveClass(/(^|\s)mt-4(\s|$)/);
await expect(segmentLine).toHaveClass(/(^|\s)mb-0(\s|$)/);
```

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Result: FAIL because the Vue segment line did not carry `mt-4` / `mb-0`.

- [x] **Step 3: Restore old segment line classes**

Change the segment line class to:

```vue
class="rankland-user-modal-line rankland-user-modal-segment mt-4 mb-0"
```

- [x] **Step 4: Run focused verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Result: PASS.

- [x] **Step 5: Update migration docs**

Record user-modal segment line `mt-4 mb-0` class parity in the migration dashboard, manual checklist, and final integration review.

- [x] **Step 6: Run full gate and commit**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Result: Node 24, pnpm 8, route generation succeeded, all migration tests passed, and `git diff --check` exited cleanly.

Commit:

```bash
git add tests/e2e/full-chain/ranklist.spec.ts src/client/components/rankland-ranklist.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-user-modal-segment-line-class-parity-design.md docs/superpowers/plans/2026-05-27-user-modal-segment-line-class-parity.md
git commit -m "fix: 还原用户弹窗旧版奖区行类名"
```
