# Collection Nav Legacy Chrome Parity Design

## Context

The old React collection page renders the collection shell with legacy class names and color tokens:

- Navigation wrapper: `.srk-collection-nav`
- Hidden header wrapper: `.srk-collection-hidden-header`
- Hidden header title: `<h3 className="mb-0">榜单合集</h3>`
- Light nav background: `#f4f4f4`
- Dark nav background: `#111111`
- Dark nav border color: `rgba(67, 67, 67)`

The Vue page already restores the collection route, menu behavior, collapse behavior, selected ranklist rendering, and route spacing. It still uses a renamed hidden header class and `h2`, and the nav background is `#f7f7f7` without the old dark override.

## Goal

Restore the collection page's legacy navigation chrome without changing data loading, menu selection, ranklist rendering, or collapse behavior.

## Scope

- Add full-chain coverage for the legacy hidden-header DOM and nav color tokens.
- Restore the old hidden header wrapper class while keeping existing selectors stable if needed.
- Render the hidden header title as `h3.mb-0`.
- Use the old light and dark navigation background/border values.

## Non-Goals

- Do not change collection async data, invalid `rankId` cleanup, selected-ranklist switching, or menu item generation.
- Do not alter the verified width, remaining-height, or mobile collapse contract.
- Do not pursue broader SRK table pixel parity in this slice.

## Test Strategy

Extend `tests/e2e/full-chain/collection.spec.ts` with a focused assertion in the existing Ant Design collection menu test:

- `.srk-collection-hidden-header` exists and is visible.
- `.srk-collection-hidden-header h3.mb-0` has text `榜单合集`.
- light mode `[data-id="collection-nav"]` background is `rgb(244, 244, 244)`.
- after switching Playwright media emulation to dark mode and waiting for App.vue to sync `html.dark`, nav background is `rgb(17, 17, 17)` and border-right color is `rgb(67, 67, 67)`.

The focused test must fail before implementation and pass after the template/style change.

## Acceptance Criteria

- Focused collection full-chain RED/GREEN is captured.
- Full migration gate passes.
- Migration dashboard/checklist/final review mention the collection nav legacy chrome parity slice.
- Slice is committed with a Chinese Conventional Commit message.
