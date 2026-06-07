# Home Non-Card Text Color Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old Ant Design/global body text color parity for non-card text on the homepage in dark mode.

**Architecture:** Keep the change local to the home route. Full-chain E2E proves the visible contract, and Vue scoped CSS uses the already restored global `--rankland-legacy-text-color` token.

**Tech Stack:** Vue 3 SFC scoped LESS, Ant Design Vue, Playwright full-chain E2E, bwcx/vite-ssr migration harness.

---

### Task 1: RED Test For Homepage Non-Card Text

**Files:**
- Modify: `tests/e2e/full-chain/home.spec.ts`

- [x] **Step 1: Add failing dark-mode assertions**

Add these checks after the existing home statistics/card assertions in `renders the RankLand home page through SSR, hydration, RanklandApiService, and the mock backend`:

```ts
    await expect(page.locator('[data-id="home-hero"] p')).toHaveCSS('color', 'rgba(255, 255, 255, 0.85)');
    await expect(page.locator('[data-id="home-resources"] li').first()).toHaveCSS(
      'color',
      'rgba(255, 255, 255, 0.85)',
    );
    await expect(page.locator('[data-id="home-about"] .home-separator')).toHaveCSS(
      'color',
      'rgba(255, 255, 255, 0.85)',
    );
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "renders the RankLand home page"
```

Expected: FAIL because the current Vue CSS computes at least the hero paragraph to `rgb(63, 74, 86)` instead of `rgba(255, 255, 255, 0.85)`.

### Task 2: Minimal Homepage CSS Fix

**Files:**
- Modify: `src/client/modules/home/home.view.vue`

- [x] **Step 1: Replace hard-coded non-card text colors**

Change:

```less
.home-hero p {
  max-width: 760px;
  margin: 0;
  color: #3f4a56;
  font-size: 16px;
  line-height: 1.8;
}

.home-section p,
.home-section li {
  color: #3f4a56;
  line-height: 1.8;
}

.home-separator {
  margin: 0 8px;
  color: #8a96a3;
}
```

To:

```less
.home-hero p {
  max-width: 760px;
  margin: 0;
  color: var(--rankland-legacy-text-color);
  font-size: 16px;
  line-height: 1.8;
}

.home-section p,
.home-section li {
  color: var(--rankland-legacy-text-color);
  line-height: 1.8;
}

.home-separator {
  margin: 0 8px;
  color: inherit;
}
```

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "renders the RankLand home page"
```

Expected: PASS.

- [x] **Step 3: Run full home spec**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts
```

Expected: 2 tests pass.

### Task 3: Migration Docs And Full Gate

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-26-home-non-card-text-color-parity.md`

- [x] **Step 1: Update docs with pending verification**

Record the current slice as `home non-card text color parity`, with the full gate pending until commands complete.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, router generation succeeds, migration test suite passes, and whitespace check exits 0.

- [x] **Step 3: Mark docs verified**

Update the status docs and this plan to record the passing full gate.

- [x] **Step 4: Commit**

Run:

```bash
git add tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-26-home-non-card-text-color-parity-design.md docs/superpowers/plans/2026-05-26-home-non-card-text-color-parity.md
git commit -m "fix: 还原首页正文深色文字"
```

Expected: commit created on `migration/live-page-foundation`.
