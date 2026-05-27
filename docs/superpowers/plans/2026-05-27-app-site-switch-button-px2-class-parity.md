# App Site Switch Button px-2 Class Parity Implementation Plan

**Goal:** Restore old React `RightMenu` site-switch trigger `px-2` class parity in the RankLand app shell.

**Architecture:** Keep the existing Vue app shell and Ant Design Vue Dropdown/Menu/Button. Add a focused full-chain helper/assertion for the trigger button class list and padding, then add the minimal Vue class token and global utility rule needed for old React parity.

**Tech Stack:** Vue 3, ant-design-vue, Playwright full-chain E2E, RankLand migration docs.

---

## File Ownership

- Create: `docs/superpowers/specs/2026-05-27-app-site-switch-button-px2-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-27-app-site-switch-button-px2-class-parity.md`
- Modify: `tests/e2e/full-chain/app-shell.spec.ts`
- Modify: `src/client/App.vue`
- Modify: `src/client/index.less`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

### Task 1: Document The Slice

- [x] **Step 1: Save the design spec**

Record the old React `RightMenu` trigger button `px-2` behavior, the Vue missing-class gap, test strategy, and acceptance criteria.

- [x] **Step 2: Save this implementation plan**

Record file ownership, RED/GREEN steps, migration doc updates, full gate command, and commit boundary.

### Task 2: Add The Failing Test

- [x] **Step 1: Add a site-switch button presentation helper**

Add a helper near the existing app-shell presentation helpers that reads the site-switch trigger class list and computed horizontal padding.

- [x] **Step 2: Assert old trigger button class/style behavior**

Add assertions to the existing normal-route app-shell test requiring:

- `classList` contains `app-site-switch` and `px-2`.
- `padding-left` and `padding-right` remain `8px`.

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts -g "renders the global shell with navigation and site switch on normal routes"
```

Result: FAIL as expected because the current Vue trigger preserved `8px` left/right padding but did not include the old `px-2` class token.

### Task 3: Restore Site-Switch Button px-2 Parity

- [x] **Step 1: Restore the trigger class token**

Change the site-switch trigger button to include `px-2` while preserving `app-site-switch`.

- [x] **Step 2: Restore the global utility rule**

Add:

```less
.px-2 {
  padding-left: 8px;
  padding-right: 8px;
}
```

- [x] **Step 3: Run focused GREEN**

Result: PASS with the same focused app-shell full-chain command.

### Task 4: Update Migration Records

- [x] **Step 1: Record the slice**

Update the current focus, app-shell evidence, manual checklist app-shell section, final review app-shell evidence, final gate result, and this plan's checkbox states.

- [x] **Step 2: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Result: PASS with Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, full migration tests green, and whitespace check clean.

### Task 5: Commit The Slice

- [x] **Step 1: Review diff**

Review all files changed by this plan.

- [x] **Step 2: Commit**

Commit with:

```bash
git commit -m "fix: 还原站点切换按钮类名"
```

- [x] **Step 3: Verify committed state**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean worktree on `migration/live-page-foundation`, commit check passes, and no whitespace errors.
