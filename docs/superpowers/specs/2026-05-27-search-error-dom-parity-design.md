# Search Error DOM Parity Design

## Context

The old React search page renders the ranklist initialization failure state as an outer spacing wrapper and an inner red-text message:

```tsx
<div className="mt-10">
  <div className="text-red-500">初始化榜单数据库失败，请刷新再试。</div>
</div>
```

The Vue migration currently keeps the same visible text, spacing, and color, but collapses `mt-10` and `text-red-500` onto the same `data-id="search-error"` node. This is functionally correct but not the same DOM/class contract as the old page.

## Decision

Restore the old two-level error DOM structure while preserving the stable test selector:

- keep `data-id="search-error"` on the outer error state wrapper;
- keep outer spacing as `search-state mt-10`;
- move `text-red-500` and the red color hook to an inner message node;
- preserve the existing text exactly;
- preserve current request behavior, empty/recent/result states, and Ant Design Vue search control behavior.

## Test Strategy

Add focused full-chain assertions to `tests/e2e/full-chain/search.spec.ts` before implementation:

- `data-id="search-error"` has `mt-10`;
- `data-id="search-error"` does not have `text-red-500`;
- an inner `.search-error-message.text-red-500` contains the legacy text;
- outer spacing remains `40px`;
- inner message color remains `rgb(239, 68, 68)`.

The RED run should fail on the missing inner `.search-error-message` and on the outer node still carrying `text-red-500`.

## Acceptance Criteria

- The focused search load-error full-chain test fails before implementation for the expected DOM/class mismatch.
- The focused search load-error full-chain test passes after implementation.
- The full migration gate passes:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

- Migration docs record this as verified search error DOM/class parity and update the remaining search product-polish decision.

## Non-Goals

- Do not change search query normalization, Fuse matching, recent-list behavior, route building, title metadata, or request behavior.
- Do not change the visual color/spacing values beyond moving the class to the old DOM level.
- Do not pursue broader Playground Monaco parity or SRK lower-level table pixel parity in this slice.
