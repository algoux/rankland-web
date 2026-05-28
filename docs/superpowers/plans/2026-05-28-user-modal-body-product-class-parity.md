# User Modal Body Product Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only class from the user modal body root while preserving the old React exact `user-modal` class and inherited text-color behavior.

**Architecture:** Keep the shared Vue SRK user modal structure and all child `data-id` hooks. Add full-chain RED assertions for the exact body class list, then retarget body text color styling from the Vue-only class to the old `.user-modal` class.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain E2E, RankLand migration docs.

---

## Files

- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Create: `docs/superpowers/specs/2026-05-28-user-modal-body-product-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-28-user-modal-body-product-class-parity.md`

## Tasks

- [x] Create the design spec and implementation plan.
- [x] Add RED full-chain assertions for the exact user modal body class list.
- [x] Run focused Ranklist full-chain test and confirm expected failure.
- [x] Remove Vue-only body product class and retarget scoped CSS.
- [x] Run focused GREEN test and the full Ranklist full-chain file.
- [x] Update migration docs with verification evidence.
- [x] Run full migration gate and `git diff --check`.
- [x] Commit as `fix: 还原用户弹窗正文根类名`.

## Step Details

1. Update Ranklist full-chain helper and assertions:

```ts
async function getUserModalBodyColor(page: Page) {
  return page.evaluate(() => {
    const modalBody = document.querySelector<HTMLElement>(
      '[data-id="rankland-ranklist-user-modal"] .user-modal',
    );
    if (!modalBody) {
      throw new Error('Missing rankland user modal body');
    }
    return window.getComputedStyle(modalBody).color;
  });
}
```

```ts
const userModalBody = userModal.locator('.user-modal');
await expect(userModalBody).toBeVisible();
await expect(userModalBody).toHaveClass(/^user-modal$/);
expect(await userModalBody.evaluate((element) => Array.from(element.classList))).not.toContain(
  'rankland-user-modal-body',
);
```

Expected RED: focused Ranklist full-chain test fails because current Vue still emits `rankland-user-modal-body user-modal`.

Observed RED: focused Ranklist full-chain test failed because `.user-modal` still reported `rankland-user-modal-body user-modal` instead of exact old React `user-modal`.

Observed GREEN: after retargeting the photo-width helper from `.rankland-user-modal-body` to `.user-modal`, the focused Ranklist full-chain test passed with `1 passed`; the full Ranklist full-chain file passed with `9 passed`.

Observed full gate: Node `v24.11.1`, pnpm `8.15.9`, `gen:client-router` generated 6 client routes, `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

2. Implement minimal Vue/template and style changes:

```vue
<div v-if="activeUserPayload" class="user-modal">
```

```less
[data-id='rankland-ranklist-user-modal'] .user-modal {
  color: var(--rankland-legacy-text-color);
}
```

3. Verification commands:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
node -v
corepack pnpm -v
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

4. Commit boundary:

Commit only the Vue SRK wrapper, Ranklist full-chain test, this spec/plan, and migration documentation for the user modal body product-class parity slice.
