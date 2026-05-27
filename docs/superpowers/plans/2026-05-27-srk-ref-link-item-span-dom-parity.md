# SRK ref-link item span DOM parity plan

## Slice

Restore old React item-level `span` DOM parity for visible SRK header contest reference links.

## File ownership

- `src/client/components/rankland-ranklist.vue`
- `tests/e2e/full-chain/ranklist.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-srk-ref-link-item-span-dom-parity-design.md`
- `docs/superpowers/plans/2026-05-27-srk-ref-link-item-span-dom-parity.md`

## Tasks

- [x] Add a full-chain assertion that visible SRK reference links are item-level `SPAN` wrappers.
- [x] Run the focused ranklist full-chain test and confirm RED.
- [x] Change the Vue main ref-link rendering to wrap each item in `span`.
- [x] Run the focused ranklist full-chain test and confirm GREEN.
- [x] Update migration status and acceptance docs with verified item-level ref-link DOM parity.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
