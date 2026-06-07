# SRK Asset URL Rewrite Parity Implementation Plan

**Goal:** Migrate SRK asset URL rewrite behavior into the Vue shared ranklist wrapper.

**Architecture:** Keep URL logic in `src/client/utils/srk-asset.util.ts`; expose storage env through `vite.config.js`; call the helper from `rankland-ranklist.vue` for renderer assets, contest banner, and user modal photo.

---

## File Map

- Add `src/client/utils/srk-asset.util.ts`.
- Add `tests/unit/srk-asset.util.spec.ts`.
- Modify `vite.config.js` and `tests/unit/vite-config.spec.ts`.
- Modify `src/client/components/rankland-ranklist.vue`.
- Modify `tests/fixtures/ranklist.srk.json`.
- Modify `tests/e2e/full-chain/ranklist.spec.ts` and `tests/e2e/full-chain/live.spec.ts`.
- Modify `tests/e2e/support/start-full-chain-e2e.js`.
- Update `docs/migration/status.md`.

## Task 1: RED Tests

- [x] Add unit tests for SRK asset URL formatting.
- [x] Extend Vite config tests for SRK storage env injection.
- [x] Add fixture banner/photo relative paths and full-chain assertions.
- [x] Run focused unit tests and confirm they fail before implementation.

## Task 2: Helper And Env

- [x] Implement `src/client/utils/srk-asset.util.ts`.
- [x] Expose `RANKLAND_SRK_STORAGE_BASE` and `SRK_STORAGE_BASE` through Vite.
- [x] Set deterministic `RANKLAND_SRK_STORAGE_BASE` in full-chain launcher.
- [x] Re-run focused unit tests.

## Task 3: Vue Wrapper Integration

- [x] Render contest banner through the helper.
- [x] Pass `formatSrkAssetUrl` into the Vue `Ranklist`.
- [x] Rewrite user modal photo src with the helper.
- [x] Re-run focused full-chain ranklist and live specs.
- [x] Run `corepack pnpm run build`.

## Task 4: Verification And Commit

- [x] Run `corepack pnpm test:migration`.
- [x] Run `git diff --check`.
- [x] Update `docs/migration/status.md`.
- [x] Review diff and commit with `feat: 补齐 SRK 资源地址改写`.
