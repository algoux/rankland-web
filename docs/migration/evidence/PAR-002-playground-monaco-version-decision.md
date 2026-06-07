# PAR-002 Evidence — Playground Monaco exact package-version parity decision

## Finding

The old React app and migrated Vue app use different Monaco package baselines. The migration explicitly accepts the newer Vue-compatible wrapper path; exact old Monaco `0.34.x` package-version parity is not required for migration closure.

## Evidence

- Old package evidence: `/Users/cooper/Projects/RankLand/rankland-fe/package.json` declares `monaco-editor` `^0.34.0` and `react-monaco-editor` `^0.50.1`.
- New package evidence: `package.json` declares `@guolao/vue-monaco-editor` `1.6.0` and `monaco-editor` `0.43.0`.
- Lockfile evidence: `pnpm-lock.yaml` resolves `@guolao/vue-monaco-editor@1.6.0(monaco-editor@0.43.0)` and records the wrapper peer requirement `monaco-editor: >=0.43.0`.
- `docs/migration/final-integration-review.md` says exact old Monaco `0.34.0` package-version parity is intentionally not preserved because the verified Vue wrapper requires Monaco `>=0.43.0`.
- `docs/migration/manual-acceptance-checklist.md` marks Monaco editor parity accepted, while noting old `0.34.0` package parity is not exact.

## Reproduction / Audit Path

1. Confirm old and new package versions with `rg -n 'monaco-editor|react-monaco-editor|@guolao/vue-monaco-editor'`.
2. Run current Playground unit/full-chain coverage to confirm the product editor still loads, uses schema diagnostics, syncs theme, and preserves default minimap chrome.
3. If exact package parity is required, create a spike branch and prove Monaco `0.34.x` can mount in Vue without losing current coverage.

## Current Classification

`wontfix`: exact package-version parity is intentionally not preserved. Current product-compatible Monaco behavior remains the accepted migration contract; any future Monaco downgrade/proof should be a separate dependency spike, not Builder parity work.
