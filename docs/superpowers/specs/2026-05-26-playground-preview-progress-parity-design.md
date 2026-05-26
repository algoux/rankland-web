# Playground Preview Progress Parity Design

## Context

The old React playground renders preview ranklists with:

```tsx
<StyledRanklist data={data} name="playground" showFilter />
```

`StyledRanklistRenderer` defaults `showProgress = true`, so the playground preview includes the SRK progress bar even though the route does not pass the prop explicitly.

The Vue migration currently renders:

```vue
<RanklandRanklist :ranklist="parseState.data" name="playground" show-filter />
```

but `RanklandRanklist` defaults `showProgress` to `false`. This drops the old playground preview progress bar while standalone ranklist, collection, and live pages pass `show-progress` explicitly.

## Goal

Restore the old default progress behavior for `RanklandRanklist` so Playground previews show the SRK progress bar without requiring route-specific override code.

## Scope

- Add full-chain coverage that `/playground` preview renders `data-id="rankland-ranklist-progress"`.
- Change the shared `RanklandRanklist` `showProgress` prop default from `false` to `true`.
- Keep Playground screenshot review deterministic by using no-animation viewport screenshots and a fresh mobile page when the restored SRK progress bar is present.
- Keep explicit `show-progress` callers unchanged.
- Do not change progress styling, time-travel behavior, Monaco behavior, filters, or route data loading in this slice.

## Tests

- Extend `tests/e2e/full-chain/playground.spec.ts` in the existing bundled SRK preview test to assert the progress bar is visible.
- Keep the existing Playground desktop/mobile screenshot coverage, with animations disabled, viewport captures, and a fresh mobile page to avoid Chromium full-page screenshot and same-page renavigation hangs after Monaco plus SRK progress renders in the full-chain browser process.
- Run that focused spec before implementation and confirm it fails because the progress bar is absent.
- Run it again after implementation and confirm it passes.

## Acceptance

- Focused playground full-chain spec fails before implementation and passes after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before the slice is reported as verified.
- `docs/migration/status.md` records Playground preview progress parity and the updated full-gate evidence.
