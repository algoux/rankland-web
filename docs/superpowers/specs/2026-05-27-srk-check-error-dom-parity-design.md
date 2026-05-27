# SRK Check Error DOM Parity Design

## Context

Old React wraps every public SRK preview in `StyledRanklist` before `StyledRanklistRenderer`. That wrapper runs `ts-interface-checker` against `@algoux/standard-ranklist@0.3.12` and, when the JSON object is not a valid Ranklist shape, renders:

```tsx
<div className="ml-8">
  <h3>Error occurred while checking srk:</h3>
  <pre>{srkCheckError}</pre>
</div>
```

The migrated Vue wrapper currently catches all conversion failures in `createRanklandRanklistState()` and renders the Ant Design renderer-error Alert. That preserves the old renderer ErrorBoundary path, but it collapses the separate old checker-error path into the wrong DOM.

## Goal

Restore the old SRK checker-error DOM for JSON objects that fail the SRK structural checker while keeping the existing renderer-error Alert for post-check render/conversion failures.

## Scope

- Add the same runtime checker dependency used by old React: `ts-interface-checker@1.0.2`.
- Copy the generated `@algoux/standard-ranklist@0.3.12` checker module from `rankland-fe`.
- Add a small helper that returns the old checker error message before conversion.
- Extend the shared Vue ranklist state with a distinct `check-error` state.
- Render the old `div.ml-8 > h3 + pre` checker-error DOM in `rankland-ranklist.vue`.
- Cover the behavior through `/playground`, because it is the public route where users paste arbitrary JSON objects.
- Keep deterministic test fixtures compatible with the old checker. Existing mock marker ids/labels remain unchanged, but marker `style` values must use marker presets rather than segment presets.

## Non-Goals

- Do not change invalid JSON behavior; malformed JSON still shows the existing old Playground invalid prompt.
- Do not change the existing renderer-error Ant Design Alert path for actual renderer/conversion failures after checker validation.
- Do not change low-level SRK table rendering or package output.
- Do not regenerate router outputs; no route metadata changes are involved.

## Test Strategy

Add focused full-chain Playground coverage for object JSON that is syntactically valid but structurally invalid SRK, such as `{"type":"general"}`:

- RED should fail because `[data-id="rankland-ranklist-check-error"]` does not exist and the current Alert path appears instead.
- GREEN should pass with:
  - `div[data-id="rankland-ranklist-check-error"].ml-8`;
  - heading text `Error occurred while checking srk:`;
  - non-empty `pre`;
  - 32px left margin from the old `ml-8` utility;
  - no Ant Design renderer-error Alert for this checker-failure input.

Keep existing renderer-error coverage intact unless the fixture is reclassified as a checker error. If needed, use a unit-level renderer-state test to keep the renderer-error branch covered separately.

## Acceptance Criteria

- Structurally invalid SRK objects render the old checker-error DOM.
- Existing invalid JSON prompt remains unchanged.
- Existing bundled Playground preview remains unchanged.
- Existing mock-backed ranklist fixtures still render normally after their marker styles are valid under the old checker.
- Existing renderer-error Alert behavior remains available for non-checker render failures.
- Full migration gate passes after docs are updated.
