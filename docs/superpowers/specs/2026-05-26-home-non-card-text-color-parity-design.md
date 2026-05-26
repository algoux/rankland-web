# Home Non-Card Text Color Parity Design

## Context

The old React home page at `rankland-fe/src/pages/index.tsx` renders hero, resource, contact, and about copy with Ant Design/global typography. It does not assign custom muted text colors to these non-card paragraphs or list rows.

The Vue home page currently hard-codes `#3f4a56` for `.home-hero p`, `.home-section p`, and `.home-section li`, and `#8a96a3` for `.home-separator`. That diverges from the restored app-shell legacy text tokens in dark mode, where normal body text should be `rgba(255, 255, 255, 0.85)`.

## Goal

Restore old Ant Design text color parity for homepage non-card copy while preserving the already verified Ant Design Vue Card dark styling.

## Scope

- Update the full-chain home E2E test to assert dark-mode non-card text color for:
  - the hero paragraph;
  - a resource list item;
  - the about section separator.
- Update `src/client/modules/home/home.view.vue` so non-card paragraphs, list rows, and the separator use the shared legacy text color token/inheritance instead of custom muted colors.
- Update migration docs after verification.

## Non-Goals

- Do not redesign home spacing, typography size, or card layout.
- Do not change Ant Design Vue Card global token overrides.
- Do not change route metadata, generated routers, API fixtures, or SEO JSON-LD.

## Design

Use the existing `--rankland-legacy-text-color` CSS variable that is defined globally in `src/client/index.less` for light and dark mode. The home page should keep its local spacing and line-height rules, but remove the product-specific muted color from text elements that were plain Ant Design/global text in the old React page.

Cards remain isolated by the existing `.home-card h2`, `.home-card p`, and `.home-card em` inheritance rules plus the global `.home-card.ant-card` token override.

## Test Strategy

Follow TDD:

1. Add dark-mode assertions to `tests/e2e/full-chain/home.spec.ts`.
2. Run the focused full-chain home test and confirm RED fails with the current hard-coded colors.
3. Apply the minimal CSS change.
4. Run the focused home test, then the full home full-chain spec, then the migration gate.

## Acceptance Criteria

- In forced dark mode, the homepage hero paragraph, resource list copy, and about separator compute to `rgba(255, 255, 255, 0.85)`.
- The recommendation card dark background, border, radius, and inherited text assertions continue to pass.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.

## Risks

- Scoped CSS specificity can affect card paragraphs because `.home-section p` also matches text inside cards. Keep the existing `.home-card p { color: inherit; }` rule after the section rule so card text still follows the Ant Design Card root color.
