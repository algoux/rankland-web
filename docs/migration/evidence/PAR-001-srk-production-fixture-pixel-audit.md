# PAR-001 Evidence — SRK production fixture lower-level table pixel audit

## Finding

The migration has strong SRK wrapper evidence, but the final review does not claim exhaustive pixel parity for every production SRK table fixture. This is a remaining confidence gap rather than a confirmed defect.

## Evidence

- `docs/migration/final-integration-review.md` states that the review "does not claim that every possible production SRK fixture has been pixel-reviewed against old React" and that remaining lower-level table pixel parity is product-review-driven.
- `docs/migration/status.md` records the SRK Vue wrapper as verified for many targeted details, then leaves "Remaining lower-level exact table pixel parity" as product/visual-review driven.
- Old source: `/Users/cooper/Projects/RankLand/rankland-fe/src/components/StyledRanklistRenderer.tsx` renders the shared old SRK header, filters, table wrapper, remarks, modals, footer, export/share, and RankTime surfaces.
- New source: `src/client/components/rankland-ranklist.vue` ports that shared behavior and carries stable `data-id` hooks plus legacy class-token parity for many wrapper elements.
- Current full-chain coverage exercises deterministic fixtures in `tests/e2e/full-chain/ranklist.spec.ts` and `tests/e2e/full-chain/live.spec.ts`; it does not constitute a production fixture corpus comparison.

## Reproduction / Audit Path

1. Select a small production-like SRK corpus with dense tables, long names, many problems, remarks, banners, markers, official/unofficial users, null/frozen statuses, and rank-time data.
2. Render the same corpus through old `rankland-fe` and new `rankland-web`.
3. Capture desktop and mobile screenshots plus DOM/class snapshots for the table, status cells, user modal, solution modal, and rank-time modal.
4. Split any concrete difference into a child `ready` backlog item.

## Current Classification

`discovered`: important shared surface, concrete audit path, but no specific visual mismatch has been reproduced in this Scout pass.
