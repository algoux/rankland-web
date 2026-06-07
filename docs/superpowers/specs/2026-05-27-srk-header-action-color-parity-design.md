# SRK Header Action Color Parity Design

## Context

The old React `StyledRanklistRenderer` renders the SRK header export and share triggers as plain anchor elements:

- the export trigger wraps `DownloadOutlined` in an `<a>`;
- the share trigger wraps `ShareAltOutlined` in an `<a>`;
- both anchors live in the same header meta row as the old view-count metadata.

Those anchors inherit the old RankLand link primary color: light theme `#ff8104` and dark theme `#f6ac06`. Their hover color follows the same old link hover tokens.

The current Vue wrapper uses Ant Design Vue `a-button` triggers for the same dropdowns. The wrapper already resets padding, borders, radius, and background, but it does not restore the old anchor link color, so the icons can fall back to Ant button text color instead of the legacy primary link color.

## Decision

Restore the old anchor-like color treatment for the shared SRK header action triggers:

- export and share trigger icons use `var(--rankland-link-color)` in normal state;
- hover and focus use `var(--rankland-link-hover-color)`;
- transparent background, zero radius, separator border, dropdown behavior, menu contents, and export/share actions stay unchanged.

## Tests

Extend the existing `/ranklist/:id` full-chain route coverage because it already verifies the shared SRK header through SSR, hydration, API wiring, dropdown hover behavior, and mock backend data.

The test will assert:

- light theme export/share trigger color is `rgb(255, 129, 4)`;
- dark theme export/share trigger color is `rgb(246, 172, 6)`;
- the existing separator, icon, dropdown, export, share, and notification assertions continue to pass.

The focused full-chain test must fail before implementation because current Vue button triggers do not compute to the old link primary color.

## Non-Goals

- Do not change reference link or footer contact link colors; they are already covered.
- Do not change export/share menu item styling.
- Do not change low-level SRK table colors.

## Acceptance Criteria

- The focused ranklist full-chain test fails before implementation for the expected header action color mismatch.
- The focused test passes after implementation.
- The full migration gate passes.
- Migration docs record SRK header action icon color parity.
