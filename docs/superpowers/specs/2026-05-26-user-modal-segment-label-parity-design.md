# User Modal Segment Label Parity Design

## Goal

Restore the old React user modal award/segment label in the Vue SRK wrapper.

## Old React Baseline

`rankland-fe/src/components/UserInfoModal.tsx` computes the user's matched main ICPC series and segment, then renders:

```tsx
所在奖区（{matchedMainSeries.title}）：
<span className={`user-modal-segment-label bg-segment-${matchedSeriesSegment.style}`}>
  {matchedSeriesSegment.title}
</span>
```

The old stylesheet renders the segment as a compact 4px-radius label with white text and preset segment background colors:

```less
.user-modal-segment-label {
  display: inline-block;
  padding: 4px;
  border-radius: 4px;
  color: #ffffff;
}
```

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` shows organization, unofficial status, team members, markers, photo, slogan, and rank-time chart, but does not show the old `所在奖区` segment line.

## Scope

- Add the old main ICPC series matching rule inside the Vue wrapper.
- Compute the active user's matched segment from the rendered row `rankValues`.
- Render the `所在奖区（Rank）：Gold` line when a segment is available.
- Restore preset segment label classes for `gold`, `silver`, `bronze`, and `iron`.
- Cover the behavior with `/ranklist/:id` full-chain E2E.

## Non-Goals

- No changes to rank-time data selection.
- No changes to marker label styling in this slice.
- No changes to modal width, animation, photo, slogan, or chart behavior.
- No generated router changes.

## Test Strategy

Use the existing ranklist fixture. Team Alpha is official, has the `gold` marker, and receives the first `Rank` segment. The full-chain test opens the user modal and asserts the old segment line text plus the `bg-segment-gold` label class and visible label styling.

## Acceptance Criteria

- Focused full-chain test fails before implementation because the modal segment line is absent.
- Focused full-chain test passes after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records this verified slice.
