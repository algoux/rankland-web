# SRK Banner MB-2 Spacing Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React SRK banner spacing responsibility so `img.mb-2` carries the 8px margin and the wrapper has no bottom margin.

**Architecture:** Use the existing shared `rankland-ranklist.vue` banner markup and only adjust scoped CSS. Extend the existing ranklist full-chain header utility helper to assert computed wrapper/image margins in addition to class tokens.

**Tech Stack:** Vue 3 SFC scoped Less, Playwright full-chain E2E, RankLand migration documentation.

---

### Task 1: Add RED E2E Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [ ] **Step 1: Extend `getHeaderUtilityClasses`**

Add computed margin fields for the wrapper and image:

```ts
const bannerWrapStyle = window.getComputedStyle(bannerWrap);
const bannerStyle = window.getComputedStyle(banner);
return {
  bannerWrapClasses: Array.from(bannerWrap.classList),
  bannerClasses: Array.from(banner.classList),
  bannerWrapMarginBottom: bannerWrapStyle.marginBottom,
  bannerMarginBottom: bannerStyle.marginBottom,
  titleClasses: Array.from(title.classList),
  metaClasses: Array.from(meta.classList),
  contributorsClasses: Array.from(contributors.classList),
  timeClasses: Array.from(time.classList),
};
```

- [ ] **Step 2: Update the first `/ranklist/:id` header assertion**

Add these expectations to the existing `getHeaderUtilityClasses(page)` match:

```ts
bannerWrapMarginBottom: '0px',
bannerMarginBottom: '8px',
```

- [ ] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
```

Expected: FAIL because current Vue sets wrapper `margin-bottom: 8px` and leaves image `margin-bottom: 0px`.

### Task 2: Implement Minimal CSS Parity

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [ ] **Step 1: Remove wrapper margin**

Change:

```css
.rankland-ranklist-banner-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}
```

to:

```css
.rankland-ranklist-banner-wrap {
  display: flex;
  justify-content: center;
}
```

- [ ] **Step 2: Apply `mb-2` margin on the banner image**

Add:

```css
.rankland-ranklist-banner.mb-2 {
  margin-bottom: 8px;
}
```

- [ ] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
```

Expected: PASS.

### Task 3: Document, Verify, And Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Update migration docs**

Record the slice as `SRK banner mb-2 spacing parity`, including the focused RED/GREEN result and full gate result.

- [ ] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated routes, migration tests pass, and whitespace check passes.

- [ ] **Step 3: Commit**

Run:

```bash
git add docs/superpowers/specs/2026-05-27-srk-banner-mb2-spacing-parity-design.md docs/superpowers/plans/2026-05-27-srk-banner-mb2-spacing-parity.md tests/e2e/full-chain/ranklist.spec.ts src/client/components/rankland-ranklist.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原 SRK 横幅图片间距"
```

- [ ] **Step 4: Post-commit checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch, commit subject `fix: 还原 SRK 横幅图片间距`, no whitespace errors.
