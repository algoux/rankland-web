# Playground shortcut tag mr-0 class parity design

## Context

The old React playground invalid JSON prompt renders the keyboard shortcut with:

```tsx
<Tag color="blue" className="mr-0">
  Ctrl/Cmd + S
</Tag>
```

The migrated Vue playground already preserves the prompt copy, `h3.mt-16.text-center` classes, and computed zero margins through `.playground-shortcut-tag`, but the old `mr-0` utility class token is missing from the rendered Ant Design Vue tag.

## Scope

- Restore the old `mr-0` class token on the invalid JSON shortcut tag in `/playground`.
- Preserve the migrated `.playground-shortcut-tag` selector for stable full-chain coverage.
- Preserve the verified `0px` right and left margins.

## Non-goals

- Do not change Monaco loading, schema validation, or editor interaction behavior.
- Do not change the invalid JSON prompt copy.
- Do not change preview rendering or SRK renderer behavior.

## Test strategy

- Extend `tests/e2e/full-chain/playground.spec.ts` to assert the shortcut tag has the old `mr-0` class token.
- Run the focused full-chain invalid JSON test and observe RED before implementation.
- Run the same focused test after implementation.
- Run the full migration gate before commit.

## Acceptance criteria

- `/playground` invalid JSON state renders the shortcut tag with both `.playground-shortcut-tag` and `.mr-0`.
- The shortcut tag still computes `margin-right: 0px` and `margin-left: 0px`.
- Full migration gate passes.
