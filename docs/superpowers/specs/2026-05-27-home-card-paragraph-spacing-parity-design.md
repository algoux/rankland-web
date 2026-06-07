# Home Card Paragraph Spacing Parity Design

## Context

The old React home page renders every recommendation/tool card body paragraph with `className="mt-4 mb-0"`. That gives the card description a 16px top margin and no bottom margin while keeping the DOM class contract visible.

The migrated Vue home page currently approximates this with scoped `.home-card p { margin: 0; }` plus heading margin. It preserves the general layout, but the old paragraph class and exact utility spacing are missing.

## Decision

Restore the old card paragraph class and spacing while keeping the current Ant Design Vue Card structure:

- add `class="mt-4 mb-0"` to the four home card description paragraphs;
- make `.home-card p` compute to `margin-top: 16px` and `margin-bottom: 0`;
- preserve the existing `home-card`, `home-card-title`, icon, logo, statistics, and link selectors.

## Non-goals

- Do not change card titles, icons, links, card layout, statistics rendering, or API behavior.
- Do not replace Ant Design Vue Card/Row/Col.
- Do not touch generated router files.

## Test Strategy

Extend the home full-chain test with a DOM/presentation probe for the four card paragraphs:

- search recommendation;
- collection recommendation;
- paste.then.ac tool;
- Algo Bootstrap tool.

For each paragraph, assert:

- its class list includes `mt-4` and `mb-0`;
- `margin-top` computes to `16px`;
- `margin-bottom` computes to `0px`.

Verify RED before implementation, then verify GREEN with the same focused full-chain test, the complete home full-chain file, and the full migration gate.

## Acceptance Criteria

- The focused full-chain test fails before implementation because card paragraphs lack the old utility classes/spacing.
- The focused full-chain test passes after implementation.
- The complete home full-chain file remains green.
- `corepack pnpm test:migration` remains green.
- Migration docs record the restored card paragraph class/spacing contract.

## Risks

Changing paragraph spacing can slightly affect card body height. The old React page used `mt-4 mb-0`, so the 16px top margin is intentional for product parity. Existing viewport and card layout full-chain assertions should catch layout regressions.
