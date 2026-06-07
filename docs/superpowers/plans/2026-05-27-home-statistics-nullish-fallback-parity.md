# Home Statistics Nullish Fallback Parity Implementation Plan

**Goal:** Restore old React `-` fallback for partial home statistics responses.

**Files:**

- `tests/e2e/support/start-full-chain-e2e.js`
- `tests/e2e/full-chain/home.spec.ts`
- `src/client/modules/home/home.view.vue`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-home-statistics-nullish-fallback-parity-design.md`
- `docs/superpowers/plans/2026-05-27-home-statistics-nullish-fallback-parity.md`

## Tasks

- [x] Compare old React and current Vue home statistics rendering.
- [x] Create this spec and plan.
- [x] Add full-chain mock support for partial statistics:

```text
POST /__use-partial-statistics
GET /statistics -> { totalViewCount: null }
```

- [x] Add a home full-chain test that expects both SSR HTML and hydrated DOM to render `-`.
- [x] Run focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "renders legacy statistics fallback"
```

Expected: FAIL before implementation because the migrated Vue page renders `undefined`/`null`.

- [x] Implement nullish field fallback in `home.view.vue`.
- [x] Run focused GREEN:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "renders legacy statistics fallback"
```

Expected: PASS.

- [x] Run full home full-chain:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts
```

Expected: PASS.

- [x] Update migration docs with the verified slice and latest gate evidence.
- [x] Run full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS.

- [x] Stage and verify:

```bash
git add tests/e2e/support/start-full-chain-e2e.js tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-home-statistics-nullish-fallback-parity-design.md docs/superpowers/plans/2026-05-27-home-statistics-nullish-fallback-parity.md
git diff --cached --check
```

- [x] Commit:

```bash
git commit -m "fix: 还原首页统计空值兜底"
```
