# Live Scroll Toggle Text Style Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React text size and color for the live scroll-solution toggle.

**Architecture:** This is a CSS-only page polish slice backed by a full-chain Playwright regression. The Vue wrapper keeps the existing DOM, Ant Design Vue Switch, 4px gap, query behavior, WebSocket lifecycle, and mobile hiding rule; the stale slate color is removed and the old Ant Design 14px text baseline is restored locally for this control.

**Tech Stack:** Vue 3 SFC, scoped Less, Ant Design Vue, Playwright full-chain E2E, RankLand migration docs.

---

## File Ownership

- Modify: `tests/e2e/full-chain/live.spec.ts`
- Modify: `src/client/modules/live/live.view.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

No parallel workers are needed because the source, test, and docs are tightly coupled for one narrow route-polish slice.

## Tasks

### Task 1: Add Failing Full-Chain Assertions

- [x] Add these assertions in `tests/e2e/full-chain/live.spec.ts` next to the existing `.live-scroll-toggle` `column-gap` assertion:

```ts
await expect(page.locator('.live-scroll-toggle')).toHaveCSS('font-size', '14px');
await expect(page.locator('.live-scroll-toggle')).toHaveCSS('color', 'rgba(0, 0, 0, 0.85)');
```

- [x] Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts --grep "hydrates the CSR live page"
```

Expected RED: the test fails because `.live-scroll-toggle` computes `font-size: 13px`.

### Task 2: Restore Old Text Style

- [x] In `src/client/modules/live/live.view.vue`, replace the stale custom text style in `.live-scroll-toggle`:

```css
color: #334155;
font-size: 13px;
```

- [x] Keep no page-specific color declaration, and keep this old Ant Design text-size baseline:

```css
font-size: 14px;
```

- [x] Re-run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts --grep "hydrates the CSR live page"
```

Expected GREEN: the focused live full-chain test passes.

### Task 3: Update Migration Docs

- [x] Update `docs/migration/status.md`:
  - Current slice: `live scroll toggle text style parity`
  - Latest slice commit: `fix: 还原直播页滚动开关文字样式`
  - Live route status and coverage mention old 14px / light `rgba(0, 0, 0, 0.85)` toggle text style.
  - Last recorded full gate describes the new slice once verification passes.

- [x] Update `docs/migration/manual-acceptance-checklist.md` latest record and Live checklist note to include scroll toggle old text style.

- [x] Update `docs/migration/final-integration-review.md` final gate evidence and Live/SRK review notes to include scroll toggle old text style.

### Task 4: Run Full Gate And Commit

- [x] Run the completed-slice gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, router generation succeeds, migration test suite passes, and whitespace check passes.

- [x] Inspect final state:

```bash
git status --short --branch
git diff -- tests/e2e/full-chain/live.spec.ts src/client/modules/live/live.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-live-scroll-toggle-text-style-parity-design.md docs/superpowers/plans/2026-05-27-live-scroll-toggle-text-style-parity.md
```

- [ ] Commit:

```bash
git add tests/e2e/full-chain/live.spec.ts src/client/modules/live/live.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-live-scroll-toggle-text-style-parity-design.md docs/superpowers/plans/2026-05-27-live-scroll-toggle-text-style-parity.md
git commit -m "fix: 还原直播页滚动开关文字样式"
```
