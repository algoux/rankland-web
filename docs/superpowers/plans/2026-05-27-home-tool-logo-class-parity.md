# Home Tool Logo Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `mr-3 inline-block` class tokens on RankLand home tool-card logos.

**Architecture:** Keep the existing Vue home route and Ant Design Vue card layout. Add a focused full-chain helper that inspects the rendered tool-card logo images, then add the minimal class tokens and local utility rules needed for old React DOM/presentation parity.

**Tech Stack:** Vue 3, ant-design-vue, Playwright full-chain E2E, RankLand migration docs.

---

## File Ownership

- Create: `docs/superpowers/specs/2026-05-27-home-tool-logo-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-27-home-tool-logo-class-parity.md`
- Modify: `tests/e2e/full-chain/home.spec.ts`
- Modify: `src/client/modules/home/home.view.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

### Task 1: Document The Slice

**Files:**
- Create: `docs/superpowers/specs/2026-05-27-home-tool-logo-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-27-home-tool-logo-class-parity.md`

- [x] **Step 1: Save the design spec**

Record the old React `img.mr-3.inline-block` behavior, the Vue missing-class gap, test strategy, and acceptance criteria in the design spec.

- [x] **Step 2: Save this implementation plan**

Record file ownership, RED/GREEN steps, migration doc updates, full gate command, and commit boundary.

### Task 2: Add The Failing Test

**Files:**
- Modify: `tests/e2e/full-chain/home.spec.ts`

- [x] **Step 1: Add a tool logo presentation helper**

Add this helper near the existing home presentation helpers:

```ts
async function getHomeToolLogoPresentation(page: Page) {
  return page.evaluate(() => {
    const logos = [
      { dataId: 'home-tool-paste-then-ac', alt: 'paste.then.ac logo' },
      { dataId: 'home-tool-algo-bootstrap', alt: 'Algo Bootstrap logo' },
    ];

    return logos.map(({ dataId, alt }) => {
      const logo = document.querySelector<HTMLElement>(`[data-id="${dataId}"] img[alt="${alt}"]`);
      if (!logo) {
        throw new Error(`Missing home tool logo: ${dataId}`);
      }

      const style = getComputedStyle(logo);
      return {
        dataId,
        classList: Array.from(logo.classList),
        display: style.display,
        marginRight: style.marginRight,
      };
    });
  });
}
```

- [x] **Step 2: Assert old logo classes and display**

Add this assertion beside the existing tool-logo visual checks:

```ts
expect(await getHomeToolLogoPresentation(page)).toEqual([
  {
    dataId: 'home-tool-paste-then-ac',
    classList: expect.arrayContaining(['mr-3', 'inline-block']),
    display: 'inline-block',
    marginRight: '12px',
  },
  {
    dataId: 'home-tool-algo-bootstrap',
    classList: expect.arrayContaining(['mr-3', 'inline-block']),
    display: 'inline-block',
    marginRight: '12px',
  },
]);
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts -g "renders the RankLand home page through SSR"
```

Expected: FAIL because the current Vue logos do not include `mr-3 inline-block`.

### Task 3: Restore Tool Logo Class Tokens

**Files:**
- Modify: `src/client/modules/home/home.view.vue`

- [x] **Step 1: Restore paste.then.ac logo classes**

Change the paste.then.ac logo to:

```vue
<img :src="pasteThenACLogo" alt="paste.then.ac logo" class="mr-3 inline-block home-card-logo-padded">
```

- [x] **Step 2: Restore Algo Bootstrap logo classes**

Change the Algo Bootstrap logo to:

```vue
<img :src="algoBootstrapLogo" alt="Algo Bootstrap logo" class="mr-3 inline-block">
```

- [x] **Step 3: Restore local utility rules**

Add these home-local utility rules:

```less
.mr-3 {
  margin-right: 12px;
}

.inline-block {
  display: inline-block;
}
```

- [x] **Step 4: Restore title block flow**

Change `.home-card-title` to:

```less
.home-card-title {
  display: block;
  column-gap: 0;
}
```

- [x] **Step 5: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts -g "renders the RankLand home page through SSR"
```

Expected: PASS, including the new logo class/display assertions and existing home assertions.

### Task 4: Update Migration Records

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-home-tool-logo-class-parity.md`

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
git diff -- tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-home-tool-logo-class-parity-design.md docs/superpowers/plans/2026-05-27-home-tool-logo-class-parity.md
```

- [x] **Step 2: Commit**

Run:

```bash
git add tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-home-tool-logo-class-parity-design.md docs/superpowers/plans/2026-05-27-home-tool-logo-class-parity.md
git commit -m "fix: 还原首页工具卡 Logo 类名"
```

- [x] **Step 3: Verify committed state**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean worktree on `migration/live-page-foundation`, commit check passes, and no whitespace errors.
