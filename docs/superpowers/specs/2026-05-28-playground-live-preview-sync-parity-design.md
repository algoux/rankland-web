# Playground Live Preview Sync Parity Design

## Context

Old React `SrkPlayground` keeps `code` as the single source of truth. Monaco `onChange` calls a throttled `setCode(code || '')`, and each render recomputes `syntaxValid` and parsed `data` from `code`. As a result, valid edited SRK JSON updates the preview after the 250 ms throttle; `Ctrl/Cmd + S` remains visible in the invalid prompt but is not the only path for a valid preview refresh.

The Vue playground currently separates `draftSource` from `parseState`. Monaco `@change` updates only `draftSource`, while `parseState` changes only through `previewSource()` or the E2E preview hook. This means a normal product edit can leave the visible preview stale until `Ctrl/Cmd + S`.

## Goal

Restore old React live preview behavior for `/playground`: a normal Monaco `@change` should update both `draftSource` and `parseState` after the existing 250 ms throttle, so valid SRK JSON previews without requiring `Ctrl/Cmd + S`.

## Approach

Create a small `syncPlaygroundPreviewSource(source)` helper beside the playground parser. It returns the normalized `draftSource` and the parsed `parseState` from the same source string. Use that helper in:

- the throttled Monaco `@change` path;
- `previewSource()`, so the keyboard shortcut and live-change paths share the same state transition;
- the E2E hook, preserving the current stable test path without depending on synthetic Monaco editing.

Do not change Monaco package versions, editor options, preview DOM, SRK renderer behavior, route metadata, or generated router output.

## Testing

Add a unit test that proves the helper updates draft and parsed preview state from the same valid changed source, and reports invalid state for malformed input. Add a source guard that verifies `playground.view.vue` imports and uses the helper in the throttled live-change path and `previewSource()`.

Synthetic Monaco editing remains deferred because the full-chain harness already documents `editor.setValue()` hangs in Vite 2. This slice verifies the product event handler wiring without introducing a flaky browser interaction.

## Acceptance Criteria

- Normal Monaco `@change` path assigns both `draftSource` and `parseState` from the changed value.
- `Ctrl/Cmd + S` continues to sync from the editor and uses the same parsing transition.
- Invalid JSON still renders the existing invalid prompt path.
- Focused unit test passes after failing before implementation.
- Full migration gate passes.
