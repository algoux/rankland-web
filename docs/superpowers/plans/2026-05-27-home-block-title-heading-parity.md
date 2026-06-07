# Home Block Title Heading Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `h1.block-title` section headings on the Vue home page.

**Architecture:** Keep the existing Vue home route and Ant Design Vue cards. Add Playwright computed DOM/style assertions, then update only home section heading elements and route-scoped heading styles.

**Tech Stack:** Vue 3 SFC, Less, ant-design-vue, Playwright full-chain tests, RankLand migration docs.

---

### Task 1: Focused Failing Test

**Files:**
- Modify: `tests/e2e/full-chain/home.spec.ts`

- [x] Add a helper that reads the recommendations section title presentation:

```ts
async function getHomeRecommendationTitlePresentation(page: Page) {
  return page.evaluate(() => {
    const heading = document.querySelector<HTMLElement>('[data-id="home-recommendations"] > :first-child');
    if (!heading) {
      throw new Error('Missing home recommendations heading');
    }

    const style = getComputedStyle(heading);
    return {
      tagName: heading.tagName,
      className: heading.className,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      marginBottom: style.marginBottom,
      text: heading.textContent?.trim(),
    };
  });
}
```

- [x] In the main home full-chain test, assert legacy title DOM and typography:

```ts
expect(await getHomeRecommendationTitlePresentation(page)).toMatchObject({
  tagName: 'H1',
  className: 'block-title',
  fontSize: '32px',
  fontWeight: '500',
  marginBottom: '20px',
  text: '为你推荐',
});
```

- [x] Run focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "renders the RankLand home page"
```

Expected: FAIL because the current heading is `H2`, has no `block-title` class, and uses `22px`.

### Task 2: Minimal Vue Heading Fix

**Files:**
- Modify: `src/client/modules/home/home.view.vue`

- [x] Change each section heading from plain `h2` to `h1 class="block-title"`:

```vue
<h1 class="block-title">为你推荐</h1>
```

Apply the same pattern for `算竞周边工具`, `资源和生态`, `联系我们`, and `关于我们`.

- [x] Replace the route-scoped section heading CSS:

```less
.home-section .block-title {
  margin: 0 0 20px;
  color: var(--rankland-legacy-text-color);
  font-size: 32px;
  font-weight: 500;
}
```

- [x] Run focused GREEN:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "renders the RankLand home page"
```

Expected: PASS.

- [x] Run the full home full-chain spec:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts
```

Expected: PASS.

### Task 3: Migration Documentation

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] Record current slice as `home block-title heading parity`.
- [x] Add home route coverage for legacy `h1.block-title` section titles and 32px heading typography.
- [x] Refresh final gate wording after verification.

### Task 4: Final Verification And Commit

**Files:**
- All modified files in this slice.

- [x] Run the full migration gate:

```bash
node -v
corepack pnpm -v
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated routes clean, migration tests pass, whitespace check passes.

- [x] Stage and verify the staged diff:

```bash
git add tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-home-block-title-heading-parity-design.md docs/superpowers/plans/2026-05-27-home-block-title-heading-parity.md
git diff --cached --check
```

Expected: PASS.

- [x] Commit:

```bash
git commit -m "fix: 还原首页区块标题"
```
