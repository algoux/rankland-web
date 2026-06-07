# SRK Asset Image Error Parity Design

## Context

The old React SRK wrapper renders contest banners and user photos through `SrkAssetImage`:

```tsx
<img
  src={src}
  style={hidden ? { ...style, display: 'none' } : style}
  onError={handleError}
/>
```

When an SRK asset URL fails to load, the old component hides the broken image and resets that hidden state when the source changes. The current Vue SRK wrapper renders the contest banner and user photo as plain `<img>` elements, so a failed asset leaves a browser broken-image placeholder in the product UI.

## Decision

Create a small Vue `srk-asset-image.vue` component that mirrors the old React behavior:

- accept a resolved `src`, optional `alt`, and optional `imgClass`;
- render an `<img>` with the existing attributes and class tokens;
- set `display: none` after the native image `error` event;
- reset the hidden state whenever `src` changes.

Use this component only for the shared SRK wrapper's contest banner and user-modal photo in this slice. Keep `formatSrkAssetUrl`, existing `data-id` selectors, old class tokens, alt text, and current CSS width/max-size rules unchanged.

## Test Strategy

Add full-chain coverage in the existing `/ranklist/:id` scenario using Playwright route interception:

- intercept `**/srk-assets/test-key/banner.png` with `404`;
- load `/ranklist/test-key?focus=yes`;
- assert `[data-id="rankland-ranklist-banner"]` still exists but has computed `display: none`.

In the same scenario, intercept `**/srk-assets/test-key/team-alpha.png` with `404`, open the user modal, and assert `[data-id="rankland-user-modal-photo"]` has computed `display: none`.

The focused RED should fail because the current Vue `<img>` elements do not hide themselves on `error`. The focused GREEN should pass after switching banner and photo to the Vue asset-image component.

## Acceptance Criteria

- Broken SRK contest banner images are hidden after image load failure.
- Broken SRK user photo images are hidden after image load failure.
- Existing banner/photo `data-id`, classes, alt text, asset URL rewriting, and sizing assertions remain valid.
- Focused full-chain RED/GREEN is recorded.
- The full migration gate passes: `gen:client-router`, `test:migration`, and `git diff --check`.

## Non-Goals

- Do not change how SRK asset URLs are generated.
- Do not add fallback images or placeholders.
- Do not change the low-level `@algoux/standard-ranklist-renderer-component-vue` image behavior.
- Do not alter normal successful image rendering.
