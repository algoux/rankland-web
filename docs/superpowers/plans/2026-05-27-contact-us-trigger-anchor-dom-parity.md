# ContactUs Trigger Anchor DOM Parity Implementation Plan

**Goal:** Restore old React `ContactUs` trigger DOM by keeping caller-provided no-`href` anchors on Home and SRK footer contact surfaces.

**Architecture:** Keep the shared Vue modal implementation. Move click handling from the trigger button to the root wrapper span, render the default slot directly, and update Home/SRK callers to pass anchors that retain existing `data-id` and `.contact-us-trigger` hooks.

## File ownership

- `src/client/components/contact-us.vue`
- `src/client/components/rankland-ranklist.vue`
- `src/client/modules/home/home.view.vue`
- `tests/e2e/full-chain/home.spec.ts`
- `tests/e2e/full-chain/ranklist.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-contact-us-trigger-anchor-dom-parity-design.md`
- `docs/superpowers/plans/2026-05-27-contact-us-trigger-anchor-dom-parity.md`

## Tasks

- [x] Create design spec and implementation plan.
- [x] Add Home and ranklist full-chain assertions for no-`href` anchor contact triggers.
- [x] Run focused full-chain tests and confirm RED.
- [x] Restore shared ContactUs trigger wrapper/slot DOM and caller anchors.
- [x] Run focused full-chain tests and confirm GREEN.
- [x] Update migration status, manual checklist, and final review docs.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the RankLand home page|renders the ranklist detail page"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
