# User Modal Photo Slogan Wrapper Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React user modal photo-and-slogan shared `mt-4` wrapper structure in the Vue SRK wrapper.

**Architecture:** Keep the existing `.rankland-user-modal-photo mt-4` hook as the shared wrapper and move the slogan paragraph inside it. Preserve existing image and slogan CSS, selectors, and full-chain assertions while adding a parent relationship assertion.

**Tech Stack:** Vue 3 SFC, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Capture RED Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add photo/slogan shared-parent assertions**

Add this assertion after the slogan locator is created and before the existing slogan style checks:

```ts
await expect(slogan).toHaveText('Keep moving forward');
await expect(photoWrapper.locator('[data-id="rankland-user-modal-slogan"]')).toHaveText('Keep moving forward');
expect(
  await photo.evaluate((element) => element.parentElement === document.querySelector('[data-id="rankland-user-modal-slogan"]')?.parentElement),
).toBe(true);
expect(
  await slogan.evaluate((element) => element.parentElement?.classList.contains('rankland-user-modal-photo')),
).toBe(true);
```

- [x] **Step 2: Keep existing photo and slogan assertions**

The existing test must continue to assert:

```ts
await expect(photoWrapper).toHaveClass(/(^|\s)mt-4(\s|$)/);
expect(photoWrapperStyle).toMatchObject({
  marginTop: '16px',
});
expect(photoStyle).toMatchObject({
  width: photoModalBodyWidth,
  maxWidth: '100%',
});
await expect(slogan).toHaveClass(/(^|\s)slogan(\s|$)/);
await expect(slogan).toHaveClass(/(^|\s)mt-4(\s|$)/);
await expect(slogan).toHaveClass(/(^|\s)mb-2(\s|$)/);
expect(sloganStyle.fontFamily).toContain('ZCOOL XiaoWei');
```

- [x] **Step 3: Run the focused full-chain test and verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL because the current Vue DOM renders the slogan as a sibling of `.rankland-user-modal-photo`, so the shared-parent assertion is false.

### Task 2: Restore Shared Wrapper DOM

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Move the slogan paragraph into the photo wrapper**

Replace the current separate photo wrapper and slogan paragraph with:

```vue
<div v-if="activeUserPhotoSrc || activeUserSlogan" class="rankland-user-modal-photo mt-4">
  <img
    v-if="activeUserPhotoSrc"
    data-id="rankland-user-modal-photo"
    :src="activeUserPhotoSrc"
    alt="选手照片"
  >
  <p
    v-if="activeUserSlogan"
    data-id="rankland-user-modal-slogan"
    class="rankland-user-modal-slogan slogan mt-4 mb-2"
  >
    {{ activeUserSlogan }}
  </p>
</div>
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

- [x] **Step 1: Record shared wrapper DOM parity**

Update migration docs to mention that the user modal photo and slogan now share the old React `div.mt-4` wrapper structure while retaining the migrated `.rankland-user-modal-photo` hook.

- [x] **Step 2: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with Node 24, pnpm 8, generated client routes, migration test suite, and whitespace check.

- [x] **Step 3: Commit the verified slice**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-user-modal-photo-slogan-wrapper-parity-design.md docs/superpowers/plans/2026-05-27-user-modal-photo-slogan-wrapper-parity.md
git commit -m "fix: 还原用户弹窗旧版照片标语外壳结构"
```
