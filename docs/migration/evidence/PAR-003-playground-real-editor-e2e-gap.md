# PAR-003 Evidence — Playground real Monaco editing E2E gap

## Finding

The product code routes Monaco changes, `Ctrl/Cmd + S`, and the E2E hook through the same preview-sync helper. Full-chain E2E still uses a private hook instead of a stable real Monaco edit path, and Scout batch `SRV-2026-05-31-01` only proved a partial real keyboard path for invalid JSON. This is accepted as a harness limitation for migration closure rather than a product parity blocker.

## Evidence

- `tests/e2e/full-chain/playground.spec.ts` comments that Monaco synthetic editing is not stable in the Vite 2 full-chain harness.
- The same test file drives preview state through `window.__ranklandPreviewPlaygroundSource`, not by typing or setting text through Monaco's visible editor.
- `src/client/modules/playground/playground.view.vue` wires Monaco `@change`, `Ctrl/Cmd + S`, and the E2E hook through the shared `syncPlaygroundPreviewSource()` path.
- `src/client/modules/playground/playground-preview-sync.ts` provides the shared parse/sync transition.
- `docs/migration/final-integration-review.md` records synthetic Monaco editing as a harness limitation while noting product live preview sync is restored through Monaco `@change`.
- Temporary full-chain probe, without file changes:
  - real click + keyboard replacement with `{` made `[data-id="playground-invalid-json"]` visible;
  - full valid SRK replacement through select-all plus `keyboard.type()` or `keyboard.insertText()` updated the Monaco model but did not stably return to `[data-id="playground-preview"]`;
  - a `Ctrl/Cmd + S` probe after full-source replacement did not complete cleanly and was killed.

## Reproduction / Audit Path

1. Open `/playground` in the full-chain harness and wait for `[data-id="playground-editor"] .monaco-editor`.
2. Attempt a stable real edit path for both invalid JSON and valid SRK JSON.
3. Verify `[data-id="playground-invalid-json"]` and `[data-id="playground-preview"]` update without calling `window.__ranklandPreviewPlaygroundSource`.
4. Keep the unit test for `syncPlaygroundPreviewSource()` as a fast guard.

## Current Classification

`wontfix`: existing hook/unit coverage plus the documented manual invalid-edit probe is accepted for migration closure. A stable real Monaco edit E2E can be reopened later as a focused harness-quality spike if it becomes worth the cost.
