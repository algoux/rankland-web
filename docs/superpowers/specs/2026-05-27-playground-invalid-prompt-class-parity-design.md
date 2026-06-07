# Playground Invalid Prompt Class Parity Design

## Context

The old React `SrkPlayground` renders the invalid JSON prompt directly on an `h3` with legacy utility classes:

```tsx
<h3 className="mt-16 text-center">
  Input valid srk JSON and press <Tag color="blue" className="mr-0">Ctrl/Cmd + S</Tag> to preview
</h3>
```

The Vue migration currently preserves the visible text, 64px top spacing, centered layout, and `Tag.mr-0` spacing through a wrapper `.playground-state`, but the `h3` itself does not carry the old `mt-16 text-center` class tokens. This is a small DOM/class parity gap in the Playground invalid JSON state.

## Decision

Restore the old utility classes on the invalid JSON `h3` while preserving the current wrapper selector and visible behavior:

- keep `data-id="playground-invalid-json"` on the state wrapper;
- add `class="mt-16 text-center"` to the invalid JSON `h3`;
- keep the existing `playground-state` wrapper and CSS so layout remains stable;
- keep `a-tag.playground-shortcut-tag` and its old `mr-0` behavior;
- do not change Monaco loading, preview execution, parse logic, or the E2E-only source hook.

## Test Strategy

Update the existing full-chain invalid JSON scenario before implementation:

- assert the `h3` under `[data-id="playground-invalid-json"]` has `mt-16`;
- assert the same `h3` has `text-center`;
- keep existing visible text, parent margin, text alignment, shortcut tag, and no-`pre` assertions.

The RED run should fail because the current `h3` has no class tokens.

## Acceptance Criteria

- Focused Playground invalid JSON full-chain test fails before implementation for the missing `h3` class tokens.
- Focused Playground invalid JSON full-chain test passes after implementation.
- Full migration gate passes:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

- Migration docs record this verified Playground invalid prompt class parity slice.

## Non-Goals

- Do not change Monaco package versions or editor integration.
- Do not change synthetic Monaco editing in the current Playwright harness.
- Do not change preview layout, SRK rendering, or the welcome modal.
- Do not pursue SRK lower-level table pixel parity in this slice.
