# SRK Header Action Display Parity Design

## Context

Old React `StyledRanklistRenderer` renders the SRK header meta/action row as a normal block `div`:

```tsx
<div className="text-center mt-1">
  {meta && (
    <span className="mr-2">
      <EyeOutlined /> {meta.viewCnt || '-'}
    </span>
  )}
  <ClientOnly>
    {() => (
      <>
        <a className={`border-0 border-solid border-gray-400 mr-2 ${meta ? 'pl-2 border-l' : ''}`}>
          <Dropdown>
            <DownloadOutlined />
          </Dropdown>
        </a>
        <a className="pl-2 border-0 border-l border-solid border-gray-400">
          <Dropdown>
            <ShareAltOutlined />
          </Dropdown>
        </a>
      </>
    )}
  </ClientOnly>
</div>
```

The old action triggers are inline children in that block row. There is no dedicated flex container around export/share actions.

The migrated Vue wrapper keeps a stable `rankland-ranklist-header-actions` wrapper for testing and implementation, but its CSS currently makes both the meta row and action wrapper `display: inline-flex`. The previous slice removed the extra flex gap, but the display model is still not the old block/inline flow.

## Decision

Restore old display behavior while preserving the migrated stable wrapper:

- `.rankland-ranklist-header-meta` should compute as `display: block`, matching old `div.text-center.mt-1`;
- `.rankland-ranklist-header-actions` should compute as `display: inline`, making the wrapper behave like it is not a layout container;
- keep old action trigger utility classes, padding, borders, icon colors, hover colors, dropdown behavior, and no-gap spacing;
- keep the Vue-only `data-id` hooks for test stability.

This slice does not remove the `rankland-ranklist-header-actions` wrapper from the DOM because tests and Vue implementation use it as a stable hook. The wrapper is made layout-neutral instead.

## Tests

Extend the existing `/ranklist/:id` full-chain detail scenario, next to the current header action class/gap/style checks:

- assert `[data-id="rankland-ranklist-header-meta"]` computes `display: block`;
- assert `[data-id="rankland-ranklist-header-actions"]` computes `display: inline`;
- keep the existing assertions for `normal` row/column gap, utility class tokens, padding, borders, colors, hover, and dropdown behavior.

The focused full-chain test must fail before implementation because current Vue CSS computes `display: inline-flex` for both elements.

## Non-Goals

- Do not change header action menu contents or copy/download behavior.
- Do not alter previous hidden ref-link spacing or header action gap parity.
- Do not remove stable `data-id` hooks.
- Do not change controls/filter row flex layout.

## Acceptance Criteria

- Focused `/ranklist/:id` full-chain RED fails on `inline-flex` display for header meta/actions.
- Focused `/ranklist/:id` full-chain GREEN passes after restoring block/inline display.
- The full migration gate passes.
- Migration docs record SRK header action display parity.
