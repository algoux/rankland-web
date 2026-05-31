# Scout Review Report — SRV-2026-05-31-01

Date: 2026-05-31
Branch: `migration/live-page-foundation`
Scope: Scout/Review only for `PAR-001` and `PAR-003`; no product or test implementation files changed.

## Methods Used

- Read `docs/migration/scout-goal.md`, `docs/migration/parity-backlog.md`, migration status/playbook/inventory/API docs, and existing evidence notes.
- Compared old React SRK/Playground source with the migrated Vue targets:
  - `/Users/cooper/Projects/RankLand/rankland-fe/src/components/StyledRanklistRenderer.tsx`
  - `/Users/cooper/Projects/RankLand/rankland-fe/src/components/StyledRanklistRenderer.less`
  - `/Users/cooper/Projects/RankLand/rankland-fe/src/components/SrkPlayground.tsx`
  - `src/client/components/rankland-ranklist.vue`
  - `src/client/modules/playground/playground.view.vue`
  - `src/client/modules/playground/playground-preview-sync.ts`
- Audited current fixture breadth in `tests/fixtures/ranklist.srk.json`, old `rankland-fe` test fixtures, and the old Playground demo SRK file.
- Reviewed existing full-chain coverage in `tests/e2e/full-chain/ranklist.spec.ts`, `tests/e2e/full-chain/live.spec.ts`, and `tests/e2e/full-chain/playground.spec.ts`.
- Ran temporary Playwright probes against the existing full-chain app to inspect current Monaco real-edit behavior without changing product or test files.

## PAR-001 Finding

Final status: `blocked`.

No high-confidence concrete lower-level SRK renderer difference was found from the existing repo fixtures and source comparison. The old app uses `@algoux/standard-ranklist-renderer-component-react@^0.5.1`; the new app uses `@algoux/standard-ranklist-renderer-component-vue@0.5.1` plus the same `@algoux/standard-ranklist-renderer-component-styles@0.5.1`, `@algoux/standard-ranklist@^0.3.12`, and `@algoux/standard-ranklist-utils@^0.2.13` baselines.

The blocker is fixture coverage, not a known visual mismatch. The current full-chain SRK fixture has 2 rows, 2 problems, 1 series, 2 markers, banner, remarks, contributors, and ref links. The old Playground demo has 3 rows and 2 problems. These are useful smoke fixtures but do not cover dense tables, many problem columns, long production names, frozen/penalty/status edge cases, or a production-like modal corpus. Marking `PAR-001` as `done` would overstate the audit.

No child `ready` ticket was created because no exact old/new mismatch, selector, screenshot, or focused acceptance path was discovered.

## PAR-003 Finding

Final status: `blocked`.

Old React Playground updates preview from Monaco `onChange` through a 250 ms throttle and renders valid/invalid state directly from `code`. The migrated Vue Playground wires Monaco `@change`, `Ctrl/Cmd + S`, and the E2E hook through `syncPlaygroundPreviewSource()`. Existing coverage proves the parser/sync helper and uses `window.__ranklandPreviewPlaygroundSource` for stable full-chain valid/invalid state transitions.

Temporary full-chain probes found:

- Real click + keyboard replacement with `{` can make `[data-id="playground-invalid-json"]` visible.
- Replacing the invalid editor contents with a full valid SRK source by select-all plus `keyboard.type()` or `keyboard.insertText()` did not produce a stable return to `[data-id="playground-preview"]` in the probe.
- A `Ctrl/Cmd + S` probe after full-source replacement did not complete cleanly and was killed; this is consistent with the previously documented Monaco/full-chain harness instability.

This is not enough to create a product bug ticket: the probe path itself is not stable enough to prove a migrated product behavior failure, and the shared sync path remains covered by unit/source guards and the E2E hook. It is also not enough to create a `ready` test ticket because a stable user-like valid edit path was not proven.

## Status Changes

- `PAR-001`: `discovered` -> `blocked`
- `PAR-003`: `discovered` -> `blocked`
- Backlog counts updated to `ready 0`, `discovered 0`, `done 4`, `blocked 4`, `wontfix 1`
- Removed stale recommendation to start already-completed `PAR-006` Builder work.

## New Child Tickets

None.

## Recommended Next Action

Cooper/Echo decision, not Builder.

- For `PAR-001`, either provide/approve a small production SRK corpus for another Scout pass, or accept that existing fixture coverage is sufficient and mark the audit `done`.
- For `PAR-003`, either accept the current hook/unit coverage as `wontfix`, or authorize a dedicated harness spike to design a stable Monaco real-edit path.
