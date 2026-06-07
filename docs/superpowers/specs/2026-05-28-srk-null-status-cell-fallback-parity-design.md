# SRK Null Status Cell Fallback Parity Design

## Goal

Restore old React low-level SRK table behavior for legal empty problem statuses (`result: null`) by rendering the problem alias/title/index in the table cell instead of an empty cell.

## Old React Baseline

`@algoux/standard-ranklist-renderer-component-react@0.5.1` renders `StatusCell` fallback statuses with:

```tsx
return <td>{problemKey}</td>;
```

`problemKey` resolves as `problem.alias || resolveText(problem.title) || problemIndex`. Because `RankProblemStatus.result` can be `null`, this fallback is product-visible for unsolved cells.

## Current Vue Gap

`@algoux/standard-ranklist-renderer-component-vue@0.5.1` renders the same fallback branch as an empty hoisted `<td>`:

```js
createElementBlock("td", _hoisted_1$2)
```

That makes legal unsolved cells visually blank, while old React displayed the problem alias.

## Design

Use the existing `Ranklist` `status-cell` slot in `src/client/components/rankland-ranklist.vue` and provide a local `RanklandStatusCell` component. The local component mirrors the Vue package status-cell behavior for `FB`, `AC`, `RJ`, and `?`, but restores the old React fallback text for `result: null` and any other fallback status.

The slot keeps the package-provided `onClick` callback for status cells with solutions, so solution modal behavior and modal trigger tracking continue to flow through the renderer wrapper.

## Test Strategy

- Extend the full-chain mock server with a dedicated `null-status-key` ranklist info/file pair.
- The file variant keeps the standard fixture but changes Team Beta's Problem B status to `result: null`.
- Add a Ranklist full-chain test that opens `/ranklist/null-status-key?focus=yes`, locates Team Beta's final status cell, and asserts old React fallback text `B` plus no status-block class.

## Non-Goals

- Do not change static conversion, ranking, scoring, filters, or modal behavior.
- Do not fork or patch `node_modules`.
- Do not change the external renderer dependency versions.

## Acceptance Criteria

- Focused RED fails because the current Vue fallback status cell is empty.
- Focused GREEN passes with the null status cell rendering `B`.
- Existing accepted/rejected/frozen status styles and solution modal behavior remain covered by the existing Ranklist full-chain tests.
- Full migration gate passes before commit.
