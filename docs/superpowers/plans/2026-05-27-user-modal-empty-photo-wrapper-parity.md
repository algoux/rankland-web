# User Modal Empty Photo Wrapper Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React user modal behavior where the photo/slogan `mt-4` wrapper exists even for users without photo or slogan.

**Architecture:** Keep the current Vue user-modal body and conditional photo/slogan children. Remove only the wrapper-level condition so `.rankland-user-modal-photo.mt-4` is always rendered for an active user, matching old React's unconditional `div.mt-4`.

**Tech Stack:** Vue 3 SFC, SRK renderer Vue wrapper, Playwright full-chain tests, pnpm migration gates.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add empty photo-wrapper assertions**

In the existing `renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend` test, after Team Beta modal opens and after `unofficialLineStyle` is asserted, add:

```ts
    const betaPhotoWrapper = userModal.locator('.rankland-user-modal-photo');
    await expect(betaPhotoWrapper).toHaveCount(1);
    await expect(betaPhotoWrapper).toHaveClass(/(^|\s)mt-4(\s|$)/);
    await expect(betaPhotoWrapper.locator('[data-id="rankland-user-modal-photo"]')).toHaveCount(0);
    await expect(betaPhotoWrapper.locator('[data-id="rankland-user-modal-slogan"]')).toHaveCount(0);
    const betaPhotoWrapperStyle = await betaPhotoWrapper.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        marginTop: style.marginTop,
      };
    });
    expect(betaPhotoWrapperStyle).toMatchObject({
      marginTop: '16px',
    });
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL because Team Beta currently has no `.rankland-user-modal-photo` wrapper.

### Task 2: Restore Empty Wrapper

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove wrapper-level condition**

Change:

```vue
<div v-if="activeUserPhotoSrc || activeUserSlogan" class="rankland-user-modal-photo mt-4">
```

to:

```vue
<div class="rankland-user-modal-photo mt-4">
```

Keep the existing `v-if="activeUserPhotoSrc"` on `SrkAssetImage` and `v-if="activeUserSlogan"` on the slogan paragraph.

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: PASS.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-user-modal-empty-photo-wrapper-parity.md`

- [x] **Step 1: Update migration docs**

Record user modal empty photo wrapper parity in SRK wrapper route/status coverage, manual acceptance checklist, and final integration review.

- [x] **Step 2: Run the full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-user-modal-empty-photo-wrapper-parity-design.md docs/superpowers/plans/2026-05-27-user-modal-empty-photo-wrapper-parity.md
git commit -m "fix: 保留用户弹窗空照片外壳"
```
