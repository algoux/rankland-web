# Ranklist Header Action Status Removal Parity Design

## Context

Old `rankland-fe/src/components/StyledRanklistRenderer.tsx` handles SRK export actions by triggering downloads through `FileSaver` or converter `convertAndWrite()` calls. Successful exports do not render an inline status message in the header. Old share-copy success does use Ant Design `notification.success`, which is already restored in Vue.

The Vue migration still keeps a header-local `actionStatus` string and renders:

```vue
<span data-id="rankland-ranklist-action-status" class="rankland-ranklist-action-status">
  {{ actionStatus }}
</span>
```

Export actions set visible messages such as `SRK 已导出`, `Gym Ghost 已导出`, `VJudge Replay 已导出`, and `Excel 已导出`. This creates product text that old React did not show.

## Scope

- `src/client/components/rankland-ranklist.vue`
  - Remove the `rankland-ranklist-action-status` header node.
  - Remove `actionStatus` from component state and reset logic.
  - Remove export success/failure assignments that only fed the header inline status.
  - Keep share-copy success `notification.success`.
  - Leave clipboard failure without an inline status, matching old React's no product feedback path.
- `tests/e2e/full-chain/ranklist.spec.ts`
  - Replace export status assertions with assertions that no `rankland-ranklist-action-status` node is emitted after SRK, Gym Ghost, VJudge Replay, and Excel exports.
- `tests/e2e/full-chain/live.spec.ts`
  - Replace the live Gym Ghost status assertion with a no-`rankland-ranklist-action-status` assertion.
- Migration docs record the verified slice and keep lower-level SRK table pixel parity product-review-driven.

## Non-Goals

- Do not change export file names, generated content, lazy converter imports, or download triggering.
- Do not change share menu copy behavior, clipboard text, embed code, or Ant Design notification success feedback.
- Do not change header action anchor DOM/class parity.
- Do not pursue lower-level SRK table pixel parity in this slice.

## Test Strategy

Use full-chain Playwright because the gap is browser-visible runtime DOM after clicking export menu actions.

RED:

- Update Ranklist and Live export tests to expect `[data-id="rankland-ranklist-action-status"]` count `0` after export actions.
- Focused Ranklist and Live tests must fail because current Vue renders the inline status span after export clicks.

GREEN:

- Remove the status node and state assignments.
- Re-run focused Ranklist and Live tests.
- Run full Ranklist and Live full-chain files to cover downloads, share notification, modal, filtering, realtime, and viewport behavior.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- Ranklist metadata path export actions still download SRK, Gym Ghost, VJudge Replay, and Excel files with existing filenames/content assertions.
- Live no-metadata path Gym Ghost export still downloads the expected file.
- Export actions do not render `rankland-ranklist-action-status`.
- Share-copy success still renders Ant Design notification messages.
- Full migration gate passes before commit.
