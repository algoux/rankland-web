# Global Body Text Color Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React Ant Design global body text color in light and dark themes.

**Architecture:** The Vue app shell already owns global theme variables in `src/client/index.less`. This slice reuses the existing `--rankland-legacy-text-color` variable and verifies the computed `body` color through the full-chain app-shell theme sync test.

**Tech Stack:** Vue 3, LESS, Ant Design Vue, Playwright full-chain E2E, bwcx/vite-ssr migration harness.

---

## File Structure

- Modify `tests/e2e/full-chain/app-shell.spec.ts`: add computed `body` color assertions to the system theme sync test.
- Modify `src/client/index.less`: point global body text color at the existing legacy theme variable.
- Modify `docs/migration/status.md`: update current slice, app-shell coverage, risks, and gate evidence.
- Modify `docs/migration/manual-acceptance-checklist.md`: add the 2026-05-26 verification record.
- Modify `docs/migration/final-integration-review.md`: record the global body text color parity result.
- Create `docs/superpowers/specs/2026-05-26-global-body-text-color-parity-design.md`: design decisions and acceptance criteria.
- Create `docs/superpowers/plans/2026-05-26-global-body-text-color-parity.md`: executable plan and verification checklist.

## Task 1: Add RED App-Shell Coverage

**Files:**
- Modify: `tests/e2e/full-chain/app-shell.spec.ts`

- [x] **Step 1: Add the failing assertions**

In `syncs system theme and macOS Blink optimization after hydration`, assert the dark and light computed body text colors:

```ts
await expect(page.locator('body')).toHaveCSS('color', 'rgba(255, 255, 255, 0.85)');

await page.evaluate(() => {
  (window as unknown as { __ranklandSetDarkMode: (matches: boolean) => void }).__ranklandSetDarkMode(false);
});

await expect(page.locator('html')).toHaveClass('light');
await expect(page.locator('body')).toHaveCSS('color', 'rgba(0, 0, 0, 0.85)');
await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(242, 242, 242)');
```

- [x] **Step 2: Run RED verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts --grep "syncs system theme"
```

Result: FAIL confirmed because current body color was `rgb(230, 237, 245)` in dark mode while old Ant Design expects `rgba(255, 255, 255, 0.85)`.

## Task 2: Implement Minimal CSS Fix

**Files:**
- Modify: `src/client/index.less`

- [x] **Step 1: Reuse the existing legacy theme variable**

Change the initial body color and both theme body color overrides:

```less
body {
  margin: 0;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: rgba(0, 0, 0, 0.85);
  background: #f2f2f2;
}

html.light body {
  --rankland-legacy-text-color: rgba(0, 0, 0, 0.85);
  color: var(--rankland-legacy-text-color);
  background: #f2f2f2;
}

html.dark body {
  --rankland-legacy-text-color: rgba(255, 255, 255, 0.85);
  color: var(--rankland-legacy-text-color);
  background: #14171c;
}
```

- [x] **Step 2: Run focused GREEN verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts --grep "syncs system theme"
```

Result: PASS, 1/1 full-chain test.

- [x] **Step 3: Run app-shell full-chain verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts
```

Result: PASS, 8/8 app-shell full-chain tests.

## Task 3: Update Migration Docs And Gates

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-26-global-body-text-color-parity.md`

- [x] **Step 1: Record pending doc state**

Update migration docs to mention global body text color parity and mark final gate as pending until the full command completes.

- [x] **Step 2: Run final migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Result: Node `v24.11.1`, pnpm `8.15.9`, route generation PASS with 8 client routes, migration suite PASS with build, 35 unit files / 151 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 52 full-chain Playwright tests, and whitespace check PASS.

- [x] **Step 3: Record verified doc state**

Replace pending gate wording with the verified gate evidence, including unit, SSR, shallow, and full-chain counts from `test:migration`.

- [x] **Step 4: Commit**

Run:

```bash
git add tests/e2e/full-chain/app-shell.spec.ts src/client/index.less docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-26-global-body-text-color-parity-design.md docs/superpowers/plans/2026-05-26-global-body-text-color-parity.md
git commit -m "fix: 还原全局正文文字颜色"
```

Expected: one coherent commit for this slice.
