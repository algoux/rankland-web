# Playground docs link anchor class parity design

## Context

The old React `SrkPlayground` renders the preview-pane srk docs link as a plain anchor:

```tsx
<div className="absolute right-4 top-4">
  <a href="https://srk.algoux.org/zh/" target="_blank">
    <QuestionCircleOutlined /> srk 文档
  </a>
</div>
```

The Vue migration has already restored the wrapper DOM, exact wrapper class, `target="_blank"`, and omitted `rel`. The inner anchor still carries a migration-only `playground-docs-link` class, with scoped CSS adding `inline-flex` and `gap`. That leaves the public docs-link DOM and visual treatment different from the old React component.

## Scope

- Remove the migration-only `playground-docs-link` class from the docs anchor.
- Remove the now-unused scoped `.playground-docs-link` rule.
- Keep the existing `data-id="playground-docs-link"` test hook, href, `target="_blank"`, omitted `rel`, text, icon, wrapper, and 16px top/right placement.

## Non-goals

- Do not change the docs-link wrapper DOM/class or its absolute placement.
- Do not change App shell, Home, SRK footer, beian, contributor, or reference-link behavior.
- Do not change Monaco versions, loader behavior, SRK parsing, invalid prompt behavior, or renderer internals.

## Test strategy

- Extend the existing Playground full-chain hydration/preview test to assert the docs anchor has no `class` attribute.
- Confirm RED against current Vue because the anchor still renders `class="playground-docs-link"`.
- Remove the class and scoped CSS.
- Run focused Playground GREEN, then the full migration gate.

## Acceptance criteria

- The preview docs anchor remains under `div.absolute.right-4.top-4`.
- The anchor has no `class` attribute.
- The link keeps href, `target="_blank"`, omitted `rel`, icon, text, visibility, and wrapper placement.
- Full migration gate passes.
