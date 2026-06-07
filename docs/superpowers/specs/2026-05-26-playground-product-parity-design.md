# Playground Product Parity Design

## Goal

Recover a small, externally visible piece of the old React Playground product behavior in the Vue migration: the one-time welcome modal and Ant Design Vue interaction surface around the existing editor workflow.

## Source Behavior

Source references:

- `rankland-fe/src/pages/playground/index.tsx`
- `rankland-fe/src/components/SrkPlayground.tsx`
- `rankland-fe/src/components/SrkPlayground.less`
- `rankland-fe/src/configs/local-storage-key.config.ts`

The old React playground:

- opens a welcome `Modal.info` after Monaco is ready unless `PlaygroundWelcomeMessageRead` is already `true`;
- writes `PlaygroundWelcomeMessageRead=true` when the user confirms the modal;
- explains the editor use case, desktop recommendation, and SRK docs entry point;
- presents the preview help state with a blue `Tag` around `Ctrl/Cmd + S`;
- keeps the SRK docs link in the preview surface;
- uses Monaco, JSON schema diagnostics, and theme-aware editor theme.

## Slice Scope

Included:

- restore the one-time welcome modal with the same local storage key, title, core copy, and OK persistence behavior;
- keep the modal client-only and localStorage-driven because `/playground` is a CSR workflow;
- use Ant Design Vue components for the preview action, modal, and shortcut tag while preserving current stable selectors;
- keep the existing textarea editor and renderer workflow intact;
- add full-chain coverage for first-visit modal behavior and repeat-visit suppression.

Deferred:

- Monaco integration;
- JSON schema diagnostics;
- theme-aware Monaco editor theme;
- exact pixel parity for the React playground layout;
- editor performance throttling and remaining-height parity.

## Behavior Contract

Stable selectors:

```text
data-id="playground-welcome-modal"
data-id="playground-welcome-ok"
data-id="playground-preview-action"
data-id="playground-docs-link"
data-id="playground-invalid-json"
```

First visit behavior:

- if `window.localStorage.getItem('PlaygroundWelcomeMessageRead') !== 'true'`, the welcome modal is visible after hydration;
- the modal title is `欢迎来到演练场！`;
- the modal content explains SRK debugging and points to the SRK docs;
- clicking the OK action closes the modal and writes `PlaygroundWelcomeMessageRead=true`.

Repeat visit behavior:

- if the key is already `true`, no welcome modal is shown.

Preview behavior:

- existing bundled SRK preview, invalid JSON, render-error, and `Ctrl/Cmd + S` behavior remain unchanged;
- current full-chain no-upstream-calls contract remains unchanged.

## SSR / CSR Decision

`/playground` remains CSR. The modal is only evaluated after mount, so it does not participate in SSR HTML and cannot introduce hydration mismatches.

## Test Strategy

Full-chain E2E:

- clear `PlaygroundWelcomeMessageRead`, open `/playground`, assert the modal appears, confirm it, and assert localStorage persists `true`;
- reload the route and assert the modal stays hidden;
- keep existing tests for hydration, docs link, preview rows, invalid JSON, renderer errors, viewport bounds, and no upstream RankLand API calls.

No unit test is required for this slice because the behavior is browser-local UI state around `window.localStorage`.

## Acceptance Criteria

- First visit to `/playground` shows the welcome modal.
- Confirming the modal writes `PlaygroundWelcomeMessageRead=true`.
- Returning to `/playground` with the key set does not show the modal.
- Existing Playground full-chain tests still pass.
- Full migration gate passes before commit.

## Known Risks

- Ant Design Vue modal internals may render through teleport, so tests should target the stable `data-id` wrapper rather than relying on DOM position.
- Monaco/editor parity remains a separate larger slice because no Vue Monaco dependency is currently installed in `rankland-web`.
