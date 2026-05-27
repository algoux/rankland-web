# Live Scroll Solution Unknown Result Class Parity Plan

> Spec: `docs/superpowers/specs/2026-05-27-live-scroll-solution-unknown-result-class-parity-design.md`

## Goal

Restore old React `ScrollSolution.renderResultLabel()` fallback parity: unknown realtime results render text `--` without any extra result-specific class beyond the base/migrated hook classes.

## Task 1: RED - capture unknown-result class contract

- [x] Change `tests/unit/live-scroll-solution-state.spec.ts` so `getScrollSolutionResultClass('SKIPPED')` expects `''`.
- [x] Keep existing known-class expectations for `FB`, `AC`, rejected results, and `?`.
- [x] Run:

```bash
corepack pnpm exec vitest run tests/unit/live-scroll-solution-state.spec.ts
```

Observed RED: the test failed because current code returned `result-unknown`.

## Task 2: GREEN - remove Vue-only fallback class

- [x] Change `getScrollSolutionResultClass()` in `src/client/modules/live/live-scroll-solution-state.ts` to return `''` for unknown result labels.
- [x] Run the focused unit test again:

```bash
corepack pnpm exec vitest run tests/unit/live-scroll-solution-state.spec.ts
```

Observed GREEN: all 5 live scroll-solution state unit tests passed.

## Task 3: Full verification, docs, commit

- [x] Run the migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

- [x] Update:
  - `docs/migration/status.md`
  - `docs/migration/manual-acceptance-checklist.md`
  - `docs/migration/final-integration-review.md`
- [x] Stage only this slice's files and run `git diff --cached --check`.
- [x] Commit with:

```bash
git commit -m "fix: 还原实时提交未知结果类名"
```
