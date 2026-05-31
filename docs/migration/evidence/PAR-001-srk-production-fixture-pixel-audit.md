# PAR-001 Evidence — SRK production fixture lower-level table pixel audit

## Finding

The migration has strong SRK wrapper evidence, and Scout batch `SRV-2026-05-31-01` did not find a concrete lower-level SRK rendering mismatch in the existing repo fixtures. The item is now blocked on corpus selection because the available fixtures are too small to close a production pixel audit.

## Evidence

- `docs/migration/final-integration-review.md` states that the review "does not claim that every possible production SRK fixture has been pixel-reviewed against old React" and that remaining lower-level table pixel parity is product-review-driven.
- `docs/migration/status.md` records the SRK Vue wrapper as verified for many targeted details, then leaves "Remaining lower-level exact table pixel parity" as product/visual-review driven.
- Old source: `/Users/cooper/Projects/RankLand/rankland-fe/src/components/StyledRanklistRenderer.tsx` renders the shared old SRK header, filters, table wrapper, remarks, modals, footer, export/share, and RankTime surfaces.
- New source: `src/client/components/rankland-ranklist.vue` ports that shared behavior and carries stable `data-id` hooks plus legacy class-token parity for many wrapper elements.
- Dependency baseline: old React uses `@algoux/standard-ranklist-renderer-component-react@^0.5.1`; new Vue uses `@algoux/standard-ranklist-renderer-component-vue@0.5.1`. Both are on the same renderer core/styles `0.5.1`, SRK schema `^0.3.12`, and SRK utils `^0.2.13` family.
- Current full-chain coverage exercises deterministic fixtures in `tests/e2e/full-chain/ranklist.spec.ts` and `tests/e2e/full-chain/live.spec.ts`; it does not constitute a production fixture corpus comparison.
- Existing fixture breadth checked in this Scout pass:
  - `tests/fixtures/ranklist.srk.json`: 2 rows, 2 problems, 1 series, markers, banner, remarks, contributors, ref links, and one unofficial user.
  - `/Users/cooper/Projects/RankLand/rankland-fe/src/assets/srk-playground-demo.srk.json.txt`: 3 rows, 2 problems, longer university names, no markers/banner/remarks.
  - mock-only null status path exists for `/rank/null-status-key`, but there is no dense production-like corpus for many problems, many rows, frozen/status edge cases, or broad modal inspection.

## Reproduction / Audit Path

1. Cooper/Echo selects or approves a small production-like SRK corpus with dense tables, long names, many problems, remarks, banners, markers, official/unofficial users, null/frozen statuses, and rank-time data.
2. Render the same corpus through old `rankland-fe` and new `rankland-web`.
3. Capture desktop and mobile screenshots plus DOM/class snapshots for the table, status cells, user modal, solution modal, and rank-time modal.
4. Split any concrete difference into a child `ready` backlog item.

## Current Classification

`blocked`: no specific visual mismatch has been reproduced, but the current fixture corpus is insufficient to mark the production pixel audit complete. No Builder work should start until a corpus is approved or a concrete child ticket is discovered.
