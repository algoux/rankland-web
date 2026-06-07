# Legacy Link Color Parity Implementation Plan

**Goal:** Restore old React/Ant Design themed link colors for the Vue RankLand surface.

**Files:**
- `tests/e2e/full-chain/ranklist.spec.ts`
- `src/client/index.less`
- `src/client/components/contact-us.vue`
- `src/client/components/rankland-ranklist.vue`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`

## Tasks

- [x] Confirm old React generated CSS link colors:
  - light base `#ff8104`, hover `#ff9d2e`, active `#d96500`
  - dark base `#f6ac06`, hover `#a7770b`, active `#e8b52b`
- [x] Add full-chain RED checks for ranklist reference links and footer contact trigger in light and dark modes.
- [x] Verify RED:
  - light received `rgb(35, 104, 191)` instead of `rgb(255, 129, 4)`
  - dark ref link received blue and contact trigger inherited body color instead of `rgb(246, 172, 6)`
- [x] Add RankLand link variables and restore global `a`/hover/active rules.
- [x] Restore `ContactUs` trigger colors through the shared link variables.
- [x] Add SRK wrapper scoped link/contact trigger rules to stabilize against Ant Design Vue runtime style ordering.
- [x] Use `expect.poll` for base color checks because old AntD links transition color for 0.3s.
- [x] Keep the existing `main.ts` CSS import order after debugging showed moving `index.less` after Ant Design reset made Select dropdown option rendering unstable in full-chain tests; scoped SRK wrapper rules provide the needed visible parity without that broader import-order change.
- [x] Make the existing Ant Design Select organization helper target the current non-hidden dropdown, wait for visible options, and use `ArrowDown` fallback; full-suite diagnostics showed the old immediate click could race dropdown materialization or hit stale hidden dropdown DOM even when the isolated product behavior was healthy.
- [x] Verify focused GREEN:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail|passes the RankLand dark theme"
```

Result: 2 passed.

- [x] Verify ranklist file:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Result: 7 passed.

- [x] Run final gates:

```bash
node -v
corepack pnpm -v
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

- [x] Commit:

```bash
git add docs/migration/final-integration-review.md docs/migration/manual-acceptance-checklist.md docs/migration/status.md docs/superpowers/specs/2026-05-26-legacy-link-color-parity-design.md docs/superpowers/plans/2026-05-26-legacy-link-color-parity.md src/client/index.less src/client/components/contact-us.vue src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts
git commit -m "fix: 还原旧版链接主色"
```
