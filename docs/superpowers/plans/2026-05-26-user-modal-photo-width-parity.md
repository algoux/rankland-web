# User Modal Photo Width Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React full-width photo sizing in the Vue RankLand user modal.

**Architecture:** Keep the behavior in `RanklandRanklist` scoped CSS, where the user modal photo is already rendered and asset URLs are already resolved. Use the existing Team Alpha fixture photo and full-chain modal path as the regression surface.

**Tech Stack:** Vue 3 SFC scoped Less, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add user modal photo assertions**

After the existing user modal marker assertions and before segment assertions, add:

```ts
const photo = userModal.locator('[data-id="rankland-user-modal-photo"]');
await expect(photo).toHaveAttribute('alt', '选手照片');
const photoStyle = await photo.evaluate((element) => {
  const style = window.getComputedStyle(element);
  return {
    width: style.width,
    maxWidth: style.maxWidth,
  };
});
const photoModalBodyWidth = await photo.evaluate((element) => {
  const modalBody = element.closest('.rankland-user-modal-body');
  return modalBody ? window.getComputedStyle(modalBody).width : '';
});
expect(photoStyle).toMatchObject({
  width: photoModalBodyWidth,
  maxWidth: '100%',
});
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fails because the image only has `max-width: 100%` and does not compute to the parent width.

### Task 2: Implement Vue Photo Width Styling

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Restore full-width image sizing**

Update the existing scoped CSS:

```less
.rankland-user-modal-photo {
  margin-top: 16px;

  img {
    width: 100%;
    max-width: 100%;
  }
}
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
- Modify: `docs/superpowers/plans/2026-05-26-user-modal-photo-width-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record user modal photo width parity in `/ranklist/:id` coverage, SRK wrapper infrastructure status, deferred product decisions, known risks, and current focus.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-user-modal-photo-width-parity-design.md docs/superpowers/plans/2026-05-26-user-modal-photo-width-parity.md
git commit -m "feat: 收口用户弹窗照片宽度一致性"
```
