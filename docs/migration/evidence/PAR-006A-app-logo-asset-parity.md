# PAR-006A Evidence — App shell logo asset parity

## Finding

The old React app renders the legacy `RL` RankLand logo in the shared header, while the migrated Vue app rendered a newer orange logo mark. The header box metrics were already covered, but the asset itself was not.

## Evidence

- Old route screenshots: `test-results/par-006-visual-review/home-desktop-old.png`, `test-results/par-006-visual-review/search-mobile-old.png`
- New pre-fix screenshots: `test-results/par-006-visual-review/home-desktop-new.png`, `test-results/par-006-visual-review/search-mobile-new.png`
- Old source asset: `/Users/cooper/Projects/RankLand/rankland-fe/src/assets/logo.png`
  - SHA-256: `8e9c8237ad0b34e1277a444738fcf7c8bc30510c47559e16bd45eec9f36f9edb`
  - PNG size: `128x128`
- New pre-fix target: `src/client/assets/logo.png`
  - SHA-256: `052ab149151fc26604ac74befc02471e3011705a9f910089b84d9aba29f2f0df`
  - PNG size: `480x480`

## Regression Test

- `tests/unit/app-logo-asset.spec.ts` asserts the migrated app logo asset matches the old React asset hash and PNG dimensions.

## Current Classification

`done`: fixed by replacing `src/client/assets/logo.png` with the old React `RL` asset and adding the asset baseline unit test.
