# Home About Separator Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `mx-2` class token and 8px horizontal spacing semantics on the RankLand home About section separator.

**Architecture:** Keep the existing Vue home route and the local `home-separator` hook. Add a focused full-chain helper that inspects the rendered separator, then add the minimal class token and local utility rule needed for old React DOM/presentation parity.

**Tech Stack:** Vue 3, Playwright full-chain E2E, RankLand migration docs.

---

## File Ownership

- Create: `docs/superpowers/specs/2026-05-27-home-about-separator-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-27-home-about-separator-class-parity.md`
- Modify: `tests/e2e/full-chain/home.spec.ts`
- Modify: `src/client/modules/home/home.view.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

### Task 1: Document The Slice

**Files:**
- Create: `docs/superpowers/specs/2026-05-27-home-about-separator-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-27-home-about-separator-class-parity.md`

- [x] **Step 1: Save the design spec**

Record the old React `span.mx-2` behavior, the Vue missing-class gap, test strategy, and acceptance criteria in the design spec.

- [x] **Step 2: Save this implementation plan**

Record file ownership, RED/GREEN steps, migration doc updates, full gate command, and commit boundary.

### Task 2: Add The Failing Test

**Files:**
- Modify: `tests/e2e/full-chain/home.spec.ts`

- [x] **Step 1: Add an About separator presentation helper**

Add this helper near the existing home presentation helpers:

```ts
async function getHomeAboutSeparatorPresentation(page: Page) {
  return page.evaluate(() => {
    const separator = document.querySelector<HTMLElement>('[data-id="home-about"] .home-separator');
    if (!separator) {
      throw new Error('Missing home about separator');
    }

    const style = getComputedStyle(separator);
    return {
      classList: Array.from(separator.classList),
      marginLeft: style.marginLeft,
      marginRight: style.marginRight,
      text: separator.textContent?.trim(),
    };
  });
}
```

- [x] **Step 2: Assert old separator class and spacing**

Add this assertion beside the existing About separator color check:

```ts
expect(await getHomeAboutSeparatorPresentation(page)).toEqual({
  classList: expect.arrayContaining(['mx-2', 'home-separator']),
  marginLeft: '8px',
  marginRight: '8px',
  text: '|',
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts -g "renders the RankLand home page through SSR"
```

Expected: FAIL because the current Vue separator does not include `mx-2`.

### Task 3: Restore About Separator Class Token

**Files:**
- Modify: `src/client/modules/home/home.view.vue`

- [x] **Step 1: Restore the separator class token**

Change the separator to:

```vue
<span class="mx-2 home-separator">|</span>
```

- [x] **Step 2: Restore the local utility rule**

Add this home-local utility rule:

```less
.mx-2 {
  margin-right: 8px;
  margin-left: 8px;
}
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts -g "renders the RankLand home page through SSR"
```

Expected: PASS, including the new separator class/spacing assertion and existing home assertions.

### Task 4: Update Migration Records

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-home-about-separator-class-parity.md`

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
git diff -- tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-home-about-separator-class-parity-design.md docs/superpowers/plans/2026-05-27-home-about-separator-class-parity.md
```

- [x] **Step 2: Commit**

Run:

```bash
git add tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-home-about-separator-class-parity-design.md docs/superpowers/plans/2026-05-27-home-about-separator-class-parity.md
git commit -m "fix: 还原首页其他链接分隔符类名"
```

- [x] **Step 3: Verify committed state**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean worktree on `migration/live-page-foundation`, commit check passes, and no whitespace errors.
