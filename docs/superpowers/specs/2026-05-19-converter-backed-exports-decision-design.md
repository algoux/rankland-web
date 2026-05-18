# Converter-Backed Exports Decision Design

## Goal

Decide how to close the remaining `StyledRanklistRenderer` export parity gap for Codeforces Gym Ghost DAT, Virtual Judge Replay XLSX, and general Excel XLSX exports in the shared Vue `RanklandRanklist` wrapper.

## Source Behavior

The old React `rankland-fe/src/components/StyledRanklistRenderer.tsx` imports:

- `CodeforcesGymGhostDATConverter`;
- `VJudgeReplayConverter`;
- `GeneralExcelConverter`;

from `@algoux/standard-ranklist-convert-to`.

The source actions are browser-only header menu actions:

- Gym Ghost creates `new CodeforcesGymGhostDATConverter().convert(memorizedData)`, writes a plain-text Blob, and downloads `<name>_gymghost.dat`.
- VJudge Replay calls `new VJudgeReplayConverter().convertAndWrite(memorizedData, '<name>_vjreplay.xlsx')`.
- General Excel calls `new GeneralExcelConverter().convertAndWrite(memorizedData, '<name>.xlsx')`.

The old wrapper uses the memoized original SRK data, not the time-travel-filtered `genData`.

## Current Target State

`rankland-web/src/client/components/rankland-ranklist.vue` already exposes the shared export menu for `/ranklist/:id` and `/live/:id`.

Implemented actions:

- standard SRK JSON download;
- copy current page link;
- copy iframe embed code.

Remaining menu items are rendered but disabled:

- `rankland-ranklist-export-gym-ghost-action`;
- `rankland-ranklist-export-vjudge-action`;
- `rankland-ranklist-export-xlsx-action`.

## Dependency Assessment

The npm registry currently reports `@algoux/standard-ranklist-convert-to` latest version `0.2.2`, matching the old React dependency. Its dependency surface is:

- runtime dependency: `@algoux/standard-ranklist-utils@^0.2.6`;
- runtime dependency: `xlsx@^0.18.5`;
- peer dependency: `@algoux/standard-ranklist@*`;
- package metadata: `srkSupportedVersions >=0.3.0 <0.4.0`;
- published `0.2.2` tarball unpacked size: about 26 KB.

`rankland-web` already uses:

- `@algoux/standard-ranklist@0.3.11`;
- direct `@algoux/standard-ranklist-utils@0.2.9`;
- transitive `@algoux/standard-ranklist-utils@0.2.13` from the Vue renderer package.

The converter package itself is small and framework-neutral. The meaningful extra cost is `xlsx@0.18.5`, which the old app also pulled in and which has a much larger browser payload. `xlsx` latest on npm is still `0.18.5`, with its latest published version from 2022-03-24.

## Decision

Implement converter-backed export parity in a separate feature slice by adding `@algoux/standard-ranklist-convert-to@0.2.2` as a production dependency and loading it lazily from browser click handlers.

Rationale:

- It gives the closest parity with the old React behavior without embedding React or copying converter algorithms into the Vue app.
- The package is framework-neutral and already built for browser imports through ESM/CJS exports.
- Dynamic import keeps `xlsx` out of the initial ranklist/live route bundle and avoids SSR evaluating export code.
- Using the package keeps future SRK converter fixes aligned with the upstream Algoux package instead of creating a fork in `rankland-web`.

## Implementation Shape

Add a small browser-action layer next to the existing SRK export helpers:

- keep pure filename and text-generation helpers in `src/client/components/rankland-ranklist-actions.ts`;
- add lazy async functions that import `@algoux/standard-ranklist-convert-to` only after a user clicks an export action;
- use `CodeforcesGymGhostDATConverter.convert()` and the existing Blob download pattern for DAT;
- use `VJudgeReplayConverter.convertAndWrite()` and `GeneralExcelConverter.convertAndWrite()` for XLSX, matching the old source behavior;
- set action status messages for success and failure so E2E can observe the outcome.

Do not add `file-saver`; the Vue wrapper already has a working Blob download helper for SRK JSON and Gym Ghost DAT. For XLSX, the converter package delegates writing to `xlsx.writeFile`.

## SSR/CSR Behavior

SSR output may include enabled export buttons after implementation, but converter imports and all file-writing APIs must remain inside browser event handlers.

The implementation must not read or import these during SSR setup:

- `window`;
- `document`;
- `Blob`;
- `URL`;
- `navigator`;
- `@algoux/standard-ranklist-convert-to`;
- `xlsx`.

## Rejected Options

### Continue Deferring The Three Formats

This keeps dependency risk at zero but leaves visible disabled menu items and keeps the old home-page promise partially unfulfilled. It is acceptable only if product priority for Gym Ghost, VJudge Replay, and Excel exports is low.

### Copy Converter Code Into `rankland-web`

This avoids the package dependency but still needs an XLSX writer for two of the three formats. It also creates a maintenance fork of converter logic already published under the Algoux package.

### Server-Side Conversion Endpoint

This keeps `xlsx` out of the browser bundle, but it creates new public API surface, requires upload or server-side SRK lookup semantics, and is unnecessary for parity because the old app performs conversion client-side.

## Test Strategy

Unit tests:

- assert Gym Ghost metadata and DAT content from the fixture;
- assert VJudge and Excel converter workbooks contain expected sheet names and representative cell values;
- assert the lazy helper returns deterministic filenames before touching browser download APIs.

Full-chain E2E:

- `/ranklist/test-key` enables all three converter-backed menu items;
- Gym Ghost download produces `test-key_gymghost.dat` and includes contest/team content;
- VJudge Replay download produces `test-key_vjreplay.xlsx`;
- Excel download produces `test-key.xlsx`;
- `/live/live-test-key?...` exposes the same enabled menu items and can trigger at least one converter-backed export from the live wrapper.

Build verification:

- `corepack pnpm run build` must pass so Vite SSR and client chunking accept the dynamic import.
- `corepack pnpm test:migration` should be the final gate because this affects shared wrapper behavior on SSR and CSR routes.

## Acceptance Criteria

- All three previously disabled converter-backed export menu items are enabled for ranklist and live routes.
- Export filenames match the old React behavior.
- Conversion uses the original SRK ranklist data, not filtered/time-travel generated data.
- Browser-only converter code is not evaluated during SSR.
- Focused unit tests, full-chain E2E for affected routes, `corepack pnpm run build`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.

## Risks

- `xlsx@0.18.5` is the latest npm release but old and large. Lazy import mitigates initial route payload but does not remove the dependency.
- `rankland-web` currently has mixed `standard-ranklist-utils` versions in the dependency tree. The converter should resolve its own compatible utils version through pnpm; tests must guard behavior with the fixture.
- Playwright may need download handling adjustments for `xlsx.writeFile()` because it is invoked inside the converter package rather than through the wrapper's temporary anchor helper.
