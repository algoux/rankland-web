# Playground docs link wrapper class parity design

## Context

The old React `SrkPlayground` renders the preview-pane srk docs link wrapper as exactly:

```tsx
<div className="absolute right-4 top-4">
  <a href="https://srk.algoux.org/zh/" target="_blank">
    <QuestionCircleOutlined /> srk 文档
  </a>
</div>
```

The Vue migration now restores the wrapper DOM, but the wrapper still carries the migration-only `playground-docs-link-wrapper` class. That keeps the visual placement correct, but leaves a public DOM/class-token difference from the old React component.

## Scope

- Remove the migration-only class from the docs-link wrapper.
- Keep the wrapper's old class string as `absolute right-4 top-4`.
- Preserve the current absolute placement, `z-index`, docs anchor hook, href, `target="_blank"`, omitted `rel`, icon, text, Monaco flow, preview rendering, and no-upstream-call behavior.

## Non-goals

- Do not change the docs link itself, App shell, Home, SRK footer, beian, contributor, or reference link behavior.
- Do not change Monaco versions, loader behavior, SRK parsing, invalid prompt behavior, or renderer internals.
- Do not introduce a broader utility-class system.

## Test strategy

- Extend the existing Playground full-chain hydration/preview test to assert the wrapper class is exactly `absolute right-4 top-4`.
- Confirm RED against current Vue because the wrapper includes `playground-docs-link-wrapper`.
- Move the placement CSS to a selector matching the old wrapper class combination and remove the migration-only class from the template.
- Run focused Playground GREEN, then the full migration gate.

## Acceptance criteria

- The docs link wrapper is a direct preview-pane child with class `absolute right-4 top-4`.
- No `playground-docs-link-wrapper` class is rendered.
- The link keeps href, `target="_blank"`, omitted `rel`, icon, text, visibility, and 16px top/right visual placement.
- Full migration gate passes.
