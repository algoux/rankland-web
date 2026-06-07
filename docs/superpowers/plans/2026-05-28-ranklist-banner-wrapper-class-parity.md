# Ranklist Banner Wrapper Class Parity Implementation Plan

> **For agentic workers:** Execute task-by-task. Keep checkboxes updated with observed evidence.

**Goal:** Remove the Vue-only `.rankland-ranklist-banner-wrap` product class while preserving old React `div.flex.items-center.justify-center` banner wrapper layout.

**Architecture:** Keep the Vue ranklist renderer and existing banner image/test hook. Move wrapper presentation to a scoped old-utility-shape selector.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - Capture Banner Wrapper Class Contract

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Tighten banner wrapper assertion**

In `renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend`, assert:

- banner wrapper class list contains `flex`, `items-center`, and `justify-center`;
- banner wrapper class list does not contain `rankland-ranklist-banner-wrap`;
- wrapper computed `display`, `align-items`, `justify-content`, and bottom margin remain correct.

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
```

Expected: FAIL because current Vue still renders `.rankland-ranklist-banner-wrap`.

Observed: FAIL as expected. Playwright first reported `bannerWrapAlignItems` as `normal` instead of old utility `center`, confirming the wrapper was still depending on Vue-only styling rather than complete old utility semantics.

### Task 2: GREEN - Remove Vue-Only Banner Wrapper Class

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove banner wrapper product class**

Change the banner wrapper to:

```vue
<div v-if="contestBannerSrc" class="flex items-center justify-center">
```

- [x] **Step 2: Preserve layout with old utility-shape selector**

Replace `.rankland-ranklist-banner-wrap` styling with:

```less
.flex.items-center.justify-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

- [x] **Step 3: Run focused GREEN**

Run the focused command from Task 1. Expected: PASS.

Observed: PASS, `1 passed (19.7s)`.

- [x] **Step 4: Run ranklist full-chain regression**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: PASS.

Observed: PASS, `9 passed (26.7s)`.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/superpowers/plans/2026-05-28-ranklist-banner-wrapper-class-parity.md`

- [x] **Step 1: Update migration docs**

Record:

- slice name: `Ranklist banner wrapper class parity`;
- RED evidence for the Vue-only banner wrapper class;
- GREEN evidence for focused ranklist route test;
- ranklist full-chain regression and full gate evidence.

Observed: migration docs now record Ranklist banner wrapper class parity as the current verified slice, including RED for missing old utility semantics (`align-items: normal`) and the guard against `.rankland-ranklist-banner-wrap`, GREEN for old `flex items-center justify-center` without the Vue-only class, ranklist full-chain 9-test regression evidence, and the full migration gate evidence from Task 3 Step 2.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated client routes, build/unit/SSR/shallow/full-chain migration tests green, and no whitespace errors.

Observed: PASS. `node -v` reported `v24.11.1`; `corepack pnpm -v` reported `8.15.9`; `gen:client-router` generated 8 client routes; `test:migration` passed build, 35 unit files / 152 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` exited cleanly.

- [x] **Step 3: Commit the completed slice**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-ranklist-banner-wrapper-class-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-banner-wrapper-class-parity.md
git diff --cached --check
git commit -m "fix: 还原榜单横幅外壳类名"
```

Observed before commit: `git diff --check` and `git diff --cached --check` both exited cleanly with the intended slice files staged.
