# Search Enter Button Icon Parity Design

## Context

The old React `/search` page renders the search box with Ant Design v4 default enter button behavior:

```tsx
<Input.Search
  defaultValue={kw || ''}
  placeholder="输入关键词搜索"
  onSearch={onSearch}
  enterButton
  allowClear
/>
```

Because `enterButton` is boolean, Ant Design renders its default primary search button with `SearchOutlined` and no custom "搜索" text.

The current Vue page uses Ant Design Vue `a-input-search`, but overrides `#enterButton` with a custom primary button containing the text `搜索`. That makes the button product surface differ from the old React default button.

Ant Design Vue's `a-input-search` has equivalent boolean `enter-button` behavior. Its implementation creates a default `.ant-input-search-button` and uses `SearchOutlined` when the prop is boolean.

## Decision

Restore the old default Ant Design search enter button:

- use the boolean `enter-button` prop on `a-input-search`;
- remove the custom `#enterButton` slot and visible "搜索" label;
- keep `allow-clear`, `placeholder`, `@search`, route updates, and result/recent rendering unchanged.

## Tests

Extend the existing `/search` full-chain tests:

- assert the Ant Design search input still renders with a primary `.ant-input-search-button`;
- assert the button contains `.anticon-search`;
- assert the button does not contain visible custom text;
- update viewport checks to target the Ant Design button class instead of the removed custom `data-id`.

The focused full-chain test must fail before implementation because the current custom button has no search icon and includes the text `搜索`.

## Non-Goals

- Do not change search keyword normalization or routing.
- Do not change result/recent list rendering.
- Do not change loading or error states.

## Acceptance Criteria

- The focused search full-chain test fails before implementation for the expected search button icon/text mismatch.
- The focused test passes after implementation.
- The full migration gate passes.
- Migration docs record search enter-button icon parity.
