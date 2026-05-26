# Playground Toolbar Chrome Parity Design

## Context

The old React `/playground` route sets document metadata and renders the browser-only `SrkPlayground` component. The product surface starts with the Monaco editor and preview pane. There is no visible page-level `Playground` heading or toolbar above the editor.

The Vue migration still renders:

```vue
<section class="playground-toolbar">
  <div data-id="playground-hydrated" class="playground-hydrated">...</div>
  <h1>Playground</h1>
</section>
```

The hydration marker is already visually hidden, but the toolbar and `h1` remain visible product chrome that did not exist in the old React page. The toolbar also adds a 16px bottom margin before the editor layout.

## Decision

Remove the visible Playground toolbar and heading. Keep the hydration marker as a direct hidden probe under the page root so full-chain tests can still assert CSR hydration.

Update the hydration marker to `position: absolute` in addition to its existing 1px/hidden/transparent styling so it does not add layout height before the editor.

## Non-Goals

- Do not change document title or `og:title`.
- Do not remove or rename `[data-id="playground-hydrated"]`.
- Do not change Monaco loading, editor-ready marker, welcome modal, Preview action, docs link, invalid JSON state, or SRK preview rendering.
- Do not change route render method.

## Test Strategy

Extend the existing Playground full-chain route test that verifies hydration and bundled preview:

- assert the page still has title `Playground | RankLand`;
- assert `[data-id="playground-hydrated"]` still has text `hydrated`;
- assert the hydration marker computes to `position: absolute`, `width: 1px`, `height: 1px`, hidden overflow, transparent text;
- assert `.playground-toolbar` is absent;
- assert there is no visible page-level heading named `Playground`.

Follow TDD: the focused Playground test must fail before implementation because the toolbar and heading still exist and the marker is still `position: static`, then pass after the template/CSS change.

## Acceptance Criteria

- `/playground` no longer shows a page-level `Playground` heading above the editor.
- Hydration marker remains Playwright-readable and layout-hidden.
- Focused Playground full-chain RED/GREEN is recorded.
- Full migration gate passes.
- Migration status, manual acceptance checklist, and final integration review mention the restored no-toolbar Playground chrome.
