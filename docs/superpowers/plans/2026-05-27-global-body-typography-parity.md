# Global Body Typography Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old Ant Design global body typography in the Vue migration.

**Architecture:** This is a global CSS parity slice with one full-chain app-shell regression. The app shell already owns body theme variables in `src/client/index.less`; this slice adds the missing old Ant Design typography declarations while preserving existing RankLand background and light/dark text color behavior.

**Tech Stack:** Vue 3, Less, Ant Design Vue, Playwright full-chain E2E, RankLand migration docs.

---

## File Ownership

- Modify: `tests/e2e/full-chain/app-shell.spec.ts`
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/index.less`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

No parallel workers are needed because this slice touches one global stylesheet and one shared app-shell E2E file.

## Tasks

### Task 1: Add Failing Full-Chain Body Typography Coverage

- [x] Add this helper in `tests/e2e/full-chain/app-shell.spec.ts` near the existing computed-style helpers:

```ts
async function getBodyTypography(page: Page) {
  return page.evaluate(() => {
    const style = window.getComputedStyle(document.body);
    return {
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      fontVariantNumeric: style.fontVariantNumeric,
      lineHeight: style.lineHeight,
    };
  });
}
```

- [x] Add this assertion block in `syncs system theme and macOS Blink optimization after hydration` after the first body color assertion:

```ts
const bodyTypography = await getBodyTypography(page);
expect(bodyTypography.fontSize).toBe('14px');
expect(bodyTypography.fontFamily).toContain('system-ui');
expect(bodyTypography.fontFamily).not.toContain('Avenir');
expect(bodyTypography.fontVariantNumeric).toBe('tabular-nums');
expect(Number.parseFloat(bodyTypography.lineHeight)).toBeGreaterThan(21.9);
expect(Number.parseFloat(bodyTypography.lineHeight)).toBeLessThan(22.1);
```

- [x] Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts --grep "syncs system theme"
```

Expected RED: the test fails because the current body computes `font-size: 16px`.

### Task 2: Restore Old Ant Design Body Typography

- [x] In `src/client/index.less`, replace the current body font family declaration with the old Ant Design body typography baseline:

```css
font-size: 14px;
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
font-variant: tabular-nums;
line-height: 1.5715;
font-feature-settings: 'tnum';
```

- [x] Re-run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts --grep "syncs system theme"
```

Expected GREEN: the focused app-shell full-chain test passes.

### Task 3: Update Migration Docs

- [x] Update the inherited user-modal team separator assertion in `tests/e2e/full-chain/ranklist.spec.ts` from `12.8px` to `11.2px`, matching old React `font-size: 80%` under the restored Ant Design 14px body baseline.

- [x] Update `docs/migration/status.md`:
  - Current slice: `global body typography parity`
  - Latest slice commit: `fix: 还原全局正文排版基线`
  - App shell status and coverage mention old global body typography.
  - Last recorded full gate describes this slice after verification passes.

- [x] Update `docs/migration/manual-acceptance-checklist.md` latest record and global shell checklist note to include old body 14px/system-font/line-height coverage.

- [x] Update `docs/migration/final-integration-review.md` final gate evidence and app shell review notes to include old global body typography.

### Task 4: Run Full Gate And Commit

- [x] Run the completed-slice gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, router generation succeeds, migration test suite passes, and whitespace check passes.

- [x] Inspect final state:

```bash
git status --short --branch
git diff -- tests/e2e/full-chain/app-shell.spec.ts tests/e2e/full-chain/ranklist.spec.ts src/client/index.less docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-global-body-typography-parity-design.md docs/superpowers/plans/2026-05-27-global-body-typography-parity.md
```

- [ ] Commit:

```bash
git add tests/e2e/full-chain/app-shell.spec.ts tests/e2e/full-chain/ranklist.spec.ts src/client/index.less docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-global-body-typography-parity-design.md docs/superpowers/plans/2026-05-27-global-body-typography-parity.md
git commit -m "fix: 还原全局正文排版基线"
```
