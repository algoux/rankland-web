# Playground preview wrapper DOM/class parity design

## Context

The old React `SrkPlayground` wraps the valid SRK preview in a plain div with old utility classes:

```tsx
<div className="mt-8 mb-8">
  <StyledRanklist data={data} name="playground" showFilter />
</div>
```

The Vue migration currently renders the same preview content in:

```vue
<section data-id="playground-preview" class="playground-preview">
  <RanklandRanklist ... />
</section>
```

The computed 32px top/bottom spacing is already covered, but the public DOM and old class tokens still differ.

## Scope

- Restore the valid preview wrapper to a `div`.
- Restore exact old wrapper class tokens `mt-8 mb-8`.
- Keep `data-id="playground-preview"` as a stable full-chain selector.
- Preserve the same 32px top/bottom spacing, SRK preview rendering, filters, progress, docs link, Monaco behavior, invalid JSON behavior, and no-upstream-call behavior.

## Non-goals

- Do not change the preview-pane shell, docs link, invalid JSON state, checker-error state, or render-error Alert.
- Do not change RanklandRanklist internals or shared SRK renderer behavior.
- Do not change Monaco versions, loader behavior, editor hooks, or E2E preview hook behavior.

## Test strategy

- Extend the existing Playground full-chain hydration/preview test to assert `[data-id="playground-preview"]` is a `div`.
- Assert its class is exactly `mt-8 mb-8`.
- Confirm RED against current Vue because it renders `section.playground-preview`.
- Change the wrapper and replace the Vue-only `.playground-preview` style with scoped `mt-8` / `mb-8` utility rules.
- Run focused Playground GREEN, then the full migration gate.

## Acceptance criteria

- Valid SRK preview wrapper renders as `div.mt-8.mb-8`.
- `data-id="playground-preview"` remains available for tests.
- The wrapper still computes to 32px top and bottom margins.
- Existing preview content, filters, progress, docs link, and no-upstream-call behavior remain covered.
- Full migration gate passes.
