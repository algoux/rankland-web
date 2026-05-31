# PAR-006 Evidence — Final manual old/new route visual review

## Finding

The docs and tests show broad route parity, but the manual acceptance path still keeps route-level product polish as the next step if a new concrete visual difference is found.

## Evidence

- `docs/migration/manual-acceptance-checklist.md` records the overall conclusion as accepted with follow-up items, not a fully closed release decision.
- The same checklist says the highest-priority follow-up is route-level product polish if a new concrete visual difference is found.
- `docs/migration/status.md` lists the next recommended focus as route-level product polish.
- `docs/migration/final-integration-review.md` records verified evidence for App shell, Home, Search, Ranklist, Collection, Playground, Live, SRK, routing, SSR/head, analytics, and full-chain coverage.
- Existing full-chain screenshots and bounds checks are broad but not a signed final manual old/new visual approval.

## Reproduction / Audit Path

1. Run old `rankland-fe` and new `rankland-web` against equivalent mock or known-safe data.
2. Compare `/`, `/search`, `/ranklist/:id`, `/collection/:id`, `/playground`, and `/live/:id` at desktop `1440x900` and mobile `390x844`.
3. Mark surfaces with no concrete difference as `no high-confidence TODO found`.
4. For any mismatch, record exact old/new route, selector, expected behavior, actual behavior, screenshot path, and suggested regression test.

## Current Classification

`discovered`: this is the final confidence pass that decides whether any route-polish Builder work remains.
