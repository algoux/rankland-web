# Playground docs link rel omission parity design

## Context

The old React `SrkPlayground` renders the preview-pane srk docs link as a plain external anchor with `target="_blank"` and no `rel` attribute:

```tsx
<a href="https://srk.algoux.org/zh/" target="_blank">
  <QuestionCircleOutlined /> srk 文档
</a>
```

The migrated Vue Playground preserves the preview-pane placement, href, text, `QuestionCircleOutlined` icon, and absolute positioning, but still renders `rel="noreferrer"`. That changes both the public DOM and referrer behavior from the old React page.

## Scope

- Restore old omitted-`rel` DOM parity for the Playground preview docs link:
  - `data-id="playground-docs-link"`.
- Keep `href="https://srk.algoux.org/zh/"`, `target="_blank"`, icon, text, absolute placement, Monaco readiness, welcome modal copy, preview rendering, and no-upstream-call behavior unchanged.

## Non-goals

- Do not change App shell, Home, SRK footer, beian, contributor, or reference links; those are covered by separate slices.
- Do not change Monaco package/version behavior, synthetic editing hooks, preview parsing, or SRK renderer internals.
- Do not change generated route files or route metadata.

## Test strategy

- Extend the existing Playground full-chain hydration/preview test to assert the docs link keeps `target="_blank"` and omits `rel`.
- Run the focused Playground full-chain test and confirm RED while Vue still emits `rel="noreferrer"`.
- Remove only the Vue-added `rel="noreferrer"` from the docs anchor.
- Run the same focused full-chain test again, then run the full migration gate.

## Acceptance criteria

- The Playground docs link matches old React by omitting `rel` while keeping `target="_blank"`.
- Existing href, icon, placement, preview, Monaco readiness, welcome modal, and no-upstream-call coverage remain green.
- Full migration gate passes.
