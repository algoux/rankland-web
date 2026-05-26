# Live Header Action Conditional Separator Parity Design

## Context

The old React `StyledRanklistRenderer` makes the export trigger separator conditional on whether header `meta` exists:

```tsx
{meta && (
  <span className="mr-2">
    <EyeOutlined /> {meta.viewCnt || '-'}
  </span>
)}
<a className={`border-0 border-solid border-gray-400 mr-2 ${meta ? 'pl-2 border-l' : ''}`}>
  <Dropdown ...>
    <DownloadOutlined />
  </Dropdown>
</a>
<a className="pl-2 border-0 border-l border-solid border-gray-400">
  <Dropdown ...>
    <ShareAltOutlined />
  </Dropdown>
</a>
```

Standalone ranklist and collection selected-ranklist pass `meta`, so both export and share are separated from preceding header items. Live ranklists do not pass `meta`, so export is the first action and should not have the left divider, while share still has one.

The previous Vue slice restored separator styling for both header action triggers. That is correct for `meta` routes but over-applies the separator to live pages.

## Decision

Split header action styling into:

- a base trigger class that keeps the icon-link shape: transparent background, no border, no radius, no shadow, and no left padding;
- a separator class that adds old `pl-2 border-l` styling.

Apply the separator class to export only when `hasViewCount` is true. Always apply it to share.

## Scope

In scope:

- Shared `src/client/components/rankland-ranklist.vue` header action class binding.
- Full-chain `/live/:id` coverage for the no-`meta` header action contract.
- Migration dashboard updates.

Out of scope:

- Ranklist and collection `meta` route behavior except preserving existing green coverage.
- Export/share dropdown contents and actions.
- View-count content and icon behavior.

## Test Strategy

Extend `tests/e2e/full-chain/live.spec.ts` to read computed styles from the live page header action triggers:

- export trigger: `paddingLeft: 0px`, `borderLeftWidth: 0px`, `borderRadius: 0px`;
- share trigger: `paddingLeft: 8px`, `borderLeftWidth: 1px`, `borderRadius: 0px`.

The RED failure should show live export currently has the separator.

## Acceptance Criteria

- Focused live full-chain test fails before implementation for the over-applied export separator.
- Focused live full-chain test passes after implementation.
- Existing ranklist full-chain header action separator coverage stays green.
- Required gates pass: `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check`.
- `docs/migration/status.md` records conditional live header action separator parity.
