# Playground Shortcut Tag Spacing Parity Design

## Goal

Restore the old React Playground invalid JSON shortcut tag spacing.

## Source Behavior

`rankland-fe/src/components/SrkPlayground.tsx` renders the invalid JSON prompt as:

```tsx
<Tag color="blue" className="mr-0">
  Ctrl/Cmd + S
</Tag>
```

The old Ant Design tag uses Tailwind `mr-0`, so its right margin is `0px`. The tag has no custom left margin.

## Target Behavior

- `/playground` invalid JSON prompt keeps the existing Ant Design Vue blue tag and prompt copy.
- `.playground-shortcut-tag` computes to `margin-right: 0px`.
- `.playground-shortcut-tag` computes to `margin-left: 0px`.
- Existing invalid JSON prompt spacing (`mt-16`, centered text) remains unchanged.

## Non-goals

- Do not change parser behavior, Monaco behavior, E2E preview hook, prompt copy, or preview rendering.
- Do not change the current Playground layout slice.

## Test Strategy

- Extend the existing full-chain invalid JSON Playground test to assert the shortcut tag's computed left and right margins.
- Verify RED before changing CSS, then run the same test GREEN after the CSS change.
- Run the full migration gate after documentation updates.

## Acceptance

- Focused invalid JSON full-chain test fails before implementation because current Vue uses `margin: 0 4px`.
- Focused invalid JSON full-chain test passes after implementation.
- Full migration gate passes:
  `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
