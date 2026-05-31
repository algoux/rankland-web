# PAR-002 Evidence — Playground Monaco exact package-version parity decision

## Finding

The old React app and migrated Vue app use different Monaco package baselines. The current migration explicitly accepts the newer Vue-compatible wrapper path, so this is blocked on product/dependency judgment rather than a direct Builder task.

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

`blocked`: the difference is concrete, but current docs already accept it. A Builder should not change dependencies without Cooper/Echo approval.
