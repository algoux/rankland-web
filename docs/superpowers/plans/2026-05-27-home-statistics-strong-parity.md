# Home Statistics Strong Parity Implementation Plan

**Goal:** Restore old React `<strong>` markup and bold visual treatment for the home total SRK count.

**Files:**

- `tests/e2e/full-chain/home.spec.ts`
- `src/client/modules/home/home.view.vue`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-home-statistics-strong-parity-design.md`
- `docs/superpowers/plans/2026-05-27-home-statistics-strong-parity.md`

## Tasks

- [x] Compare old React and current Vue home statistics markup.
- [x] Create this spec and plan.
- [x] Add a full-chain presentation helper and assertions for `STRONG`, `font-style: normal`, and bold font weight.
- [x] Update the partial statistics SSR assertion to expect `<strong>`.
- [x] Run focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "renders the RankLand home page"
```

Expected: FAIL before implementation because the migrated Vue page uses `EM` with italic styling.

- [x] Implement `<strong data-id="home-total-srk-count">`.
- [x] Run focused GREEN:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "renders the RankLand home page"
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
git add tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-home-statistics-strong-parity-design.md docs/superpowers/plans/2026-05-27-home-statistics-strong-parity.md
git diff --cached --check
```

- [x] Commit:

```bash
git commit -m "fix: 还原首页统计数字加粗"
```
