# Home Legacy Block DOM Parity Design

## Context

The old React home page renders each content group inside `div.block` under `div.home-intro`. The legacy stylesheet applies the home block spacing through `.home-intro .block`, with `.block-title` spacing nested underneath it.

The migrated Vue home page already restores the outer `main.normal-content` and `.home-intro` wrapper, and it reproduces the old spacing through `.home-section`. The remaining DOM gap is that content groups are still rendered as `section.home-section` without the old `block` class.

## Decision

Restore the old block node shape while preserving the migrated Vue test and style hooks:

- render each non-hero home content group as `div`;
- include both `block` and `home-section` classes on those nodes;
- keep all existing `data-id` selectors;
- keep existing `.home-section` scoped styles so visual spacing and color contracts do not drift.

This makes the DOM closer to `rankland-fe` while keeping current migration-specific selectors stable.

## Non-goals

- Do not remove existing `home-section` styling hooks.
- Do not change hero layout, content copy, card layout, statistics rendering, SEO metadata, API behavior, or hydration markers.
- Do not touch generated router files.

## Test Strategy

Add a full-chain DOM probe for the five legacy home content blocks:

- `home-recommendations`
- `home-tools`
- `home-resources`
- `home-contact`
- `home-about`

For each block, assert:

- it is a `DIV`;
- its class list includes `block`;
- its class list still includes `home-section`;
- its parent is `[data-id="home-intro"]`.

Verify RED before implementation, then verify GREEN with the same focused full-chain test, the complete home full-chain file, and the full migration gate.

## Acceptance Criteria

- The focused full-chain test fails before implementation because home blocks are not legacy `div.block` nodes.
- The focused full-chain test passes after implementation.
- The complete home full-chain file remains green.
- `corepack pnpm test:migration` remains green.
- Migration docs record the restored block DOM contract.

## Risks

Changing `section` to `div` restores the old React DOM but removes semantic sectioning from these nodes. The old frontend used `div.block`, and all headings/content remain unchanged, so this is intentional for migration parity.
