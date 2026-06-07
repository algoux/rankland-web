# User Modal Marker Label Product Class Parity Design

## Context

Old React `rankland-fe/src/components/UserInfoModal.tsx` renders each user marker through `MarkerLabel` and passes only one extra modal class:

```tsx
<MarkerLabel
  key={marker.id}
  marker={marker}
  theme={theme as EnumTheme}
  className="user-modal-info-marker"
/>
```

The renderer component then contributes the marker preset class such as `srk-preset-marker-yellow`. The Vue migration currently preserves the old modal class and preset class, but also exposes a migration-only product class:

```vue
<span
  data-id="rankland-user-modal-marker"
  class="rankland-user-modal-marker user-modal-info-marker"
  :class="marker.className"
>
```

This keeps visual styling stable, but product DOM parity is incomplete because the old React marker label did not include `rankland-user-modal-marker`.

## Scope

Restore exact old React class parity for `[data-id="rankland-user-modal-marker"]` in the Ranklist full-chain fixture:

- render exact `class="user-modal-info-marker srk-preset-marker-yellow"` for the first modal marker;
- remove Vue-only `rankland-user-modal-marker`;
- preserve marker text `Gold Group`;
- preserve stable `data-id` for full-chain diagnostics;
- preserve preset marker style, inline marker style handling, inline-block display, padding, border, radius, font size, and last-marker spacing behavior.

## Non-Goals

- Do not change marker row parity; `.user-modal-info-markers.mt-2` is already covered.
- Do not change marker resolution, filtering, or preset style mapping.
- Do not change organization, team-member, segment, slogan, photo, or rank-time nodes.
- Do not remove other migration-only classes outside the marker label.

## Test Strategy

Update `tests/e2e/full-chain/ranklist.spec.ts` before implementation:

- assert the first marker has exact class list `user-modal-info-marker srk-preset-marker-yellow`;
- assert the marker class list does not contain `rankland-user-modal-marker`;
- keep existing text, preset class, and computed style coverage.

Expected RED: the focused Ranklist full-chain test fails because Vue still emits `rankland-user-modal-marker user-modal-info-marker srk-preset-marker-yellow`.

Expected GREEN: the focused test and full Ranklist full-chain file pass after the Vue template removes the migration-only class and scoped styles target the stable `data-id` plus old modal class.

## Acceptance Criteria

- `[data-id="rankland-user-modal-marker"]` renders the old modal class plus SRK preset class, with no Vue-only marker label class.
- Marker text and preset styling remain unchanged.
- Computed marker spacing/style coverage remains unchanged.
- `corepack pnpm test:migration` and `git diff --check` pass before commit.
