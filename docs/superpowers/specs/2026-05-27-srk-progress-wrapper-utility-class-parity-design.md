# SRK Progress Wrapper Utility Class Parity Design

## Context

The old React `StyledRanklistRenderer` renders the SRK progress bar inside an unconditional `mx-4` wrapper:

```tsx
<div className="mx-4">
  <ProgressBar
    data={memorizedData}
    enableTimeTravel
    onTimeTravel={handleTimeTravel}
    live={isLive}
  />
</div>
```

The Vue wrapper currently renders the progress bar without the old utility class:

```vue
<div v-if="showProgress" data-id="rankland-ranklist-progress" class="rankland-ranklist-progress">
  <ProgressBar :data="ranklist" enable-time-travel :live="isLive" @time-travel="handleTimeTravel" />
</div>
```

Existing tests cover vertical gaps around the progress bar, but they do not prove the old `mx-4` horizontal wrapper contract.

## Decision

Add the old `mx-4` class token to the Vue progress wrapper while keeping the migrated `.rankland-ranklist-progress` hook and existing `data-id`.

This restores the old left/right 16px wrapper spacing for every shared SRK wrapper surface that renders progress: ranklist detail, collection selected ranklist, live ranklist, and playground preview when progress is enabled.

## Test Strategy

Extend the existing Ranklist full-chain detail scenario because it already renders the shared SRK wrapper with progress enabled.

The test should assert:

- `[data-id="rankland-ranklist-progress"]` exists;
- it carries the old `mx-4` class token;
- computed `margin-left` and `margin-right` are both `16px`.

The focused RED should fail on the missing `mx-4` class or `0px` horizontal margins. The focused GREEN should pass after adding `mx-4`.

## Acceptance Criteria

- The Vue progress wrapper renders `class="rankland-ranklist-progress mx-4"` when `showProgress` is true.
- Existing progress rendering and time-travel behavior are unchanged.
- Existing header-to-progress and progress-to-controls vertical spacing coverage remains green.
- Migration docs record SRK progress wrapper utility-class parity.
- Full migration gate passes: `gen:client-router`, `test:migration`, and `git diff --check`.

## Non-Goals

- Do not change `ProgressBar` internals.
- Do not change `showProgress` semantics.
- Do not change table wrapper offset or top spacing.
- Do not add route-specific CSS overrides.
