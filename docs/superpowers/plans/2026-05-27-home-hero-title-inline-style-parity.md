# Home Hero Title Inline Style Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React inline `font-size: 32px` style on the RankLand home hero title.

**Architecture:** Keep the existing Vue home route and scoped CSS. Add a focused full-chain helper that inspects the hero title, then add the minimal inline style needed for old React DOM/style parity.

**Tech Stack:** Vue 3, Playwright full-chain E2E, RankLand migration docs.

---

## File Ownership

- Create: `docs/superpowers/specs/2026-05-27-home-hero-title-inline-style-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-27-home-hero-title-inline-style-parity.md`
- Modify: `tests/e2e/full-chain/home.spec.ts`
- Modify: `src/client/modules/home/home.view.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

### Task 1: Document The Slice

**Files:**
- Create: `docs/superpowers/specs/2026-05-27-home-hero-title-inline-style-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-27-home-hero-title-inline-style-parity.md`

- [x] **Step 1: Save the design spec**

Record the old React `h1` inline `fontSize: '32px'` behavior, the Vue CSS-only gap, test strategy, and acceptance criteria in the design spec.

- [x] **Step 2: Save this implementation plan**

Record file ownership, RED/GREEN steps, migration doc updates, full gate command, and commit boundary.

### Task 2: Add The Failing Test

**Files:**
- Modify: `tests/e2e/full-chain/home.spec.ts`

- [x] **Step 1: Add a hero title presentation helper**

Add this helper near the existing home presentation helpers:

```ts
async function getHomeHeroTitlePresentation(page: Page) {
  return page.evaluate(() => {
    const title = document.querySelector<HTMLElement>('[data-id="home-hero"] h1');
    if (!title) {
      throw new Error('Missing home hero title');
    }

    const style = getComputedStyle(title);
    return {
      fontSize: style.fontSize,
      inlineFontSize: title.style.fontSize,
      text: title.textContent?.trim(),
    };
  });
}
```

- [x] **Step 2: Assert old inline style and computed size**

Add this assertion near the existing home hero paragraph assertions:

```ts
expect(await getHomeHeroTitlePresentation(page)).toEqual({
  fontSize: '32px',
  inlineFontSize: '32px',
  text: '欢迎来到 RankLand',
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts -g "renders the RankLand home page through SSR"
```

Expected: FAIL because the current Vue title does not include the old inline `font-size` style.

### Task 3: Restore Hero Title Inline Style

**Files:**
- Modify: `src/client/modules/home/home.view.vue`

- [x] **Step 1: Restore the inline style**

Change the hero title to:

```vue
<h1 style="font-size: 32px;">欢迎来到 RankLand</h1>
```

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts -g "renders the RankLand home page through SSR"
```

Expected: PASS, including the new hero title inline-style assertion and existing home assertions.

### Task 4: Update Migration Records

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-home-hero-title-inline-style-parity.md`

- [x] **Step 1: Record the slice**

Update the current focus, home route evidence, manual checklist home section, final review home evidence, final gate result, and this plan's checkbox states.

- [x] **Step 2: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with generated 8 client routes, full migration tests green, and whitespace check clean.

### Task 5: Commit The Slice

**Files:**
- Commit all files changed by this plan.

- [x] **Step 1: Review diff**

Run:

```bash
git diff -- tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-home-hero-title-inline-style-parity-design.md docs/superpowers/plans/2026-05-27-home-hero-title-inline-style-parity.md
```

- [x] **Step 2: Commit**

Run:

```bash
git add tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-home-hero-title-inline-style-parity-design.md docs/superpowers/plans/2026-05-27-home-hero-title-inline-style-parity.md
git commit -m "fix: 还原首页 Hero 标题内联字号"
```

- [x] **Step 3: Verify committed state**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean worktree on `migration/live-page-foundation`, commit check passes, and no whitespace errors.
