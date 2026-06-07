# SRK Controls Utility Class Parity Design

## Context

The old React `StyledRanklistRenderer` renders the shared SRK controls row with legacy utility class tokens:

```tsx
<div className="mt-3 mx-4 flex justify-between items-center">
  <div>
    <span>筛选</span>
    <Select className="ml-2" ... />
    <span className="ml-5 inline-flex items-center">
      <span className="mr-1">仅正式参赛</span>
      <Switch ... />
    </span>
    <Radio.Group className="ml-5 inline-flex items-center" ... />
  </div>
  <div>{renderExtraActionArea ? renderExtraActionArea(memorizedData) : null}</div>
</div>
```

The migrated Vue wrapper already preserves the computed controls layout, spacing, Ant Design Vue Select/Switch/Radio controls, and filter behavior through scoped classes. It does not expose the old utility class tokens on the controls DOM.

## Decision

Restore the old controls utility class tokens alongside the migrated hooks:

- controls root: keep `rankland-ranklist-controls`, add `mt-3 mx-4 flex justify-between items-center`;
- organization Select: keep `rankland-ranklist-select`, add `ml-2`;
- official-only label wrapper: keep `rankland-ranklist-filter rankland-ranklist-checkbox`, add `ml-5 inline-flex items-center`;
- official-only text span: add `mr-1`;
- marker Radio.Group: keep `rankland-ranklist-marker-filter`, add `ml-5 inline-flex items-center`.

Do not introduce global Tailwind utility CSS. Existing scoped styles remain the source of computed layout and spacing.

## Scope

In scope:

- `src/client/components/rankland-ranklist.vue` controls/filter DOM class tokens.
- Focused `/ranklist/:id` full-chain assertions for controls class parity.
- Migration docs after verification.

Out of scope:

- Filter behavior, selected tag behavior, Ant Design Vue control substitution, extra-action rendering, or route-level layout spacing.
- Low-level SRK table rendering.
- Adding global utility styles.

## Test Strategy

Extend the main ranklist full-chain route test because it renders the shared SRK controls with Select, Switch, and marker Radio.Group. Assert:

- `[data-id="rankland-ranklist-controls"]` includes the old controls row tokens;
- `[data-id="rankland-ranklist-organization-filter"]` includes `ml-2`;
- the official-only wrapper includes `ml-5 inline-flex items-center`;
- the official-only text includes `mr-1`;
- `[data-id="rankland-ranklist-marker-filter"]` includes `ml-5 inline-flex items-center`;
- existing computed spacing and filtering behavior remain unchanged.

The focused RED should fail before implementation because the current Vue controls lack those old class tokens.

## Acceptance Criteria

- Focused ranklist full-chain test fails before implementation for missing controls utility class tokens.
- Focused ranklist full-chain test passes after implementation.
- Existing controls spacing, selected tag behavior, official-only behavior, and marker filter behavior stay green.
- Full migration gate passes: `gen:client-router`, `test:migration`, and `git diff --check`.
