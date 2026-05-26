# SRK Remarks Pill Parity Design

## Goal

Restore the old React SRK renderer remarks presentation in the Vue `RanklandRanklist` wrapper.

## Old React Baseline

`rankland-fe/src/components/StyledRanklistRenderer.tsx` renders `staticData.remarks` inside the table wrapper immediately before the low-level `<Ranklist />`:

```tsx
<div className={tableClass} style={tableStyle}>
  {staticData.remarks && (
    <div className="mb-4 text-center">
      <span className="srk-remarks">备注：{resolveText(staticData.remarks)}</span>
    </div>
  )}
  <Ranklist ... />
</div>
```

`rankland-fe/src/components/StyledRanklistRenderer.less` styles `.srk-remarks` as a compact bordered pill:

```less
.srk-remarks {
  @apply px-2 py-1 inline-block rounded opacity-75;
  border: 1px solid rgba(var(--primary-color-r), 0.8);
  font-size: 12px;
}
```

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` renders remarks as a plain `.rankland-ranklist-remarks` text block outside `data-id="rankland-ranklist-table-wrapper"`. That loses the old wrapper-local layout and visible pill treatment.

## Scope

- Add deterministic fixture remarks to the existing full-chain ranklist fixture.
- Assert that remarks render inside `data-id="rankland-ranklist-table-wrapper"`.
- Assert the old visible pill affordance through `.srk-remarks` computed styles.
- Move the Vue remarks block inside the table wrapper before `<Ranklist />`.
- Add scoped CSS matching the old visible contract.

## Non-Goals

- No changes to SRK parsing, filtering, time travel, export, modals, or row rendering.
- No attempt to make all low-level table cells pixel-perfect in this slice.
- No route metadata or generated router changes.

## Test Strategy

Use the full-chain `/ranklist/:id` route because it exercises SSR, hydration, mock backend SRK data, and the shared Vue renderer. The RED test should fail on the current implementation because `.srk-remarks` does not exist and remarks are outside the table wrapper.

## Acceptance Criteria

- Focused full-chain test fails before implementation for the expected missing `.srk-remarks` pill.
- Focused full-chain test passes after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records the verified slice.
