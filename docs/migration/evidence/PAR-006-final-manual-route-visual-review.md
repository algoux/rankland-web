# PAR-006 Evidence — Final manual old/new route visual review

## Finding

The final Builder-assisted old/new visual review is complete. It found three concrete route-level visual differences:

- `PAR-006A`: shared app header logo asset mismatch, implemented in this Builder window.
- `PAR-006B`: Ant Design primary controls still render Vue default blue instead of old RankLand orange.
- `PAR-006C`: Collection category menu logos render oversized and overlap menu text.

No additional high-confidence route TODO was promoted from Home, Search, Ranklist, Playground, or Live beyond those shared/Collection issues. Playground mobile fixed-width overflow remains covered by the existing `PAR-004` `wontfix` decision.

## Evidence

- `docs/migration/manual-acceptance-checklist.md` records the overall conclusion as accepted with follow-up items, not a fully closed release decision.
- The same checklist says the highest-priority follow-up is route-level product polish if a new concrete visual difference is found.
- `docs/migration/status.md` lists the next recommended focus as route-level product polish.
- `docs/migration/final-integration-review.md` records verified evidence for App shell, Home, Search, Ranklist, Collection, Playground, Live, SRK, routing, SSR/head, analytics, and full-chain coverage.
- Existing full-chain screenshots and bounds checks are broad but not a signed final manual old/new visual approval.
- Builder review generated old/new screenshots under `test-results/par-006-visual-review/`:
  - `/`: `home-desktop-old.png`, `home-desktop-new.png`, `home-mobile-old.png`, `home-mobile-new.png`
  - `/search`: `search-desktop-old.png`, `search-desktop-new.png`, `search-mobile-old.png`, `search-mobile-new.png`
  - `/ranklist/test-key?focus=yes`: `ranklist-desktop-old.png`, `ranklist-desktop-new.png`, `ranklist-mobile-old.png`, `ranklist-mobile-new.png`
  - `/collection/official?rankId=test-key`: `collection-desktop-old.png`, `collection-desktop-new.png`, `collection-mobile-old.png`, `collection-mobile-new.png`
  - `/playground`: `playground-desktop-old.png`, `playground-desktop-new.png`, `playground-mobile-old.png`, `playground-mobile-new.png`
  - `/live/live-test-key?token=t0`: `live-desktop-old.png`, `live-desktop-new.png`, `live-mobile-old.png`, `live-mobile-new.png`
  - route contact sheets: `contact-sheets/*.png`

## Reproduction / Audit Path

1. Old reference: built `/Users/cooper/Projects/RankLand/rankland-fe` with Node `v20.19.5` and served the static Umi build at `http://127.0.0.1:4321`.
2. New target: served `rankland-web` full-chain dev target with Node `v24.11.1`, mock API at `http://127.0.0.1:3101`, and app at `http://127.0.0.1:3100`.
3. Compared `/`, `/search`, `/ranklist/test-key?focus=yes`, `/collection/official?rankId=test-key`, `/playground`, and `/live/live-test-key?token=t0` at desktop `1440x900` and mobile `390x844`.
4. Suppressed external analytics, used deterministic fixtures, and stubbed WebSocket browser behavior.
5. Split concrete mismatches into child PAR items.

## Current Classification

`done`: final visual review completed, with child items recorded as `PAR-006A`, `PAR-006B`, and `PAR-006C`.
