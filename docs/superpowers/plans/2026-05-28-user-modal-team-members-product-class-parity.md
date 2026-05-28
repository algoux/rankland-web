# User Modal Team Members Product Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only team-members row product class while preserving the old React `user-modal-info-team-members mt-2` row contract.

**Architecture:** Keep the current Vue template and test hook shape, but make the rendered class list match old React exactly. Move the row's display, opacity, padding, and margin CSS from the Vue-only class selector to a stable `data-id` selector combined with the old class tokens.

**Tech Stack:** Vue 3 SFC, Less scoped styles, Playwright full-chain E2E, RankLand migration docs.

---

## File Structure

- Modify `tests/e2e/full-chain/ranklist.spec.ts`: add RED/GREEN class-list assertions to the existing user modal full-chain scenario.
- Modify `src/client/components/rankland-ranklist.vue`: remove the Vue-only row class and retarget scoped CSS.
- Modify migration docs after verification:
  - `docs/migration/status.md`
  - `docs/migration/manual-acceptance-checklist.md`
  - `docs/migration/final-integration-review.md`
- Create this spec/plan pair:
  - `docs/superpowers/specs/2026-05-28-user-modal-team-members-product-class-parity-design.md`
  - `docs/superpowers/plans/2026-05-28-user-modal-team-members-product-class-parity.md`

## Tasks

- [x] Create the design spec and implementation plan.
- [x] Add RED full-chain assertions for the exact team-members row class list.
- [x] Run focused Ranklist full-chain test and confirm expected failure.
- [x] Remove Vue-only team-members row product class.
- [x] Run focused GREEN test and the full Ranklist full-chain file.
- [x] Update migration docs with verification evidence.
- [x] Run full migration gate and `git diff --check`.
- [x] Commit as `fix: 还原团队成员行类名`.

## Step Details

1. Update Ranklist full-chain assertions:

```ts
const teamMembers = userModal.locator('[data-id="rankland-user-modal-team-members"]');
await expect(teamMembers.locator('[data-id="rankland-user-modal-team-member"]')).toContainText(['Alice', 'Bob']);
await expect(teamMembers).toHaveClass(/^user-modal-info-team-members mt-2$/);
expect(await teamMembers.evaluate((element) => Array.from(element.classList))).not.toContain(
  'rankland-user-modal-team-members',
);
```

Expected RED: focused Ranklist full-chain test fails because current Vue still emits `rankland-user-modal-team-members user-modal-info-team-members mt-2`.

Observed RED: the focused Ranklist full-chain test failed because `[data-id="rankland-user-modal-team-members"]` reported `rankland-user-modal-team-members user-modal-info-team-members mt-2` instead of exact old React `user-modal-info-team-members mt-2`.

Observed GREEN: the focused Ranklist full-chain test passed with `1 passed`; the full Ranklist full-chain file passed with `9 passed`.

Observed full gate: Node `v24.11.1`, pnpm `8.15.9`, `gen:client-router` generated 6 client routes, `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

2. Implement minimal Vue/template and style changes:

```vue
<div
  v-if="activeUserTeamMembers.length > 0"
  data-id="rankland-user-modal-team-members"
  class="user-modal-info-team-members mt-2"
>
```

```less
[data-id='rankland-user-modal-team-members'].user-modal-info-team-members.mt-2 {
  display: block;
  margin-top: 8px;
  padding-top: 6px;
  opacity: 0.8;
}
```

3. Verification commands:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

4. Commit boundary:

Commit only the Vue SRK wrapper, Ranklist full-chain test, this spec/plan, and migration documentation for the user modal team-members product-class parity slice.
