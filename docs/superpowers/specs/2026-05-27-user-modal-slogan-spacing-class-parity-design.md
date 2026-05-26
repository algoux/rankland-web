# User Modal Slogan Spacing Class Parity Design

## Goal

Restore the old React user modal slogan spacing utility class tokens in the Vue SRK wrapper without changing slogan content, typography, pseudo-label rendering, or modal data flow.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` renders the optional user slogan as:

```tsx
{slogan && <p className="slogan mt-4 mb-2">{slogan}</p>}
```

The current Vue wrapper already keeps `.slogan` and equivalent computed spacing through `.rankland-user-modal-slogan`, but it does not expose the old `mt-4` and `mb-2` class tokens on the slogan node.

## Target Behavior

`src/client/components/rankland-ranklist.vue` should render the slogan node with:

```html
class="rankland-user-modal-slogan slogan mt-4 mb-2"
```

The migrated hook remains responsible for local styles. The old class tokens are restored for DOM parity with `rankland-fe` and for downstream visual review selectors.

## Non-Goals

- Do not change the slogan text source or `x_slogan` handling.
- Do not change the `SLOGAN` pseudo-label, font family, font size, or alignment.
- Do not change the surrounding photo wrapper or rank-time wrapper in this slice.

## Test Strategy

Add full-chain Ranklist user modal assertions that:

- verify the slogan node carries `mt-4`;
- verify the slogan node carries `mb-2`;
- extend the existing computed style assertion to include `margin-top: 16px` and `margin-bottom: 8px`.

Use TDD: the focused full-chain Ranklist test must fail before implementation because the current slogan class lacks `mt-4 mb-2`, then pass after the Vue template change.

## Acceptance Criteria

- Focused Ranklist full-chain test fails RED for missing `mt-4` or `mb-2` before production code changes.
- Focused Ranklist full-chain test passes GREEN after implementation.
- Full migration gate passes after docs are updated.
- Migration dashboard, manual acceptance checklist, and final integration review mention slogan spacing class parity.
