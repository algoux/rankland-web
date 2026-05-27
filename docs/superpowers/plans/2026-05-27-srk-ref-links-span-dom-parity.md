# SRK ref-links span DOM parity plan

## Slice

Restore old React `span` DOM parity for SRK header contest reference links.

## File ownership

- `src/client/components/rankland-ranklist.vue`
- `tests/e2e/full-chain/ranklist.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-srk-ref-links-span-dom-parity-design.md`
- `docs/superpowers/plans/2026-05-27-srk-ref-links-span-dom-parity.md`

## Tasks

- [x] Add a full-chain assertion that the SRK reference-link wrapper is a `SPAN`.
- [x] Run the focused ranklist full-chain test and confirm RED.
- [x] Change the Vue wrapper from `p` to `span` while preserving stable selectors/classes.
- [x] Run the focused ranklist full-chain test and confirm GREEN.
- [x] Update migration status and acceptance docs with the verified ref-link DOM parity.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
