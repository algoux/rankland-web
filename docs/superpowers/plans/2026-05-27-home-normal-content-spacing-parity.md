# Home Normal Content Spacing Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React home page `normal-content` padding and `home-intro` block spacing in the Vue home route.

**Architecture:** Keep the Vue home component and existing Ant Design Vue content structure. Add Playwright computed-style coverage, then adjust only the route-scoped Less styles in `home.view.vue`.

**Tech Stack:** Vue 3 SFC, Less, ant-design-vue, Playwright full-chain tests, RankLand migration docs.

---

### Task 1: Focused Failing Test

**Files:**
- Modify: `tests/e2e/full-chain/home.spec.ts`

- [x] Add a helper that reads computed home spacing from the DOM:

```ts
async function getHomeContentSpacing(page: Page) {
  return page.evaluate(() => {
    const content = document.querySelector<HTMLElement>('[data-id="home-content"]');
    const section = document.querySelector<HTMLElement>('[data-id="home-recommendations"]');
    const heading = document.querySelector<HTMLElement>('[data-id="home-recommendations"] h2');
    if (!content || !section || !heading) {
      throw new Error('Missing home content spacing probe elements');
    }
    const contentStyle = getComputedStyle(content);
    const sectionStyle = getComputedStyle(section);
    const headingStyle = getComputedStyle(heading);

    return {
      maxWidth: contentStyle.maxWidth,
      paddingTop: contentStyle.paddingTop,
      paddingRight: contentStyle.paddingRight,
      paddingBottom: contentStyle.paddingBottom,
      paddingLeft: contentStyle.paddingLeft,
      sectionMarginTop: sectionStyle.marginTop,
      headingMarginBottom: headingStyle.marginBottom,
    };
  });
}
```

- [x] In `keeps the home page layout within desktop and mobile viewport bounds`, assert desktop and mobile spacing:

```ts
expect(await getHomeContentSpacing(page)).toMatchObject({
  maxWidth: 'none',
  paddingTop: '32px',
  paddingRight: '50px',
  paddingBottom: '32px',
  paddingLeft: '50px',
  sectionMarginTop: '40px',
  headingMarginBottom: '20px',
});
```

After switching to mobile viewport:

```ts
expect(await getHomeContentSpacing(page)).toMatchObject({
  maxWidth: 'none',
  paddingTop: '32px',
  paddingRight: '20px',
  paddingBottom: '32px',
  paddingLeft: '20px',
  sectionMarginTop: '40px',
  headingMarginBottom: '20px',
});
```

- [x] Run focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "keeps the home page layout"
```

Expected: FAIL because current Vue styles use `max-width: 960px`, `padding-top: 48px`, `sectionMarginTop: 36px`, or `headingMarginBottom: 16px`.

### Task 2: Minimal Vue Style Fix

**Files:**
- Modify: `src/client/modules/home/home.view.vue`

- [x] Update `.home-page`:

```less
.home-page {
  margin: 0;
  padding: 32px 50px;
}
```

- [x] Update `.home-section` and `.home-section h2`:

```less
.home-section {
  margin-top: 40px;
}

.home-section h2 {
  margin: 0 0 20px;
  font-size: 22px;
  line-height: 1.35;
}
```

- [x] Update mobile media rule:

```less
@media (max-width: 768px) {
  .home-page {
    padding-right: 20px;
    padding-left: 20px;
  }
}
```

- [x] Run focused GREEN:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "keeps the home page layout"
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

- [x] Record current slice as `home normal-content spacing parity`.
- [x] Add home route coverage for legacy normal-content padding and block heading spacing.
- [x] Mark home desktop/mobile layout notes with restored `normal-content` and `home-intro` block spacing.
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
git add tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-home-normal-content-spacing-parity-design.md docs/superpowers/plans/2026-05-27-home-normal-content-spacing-parity.md
git diff --cached --check
```

Expected: PASS.

- [x] Commit:

```bash
git commit -m "fix: 还原首页内容间距"
```
