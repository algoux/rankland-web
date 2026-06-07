# User Modal Team Separator Text Parity Design

## Goal

Lock the old React raw text contract for the user modal team-member slash separator in full-chain coverage.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` renders team members as nested spans. For members after the first, the separator span contains one leading and one trailing space around the slash:

```tsx
<span className="user-modal-info-team-members-slash"> / </span>
```

The old LESS then applies opacity and smaller font size:

```less
.user-modal-info-team-members-slash {
  opacity: 0.5;
  font-size: 80%;
}
```

## Current Vue State

`src/client/components/rankland-ranklist.vue` preserves the separator class and visual styling, but its template stores the slash across multiple indented lines:

```vue
<span
  v-if="memberIndex > 0"
  data-id="rankland-user-modal-team-separator"
  class="rankland-user-modal-team-separator user-modal-info-team-members-slash"
>
  /
</span>
```

The rendered DOM already exposes raw `textContent` as `' / '`, but the existing full-chain test only used Playwright's normalized `toHaveText('/')`. That did not prove the old raw text contract.

## Target Behavior

The Ranklist full-chain test should prove that the rendered separator has exact raw text `' / '`. No production change is required unless that assertion fails in a future refactor.

## Non-Goals

- Do not change team member ordering or data resolution.
- Do not change the team-members row `mt-2`, opacity, padding, display, or separator visual style.
- Do not change markers, segment, photo, slogan, or rank-time behavior.

## Test Strategy

Extend the existing `/ranklist/:id` full-chain user modal test.

The test should:

- keep the normalized `toHaveText('/')` assertion for readable behavior;
- add a raw `textContent` assertion requiring exactly `' / '`;
- keep existing separator opacity and font-size assertions.

The focused Ranklist full-chain test was expected to fail before implementation, but it passed because the current Vue render output already matches the old raw text. This slice therefore stays test-only and records the verified existing behavior.

## Acceptance Criteria

- Focused Ranklist full-chain test proves the raw separator text is exactly `' / '`.
- No production implementation is made because current runtime behavior already matches old React.
- Full migration gate passes after docs are updated.
- Migration dashboard, manual acceptance checklist, and final integration review mention team separator raw text coverage.
