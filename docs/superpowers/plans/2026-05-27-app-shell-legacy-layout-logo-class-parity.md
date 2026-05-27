# App Shell Legacy Layout And Logo Class Parity Implementation Plan

**Goal:** Restore old React root shell `layout`, `flex justify-between`, and `logo` DOM/class parity in the Vue app shell.

**Architecture:** Keep the existing Ant Design Vue shell and migrated `app-*` hooks. Add old class tokens and the old inner logo wrapper, backed by one focused full-chain helper/assertion, then run the full migration gate.

**Tech Stack:** Vue 3, ant-design-vue, Playwright full-chain E2E, RankLand migration docs.

---

## File Ownership

- Create: `docs/superpowers/specs/2026-05-27-app-shell-legacy-layout-logo-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-27-app-shell-legacy-layout-logo-class-parity.md`
- Modify: `tests/e2e/full-chain/app-shell.spec.ts`
- Modify: `src/client/App.vue`
- Modify: `src/client/index.less`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

### Task 1: Document The Slice

- [x] **Step 1: Save the design spec**

Record the old React `RootLayout` shell class/DOM behavior, the Vue missing-hook gap, test strategy, and acceptance criteria.

- [x] **Step 2: Save this implementation plan**

Record file ownership, RED/GREEN steps, migration doc updates, full gate command, and commit boundary.

### Task 2: Add The Failing Test

- [x] **Step 1: Add a legacy shell presentation helper**

Add a helper near the existing app-shell presentation helpers that reads:

- root shell class list;
- header inner class list, display, justify-content, min-height, and column gap;
- logo link class list;
- inner logo box class list and dimensions;
- logo image dimensions.

- [x] **Step 2: Assert old shell class/DOM behavior**

Add assertions to the existing normal-route app-shell test requiring:

- shell class list includes `app-shell` and `layout`;
- header inner class list includes `app-header-inner`, `flex`, and `justify-between`;
- header inner computes `display: flex`, `justify-content: space-between`, `min-height: 64px`, and `column-gap: 0px`;
- logo link class list includes `app-logo`;
- inner logo box class list includes `logo`;
- logo box is 64px by 64px;
- logo image is 40px by 40px.

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts -g "renders the global shell with navigation and site switch on normal routes"
```

Expected: FAIL because current Vue shell lacks old `layout`, `flex`, `justify-between`, and inner `.logo` DOM/class contract.

Result: FAIL reproduced the gap. The shell was missing `layout`, the header inner was missing `flex justify-between`, computed `justify-content` was `normal`, and the logo link had no inner `.logo` box.

### Task 3: Restore Legacy Shell Class/DOM Parity

- [x] **Step 1: Restore root and header classes**

Add `layout` to the root `<a-layout>` and `flex justify-between` to `.app-header-inner`.

- [x] **Step 2: Restore the old logo box DOM**

Wrap the logo image in:

```vue
<div class="logo app-logo-box">
  <img :src="logo" alt="RankLand">
</div>
```

- [x] **Step 3: Restore CSS rules**

Add `.layout`, `.flex`, `.justify-between`, `.logo`, `.app-logo-box`, and `.logo img` rules while preserving current `.app-logo` link dimensions and centering.

- [x] **Step 4: Run focused GREEN**

Run the same focused app-shell full-chain command and expect it to pass.

Result: PASS. The focused app-shell full-chain test verified root `layout`, header `flex justify-between` / `space-between`, the 64px `.logo` box, the 40px logo image, and existing shell behavior.

### Task 4: Update Migration Records

- [x] **Step 1: Record the slice**

Update the current focus, app-shell evidence, manual checklist app-shell section, final review app-shell evidence, final gate result, and this plan's checkbox states.

- [x] **Step 2: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with generated 8 client routes, full migration tests green, and whitespace check clean.

Result: PASS with Node `v24.11.1`, pnpm `8.15.9`, 8 generated client routes, build, 35 unit files / 151 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 58 passed / 1 skipped default full-chain Playwright tests, and `git diff --check`.

### Task 5: Commit The Slice

- [x] **Step 1: Review diff**

Review all files changed by this plan.

Result: Reviewed the code, test, spec/plan, and migration-doc diff; changes are limited to this slice.

- [x] **Step 2: Commit**

Commit with:

```bash
git commit -m "fix: 还原应用外壳布局类名"
```

Result: Commit created with message `fix: 还原应用外壳布局类名`.

- [x] **Step 3: Verify committed state**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean worktree on `migration/live-page-foundation`, commit check passes, and no whitespace errors.

Result: `git status --short --branch`, `git show --check --oneline HEAD`, and `git diff --check` passed for the committed state.
