# App Site Switch Menu Content Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React default site-switch dropdown menu content class/style parity in the RankLand app shell.

**Architecture:** Keep the existing Vue app shell and Ant Design Vue Dropdown/Menu/Button. Add a focused full-chain helper that inspects the rendered dropdown content, then add the minimal DOM class/style tokens and global utility rules needed for old React parity.

**Tech Stack:** Vue 3, ant-design-vue, Playwright full-chain E2E, RankLand migration docs.

---

## File Ownership

- Create: `docs/superpowers/specs/2026-05-27-app-site-switch-menu-content-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-27-app-site-switch-menu-content-parity.md`
- Modify: `tests/e2e/full-chain/app-shell.spec.ts`
- Modify: `src/client/App.vue`
- Modify: `src/client/index.less`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

### Task 1: Document The Slice

**Files:**
- Create: `docs/superpowers/specs/2026-05-27-app-site-switch-menu-content-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-27-app-site-switch-menu-content-parity.md`

- [x] **Step 1: Save the design spec**

Record the old React `RightMenu` menu content DOM/class/style behavior, the Vue missing-class gap, test strategy, and acceptance criteria in the design spec.

- [x] **Step 2: Save this implementation plan**

Record file ownership, RED/GREEN steps, migration doc updates, full gate command, and commit boundary.

### Task 2: Add The Failing Test

**Files:**
- Modify: `tests/e2e/full-chain/app-shell.spec.ts`

- [x] **Step 1: Add a site-switch menu presentation helper**

Add this helper near the existing app-shell presentation helpers:

```ts
async function getSiteSwitchMenuContentPresentation(page: Page) {
  return page.evaluate(() => {
    const link = document.querySelector<HTMLElement>('[data-id="app-site-switch-link"]');
    const title = link?.querySelector<HTMLElement>('.app-site-switch-title');
    const subtitle = link?.querySelector<HTMLElement>('.app-site-switch-subtitle');
    const subtitleText = subtitle?.querySelector<HTMLElement>('span');
    if (!link || !title || !subtitle || !subtitleText) {
      throw new Error('Missing site-switch menu content');
    }

    const linkStyle = window.getComputedStyle(link);
    const titleStyle = window.getComputedStyle(title);
    const subtitleStyle = window.getComputedStyle(subtitle);
    const subtitleTextStyle = window.getComputedStyle(subtitleText);
    return {
      linkInlineWordBreak: link.style.wordBreak,
      linkWordBreak: linkStyle.wordBreak,
      titleClassList: Array.from(title.classList),
      titleMarginBottom: titleStyle.marginBottom,
      titleText: title.textContent?.trim(),
      subtitleClassList: Array.from(subtitle.classList),
      subtitleMarginBottom: subtitleStyle.marginBottom,
      subtitleText: subtitleText.textContent?.trim(),
      subtitleTextClassList: Array.from(subtitleText.classList),
      subtitleTextFontSize: subtitleTextStyle.fontSize,
      subtitleTextOpacity: subtitleTextStyle.opacity,
    };
  });
}
```

- [x] **Step 2: Assert old menu content class/style behavior**

Add this assertion after the existing site-switch link/arrow assertions:

```ts
expect(await getSiteSwitchMenuContentPresentation(page)).toMatchObject({
  linkInlineWordBreak: 'keep-all',
  linkWordBreak: 'keep-all',
  titleClassList: expect.arrayContaining(['app-site-switch-title', 'mb-0']),
  titleMarginBottom: '0px',
  titleText: '中国站点',
  subtitleClassList: expect.arrayContaining(['app-site-switch-subtitle', 'mb-0']),
  subtitleMarginBottom: '0px',
  subtitleText: '特别速度优化',
  subtitleTextClassList: expect.arrayContaining(['opacity-60', 'text-xs']),
  subtitleTextFontSize: '12px',
  subtitleTextOpacity: '0.6',
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts -g "renders the global shell"
```

Result: FAIL as expected because the current Vue default site-switch menu content computed `word-break: normal`, had no inline `wordBreak`, omitted `mb-0`, omitted `opacity-60 text-xs`, and computed subtitle span opacity `1`.

### Task 3: Restore Site-Switch Menu Content Parity

**Files:**
- Modify: `src/client/App.vue`
- Modify: `src/client/index.less`

- [x] **Step 1: Restore the default link style**

Change the site-switch link to include:

```vue
style="word-break: keep-all;"
```

- [x] **Step 2: Restore paragraph and subtitle classes**

Change the default branch menu content to:

```vue
<p class="app-site-switch-title mb-0">中国站点</p>
<p class="app-site-switch-subtitle mb-0">
  <span class="opacity-60 text-xs">特别速度优化</span>
  <ArrowRightOutlined :rotate="-45" />
</p>
```

- [x] **Step 3: Restore global utility rules**

Add these utility rules to `src/client/index.less`:

```less
.mb-0 {
  margin-bottom: 0;
}

.opacity-60 {
  opacity: 0.6;
}

.text-xs {
  font-size: 12px;
}
```

- [x] **Step 4: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts -g "renders the global shell"
```

Result: PASS, including the new site-switch menu assertions and existing app-shell assertions.

### Task 4: Update Migration Records

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-app-site-switch-menu-content-parity.md`

- [x] **Step 1: Record the slice**

Update the current focus, app shell evidence, manual checklist app shell section, final review app shell evidence, final gate result, and this plan's checkbox states.

- [x] **Step 2: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Result: PASS with Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, full migration tests green, and whitespace check clean.

### Task 5: Commit The Slice

**Files:**
- Commit all files changed by this plan.

- [x] **Step 1: Review diff**

Run:

```bash
git diff -- tests/e2e/full-chain/app-shell.spec.ts src/client/App.vue src/client/index.less docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-app-site-switch-menu-content-parity-design.md docs/superpowers/plans/2026-05-27-app-site-switch-menu-content-parity.md
```

- [x] **Step 2: Commit**

Run:

```bash
git add tests/e2e/full-chain/app-shell.spec.ts src/client/App.vue src/client/index.less docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-app-site-switch-menu-content-parity-design.md docs/superpowers/plans/2026-05-27-app-site-switch-menu-content-parity.md
git commit -m "fix: 还原站点切换菜单内容类名"
```

- [x] **Step 3: Verify committed state**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean worktree on `migration/live-page-foundation`, commit check passes, and no whitespace errors.
