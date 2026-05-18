# SRK Asset URL Rewrite Parity Design

## Goal

Port the old React SRK asset URL rewrite behavior into the Vue shared `RanklandRanklist` wrapper so relative SRK asset references resolve against the configured SRK storage base and ranklist/live asset scope.

## Source Behavior

The old React app uses `formatSrkAssetUrl(url, assetIdScope)`:

- protocol-relative URLs are returned unchanged;
- `http`, `https`, and `data` URLs are returned unchanged;
- unsupported protocols return an empty string and warn;
- relative URLs require an asset scope and resolve as `${SRK_STORAGE_BASE}/${scope}/${path}`;
- paths starting with `/` do not produce a double slash.

`StyledRanklistRenderer` passes this formatter into the SRK table renderer and uses `SrkAssetImage` for contest banners and user photos.

## Scope

This slice includes:

- add a Vue/client-safe `src/client/utils/srk-asset.util.ts` helper;
- expose SRK storage env to bundled client/SSR code through Vite;
- wire `formatSrkAssetUrl` into `Ranklist`;
- render contest banner and user modal photo through the same helper;
- cover helper behavior, env injection, and full-chain live/ranklist visible asset URL rewrite.

## Non-Goals

This slice does not introduce upload/storage APIs, proxy asset bytes through the app server, change converter-backed exports, or implement a broader app shell.

## Data Flow

The helper reads `process.env.RANKLAND_SRK_STORAGE_BASE || process.env.SRK_STORAGE_BASE` unless a test supplies an explicit storage base. The wrapper receives `id` as the asset scope and rewrites relative asset paths only when that scope and storage base are both available.

## Test Strategy

Unit tests:

- old `formatSrkAssetUrl` protocol behavior;
- relative path joining with explicit base and scope;
- missing scope/base warnings;
- Vite exposes `RANKLAND_SRK_STORAGE_BASE` and legacy `SRK_STORAGE_BASE`.

Full-chain E2E:

- `/ranklist/test-key` renders a contest banner with the storage URL;
- `/live/live-test-key` opens `Team Alpha` and renders the photo with the storage URL.

## Acceptance Criteria

- Relative SRK banner/photo URLs resolve to the configured storage base and ranklist/live asset scope.
- Absolute and data URLs remain unchanged.
- Unsupported protocols and missing required config fail closed with `''`.
- Focused tests, full-chain route tests, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
