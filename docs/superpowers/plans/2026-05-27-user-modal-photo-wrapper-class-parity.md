# User Modal Photo Wrapper Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `mt-4` class token on the user modal photo wrapper in the Vue SRK wrapper.

**Architecture:** Keep the existing migrated `.rankland-user-modal-photo` hook and full-width image styling. Add only the missing utility class token and verify it through the existing Ranklist full-chain user modal scenario.

**Tech Stack:** Vue 3 SFC, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Capture RED Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add photo wrapper class and spacing assertions**

```ts
const photoWrapper = userModal.locator('.rankland-user-modal-photo');
await expect(photoWrapper).toHaveClass(/(^|\s)mt-4(\s|$)/);
const photoWrapperStyle = await photoWrapper.evaluate((element) => {
  const style = window.getComputedStyle(element);
  return {
    marginTop: style.marginTop,
  };
});
expect(photoWrapperStyle).toMatchObject({
  marginTop: '16px',
});
```

- [x] **Step 2: Keep existing image assertions**

The existing image assertions must continue to verify:

```ts
await expect(photo).toHaveAttribute('alt', '选手照片');
expect(photoStyle).toMatchObject({
  width: photoModalBodyWidth,
  maxWidth: '100%',
});
```

- [x] **Step 3: Run the focused full-chain test and verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL because the photo wrapper class is currently `rankland-user-modal-photo` and does not include `mt-4`.

### Task 2: Restore Vue Class Token

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add the old utility class to the photo wrapper**

```vue
<div v-if="activeUserPhotoSrc" class="rankland-user-modal-photo mt-4">
```

- [x] **Step 2: Run the focused full-chain test and verify GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: PASS.

### Task 3: Update Migration Records And Gate

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Record the verified photo wrapper class parity slice**

Update the dashboard, acceptance checklist, and final review to mention old photo-wrapper `mt-4` class parity and full-width image coverage.

- [x] **Step 2: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with Node 24, pnpm 8, generated client routes, migration test suite, and whitespace check.

- [x] **Step 3: Commit the verified slice**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-user-modal-photo-wrapper-class-parity-design.md docs/superpowers/plans/2026-05-27-user-modal-photo-wrapper-class-parity.md
git commit -m "fix: 还原用户弹窗旧版照片外壳类名"
```
