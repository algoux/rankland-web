# User Modal Markers Class Parity Design

## Goal

Restore the old React user modal marker-row utility class token in the Vue SRK wrapper without changing marker resolution, label styling, or modal data flow.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` renders user markers inside:

```tsx
<div className="user-modal-info-markers mt-2">
```

The current Vue wrapper already keeps `user-modal-info-markers` and equivalent computed spacing through `.rankland-user-modal-markers`, but it does not expose the old `mt-2` class token.

## Target Behavior

`src/client/components/rankland-ranklist.vue` should render the marker-row container with:

```html
class="rankland-user-modal-markers user-modal-info-markers mt-2"
```

The migrated hook remains for local styling. The old class token is restored for DOM parity with `rankland-fe` and for downstream visual review selectors.

## Non-Goals

- Do not change marker text, SRK preset marker classes, marker colors, or marker spacing between labels.
- Do not alter modal layout outside the marker-row container.
- Do not add new runtime data attributes unless the existing selectors become insufficient.

## Test Strategy

Add a full-chain Ranklist user modal assertion that:

- locates the marker-row container by `.user-modal-info-markers`;
- verifies it carries `mt-2`;
- verifies it still computes to `display: block` and `margin-top: 8px`.

Use TDD: the focused full-chain Ranklist test must fail before implementation because the current container lacks `mt-2`, then pass after the Vue template change.

## Acceptance Criteria

- Focused Ranklist full-chain test fails RED for missing `mt-2` before production code changes.
- Focused Ranklist full-chain test passes GREEN after implementation.
- Full migration gate passes after docs are updated.
- Migration dashboard, manual acceptance checklist, and final integration review mention marker-row class parity.
