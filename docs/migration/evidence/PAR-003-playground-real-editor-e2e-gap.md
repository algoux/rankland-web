# PAR-003 Evidence — Playground real Monaco editing E2E gap

## Finding

The product code now syncs valid source changes through Monaco `@change`, but full-chain E2E still uses a private hook instead of synthetic real editor editing because the current harness hangs on `editor.setValue()`.

## Evidence

- `tests/e2e/full-chain/playground.spec.ts` comments that Monaco synthetic editing is not stable in the Vite 2 full-chain harness.
- The same test file drives preview state through `window.__ranklandPreviewPlaygroundSource`, not by typing or setting text through Monaco's visible editor.
- `src/client/modules/playground/playground.view.vue` wires Monaco `@change`, `Ctrl/Cmd + S`, and the E2E hook through the shared `syncPlaygroundPreviewSource()` path.
- `src/client/modules/playground/playground-preview-sync.ts` provides the shared parse/sync transition.
- `docs/migration/final-integration-review.md` records synthetic Monaco editing as a harness limitation while noting product live preview sync is restored through Monaco `@change`.

## Reproduction / Audit Path

1. Open `/playground` in the full-chain harness and wait for `[data-id="playground-editor"] .monaco-editor`.
2. Attempt a stable real edit path for both invalid JSON and valid SRK JSON.
3. Verify `[data-id="playground-invalid-json"]` and `[data-id="playground-preview"]` update without calling `window.__ranklandPreviewPlaygroundSource`.
4. Keep the unit test for `syncPlaygroundPreviewSource()` as a fast guard.

## Current Classification

`discovered`: this is a missing regression-test confidence path, not a currently reproduced product-code parity failure.
