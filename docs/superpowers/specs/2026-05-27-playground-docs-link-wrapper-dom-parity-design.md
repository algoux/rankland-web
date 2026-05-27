# Playground docs link wrapper DOM parity design

## Context

The old React `SrkPlayground` renders the preview-pane srk docs link inside a utility-class wrapper:

```tsx
<div className="absolute right-4 top-4">
  <a href="https://srk.algoux.org/zh/" target="_blank">
    <QuestionCircleOutlined /> srk 文档
  </a>
</div>
```

The migrated Vue Playground preserves the docs link itself and its visual absolute placement, but applies the placement class to the link and omits the old wrapper DOM. Product behavior and screenshots are already stable, but the public DOM/utility-class structure still differs from the old React component.

## Scope

- Restore the old preview-pane wrapper DOM around `data-id="playground-docs-link"`:
  - outer `div.absolute.right-4.top-4`;
  - inner docs link with existing `data-id`, class hook, href, `target="_blank"`, omitted `rel`, icon, and text.
- Preserve current visual placement at 16px top/right, no-upstream-call behavior, preview rendering, Monaco readiness, welcome modal, and full-chain selectors.

## Non-goals

- Do not change App shell, Home, SRK footer, beian, contributor, reference, or docs-link `rel` behavior.
- Do not change Monaco package/version behavior, editor hooks, SRK parsing, or renderer internals.
- Do not add new styling beyond mapping existing placement rules onto the old wrapper shape.

## Test strategy

- Extend the existing Playground full-chain hydration/preview test to assert the docs link is nested under `.playground-preview-pane > .absolute.right-4.top-4`.
- Confirm RED against current Vue because the wrapper is missing.
- Add the wrapper and move the placement class to the wrapper while preserving the anchor hook.
- Run the focused Playground test again, then run the full migration gate.

## Acceptance criteria

- The docs link has the old wrapper DOM and utility classes.
- The link keeps href, `target="_blank"`, omitted `rel`, icon, text, visibility, and 16px top/right visual placement.
- Full migration gate passes.
