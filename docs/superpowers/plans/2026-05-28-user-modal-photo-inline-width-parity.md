# User Modal Photo Inline Width Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React user-modal photo inline `width: 100%` DOM/style parity in the Vue SRK wrapper.

**Architecture:** Keep the existing `SrkAssetImage` component and current wrapper CSS. Add a focused full-chain assertion first, then pass the old inline style to the existing user-photo image usage.

**Tech Stack:** Vue 3 SFC, ant-design-vue modal wrapper, Playwright full-chain E2E, RankLand migration docs.

---

## Files

- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Create: `docs/superpowers/specs/2026-05-28-user-modal-photo-inline-width-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-28-user-modal-photo-inline-width-parity.md`

## Tasks

- [x] Create the design spec and implementation plan.
- [x] Add RED full-chain assertion for user photo inline width.
- [x] Run focused ranklist full-chain test and confirm expected failure.
- [x] Add `style="width: 100%"` to the user-photo `SrkAssetImage` usage.
- [x] Run focused GREEN test and the full ranklist full-chain file.
- [x] Update migration docs with verification evidence.
- [x] Run full migration gate and `git diff --check`.
- [x] Commit as `fix: 还原用户照片内联宽度样式`.

## Step Details

1. Add a Playwright assertion near the existing user-photo computed width checks:

```ts
expect((await photo.getAttribute('style'))?.replace(/\s+/g, ' ')).toContain('width: 100%');
```

Expected RED: focused ranklist test fails because current Vue output lacks the inline width style.

2. Implement the minimal Vue change:

```vue
<SrkAssetImage
  v-if="activeUserPhotoSrc"
  data-id="rankland-user-modal-photo"
  :src="activeUserPhotoSrc"
  alt="选手照片"
  style="width: 100%"
/>
```

Expected GREEN: focused ranklist test passes and existing computed width assertions remain green.

Observed RED: the focused ranklist full-chain test failed because the user photo inline style was `""` and did not contain `width: 100%`.

Observed GREEN: the same focused ranklist full-chain command passed with `1 passed`; the full ranklist full-chain file passed with `9 passed`.

Observed full gate: `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check` passed with Node `v24.11.1`, pnpm `8.15.9`, 6 generated client routes, build pass, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 60 passed / 1 skipped full-chain Playwright tests, and `git diff --check` pass.

3. Verification commands:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

4. Commit boundary:

Commit only the Vue SRK wrapper, ranklist full-chain test, this spec/plan, and migration documentation for the user-modal photo inline width parity slice.
