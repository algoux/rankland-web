# Migration Completion Audit Design

## Context

All public RankLand routes now have Vue route foundations, app-shell integration where applicable, and full-chain coverage. The dashboard still lists several open parity risks that are product-polish decisions rather than blockers for route compatibility.

This slice audits the migration state before treating the branch as ready for a broader handoff.

## Goal

Confirm that the migrated Vue application preserves the documented public route, SSR/CSR, API, and full-chain behavior contracts, and record any remaining React parity gaps as explicit deferred product decisions.

## Scope

- Reconcile `docs/migration/status.md` with the current route inventory, API contract, generated route metadata, and verified full-chain coverage.
- Regenerate client route outputs and confirm no unexpected generated-route drift.
- Run broad migration gates with Node 24 and pnpm 8.
- Update the migration dashboard with the audit result, gate evidence, and deferred decisions.

## Non-Goals

- Implementing exact Ant Design visual parity.
- Implementing GA/pageview dispatch parity.
- Implementing Monaco editor parity.
- Implementing automatic live WebSocket reconnect/backoff.
- Replacing the lightweight Vue rank-time curve with the old React G2 chart.
- Changing generated route files by hand.

## Audit Criteria

- Public route inventory still matches `/`, `/search`, `/ranklist/:id`, `/collection/:id`, `/live/:id`, and `/playground`.
- SSR/CSR route intent matches `ranklandRoutes` and generated client route metadata.
- API service behavior remains covered by unit tests and aligned with `docs/migration/api-contract.md`.
- Full-chain coverage exists for each public route.
- Deferred parity is documented as a deliberate product decision, not an unknown migration blocker.

## Acceptance Criteria

- `docs/migration/status.md` records this audit as the current verified slice.
- Route generation is run and either produces no diff or any diff is explained and committed.
- Broad gates pass or any failing gate has a recorded root cause and follow-up.
- The final handoff can clearly distinguish migrated route compatibility from deferred product polish.
