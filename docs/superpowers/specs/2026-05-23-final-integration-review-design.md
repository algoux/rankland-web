# Final Integration Review Design

## Context

The migration completion audit verified that all public RankLand routes have Vue implementations, documented SSR/CSR intent, generated route coverage, and broad full-chain gates. Remaining differences are documented as product polish decisions rather than hidden migration blockers.

This slice records the final integration review needed before treating `rankland-web` as the migrated RankLand frontend.

## Goal

Prove, from current repository evidence, that the migration satisfies the documented route compatibility, runtime, API, testing, and documentation requirements, while keeping any unresolved React parity items explicitly deferred as product decisions.

## Scope

- Build a requirement-by-requirement evidence table for the final migration objective.
- Re-check public route inventory, route builders, generated route metadata, and SSR/CSR behavior.
- Re-check RanklandApiService API contract coverage and migration docs consistency.
- Re-run final verification gates on Node 24 and pnpm 8.
- Update `docs/migration/status.md` with final integration review status and current evidence.

## Non-Goals

- Implementing deferred product polish items in this slice.
- Pixel-perfect React/Ant Design parity.
- Production deployment, remote push, branch merge, or deletion of the old React implementation.

## Acceptance Criteria

- The final review document maps each explicit final requirement to current evidence or a documented deferred product decision.
- `corepack pnpm run gen:client-router` exits cleanly and generated route outputs do not drift unexpectedly.
- `corepack pnpm test:migration` passes after the review updates.
- `docs/migration/status.md` points to the final integration review and preserves the deferred product decision list.
- The branch has a local Chinese Conventional Commit for this slice.
