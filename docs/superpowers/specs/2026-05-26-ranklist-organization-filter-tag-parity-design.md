# Ranklist Organization Filter Tag Parity Design

## Context

The old React `StyledRanklistRenderer` renders the organization filter with Ant Design `Select` in multiple mode and sets:

- `maxTagCount={0}`
- `maxTagPlaceholder={(omittedValues) => \`已选择 ${omittedValues.length} 个\`}`
- width `160px`

The migrated Vue `rankland-ranklist.vue` already uses Ant Design Vue `a-select` and preserves filtering semantics, but it currently shows selected organization labels directly. That diverges from the old product behavior when one or more organizations are selected.

## Decision

Restore the old compact selected-state display for the shared SRK organization filter by configuring the Ant Design Vue select with:

- `:max-tag-count="0"`
- `:max-tag-placeholder="formatOrganizationSelectionPlaceholder"`

The placeholder method returns `已选择 N 个`, where `N` is the number of omitted selected values supplied by Ant Design Vue.

## Scope

In scope:

- `/ranklist/:id` shared ranklist filter display.
- Shared `rankland-ranklist.vue`, which also affects live, collection selected ranklists, and playground previews when `showFilter` is enabled.
- Full-chain coverage on `/ranklist/:id`, because the old source behavior and current deterministic fixture have two organizations.

Out of scope:

- Changing organization filter semantics.
- Changing marker or official-only filters.
- Changing select width, dropdown placement, or route layout.

## Test Strategy

Add full-chain Playwright coverage to the existing ranklist filter test:

1. Open `/ranklist/test-key?focus=yes`.
2. Select both `Org A` and `Org B`.
3. Assert the selected display inside `[data-id="rankland-ranklist-organization-filter"]` is `已选择 2 个`.
4. Reload and keep the existing single-organization, official-only, and marker filtering assertions unchanged.

The RED failure should show that the current Vue select displays concrete selected organization tags instead of the compact old placeholder.

## Acceptance Criteria

- The organization filter uses Ant Design Vue and still filters rows by selected organizations.
- Selecting two organizations displays `已选择 2 个` inside the select control.
- Existing ranklist filter behavior stays green.
- Required gates pass: `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check`.
- `docs/migration/status.md` records the restored organization-filter tag parity.
