# Playground Preview Action Chrome Parity Design

## Goal

Restore the old React Playground visible chrome by removing the Vue-only `Preview` button from the product UI.

## Source Behavior

`rankland-fe/src/components/SrkPlayground.tsx` renders a fixed-width Monaco editor and a preview pane. The preview pane exposes the SRK docs link, invalid JSON prompt, and rendered SRK preview. It does not render a visible preview button.

The old invalid JSON prompt tells users to press `Ctrl/Cmd + S` to preview. The editor also updates the preview data from Monaco changes through the throttled `onCodeChange` path.

## Target Behavior

- `/playground` must not render `[data-id="playground-preview-action"]`.
- The existing Monaco editor, schema diagnostics, theme handling, welcome modal, docs link, invalid JSON prompt, preview wrapper, and E2E preview hook remain unchanged.
- Desktop and mobile viewport coverage must stop depending on the removed action button while still checking editor and preview bounds.

## Non-goals

- Do not change the Monaco package version.
- Do not change layout mechanics in this slice.
- Do not change invalid JSON copy, shortcut tag, welcome modal, docs link placement, or SRK renderer behavior.

## Acceptance

- Focused Playground full-chain test fails before implementation because the button still exists.
- Focused Playground full-chain test passes after implementation.
- Full migration gate passes:
  `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
