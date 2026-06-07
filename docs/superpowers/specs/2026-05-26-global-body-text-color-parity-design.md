# Global Body Text Color Parity Design

## Slice

Restore the old React Ant Design global `body` text color in the Vue app shell for both light and dark themes.

## Source Behavior

The old React app ships Ant Design theme CSS from `rankland-fe/src/styles/antd.light.css` and `rankland-fe/src/styles/antd.dark.css`.

- Light theme `body` text color: `rgba(0, 0, 0, 0.85)`
- Dark theme `body` text color: `rgba(255, 255, 255, 0.85)`

The old theme also defines body font, line height, and background colors. This slice intentionally restores only the global text color because the Vue app shell already has verified legacy light background behavior and has separate route-specific layout decisions.

## Target Gap

`src/client/index.less` currently overrides theme body text color with Vue-specific values:

- Light: `#17202a`
- Dark: `#e6edf5`

Earlier parity slices introduced `--rankland-legacy-text-color` and applied it to targeted SRK header and modal text. The global `body` still diverges, so inherited app-shell and route text can remain visually off from old Ant Design.

## Decision

Reuse the existing `--rankland-legacy-text-color` custom property as the single theme-specific body text color source.

- Keep the initial `body` fallback aligned with old light Ant Design: `rgba(0, 0, 0, 0.85)`.
- Set `html.light body` color to `var(--rankland-legacy-text-color)`.
- Set `html.dark body` color to `var(--rankland-legacy-text-color)`.
- Do not change background, font-family, font-size, line-height, or component-local color rules in this slice.

## Test Strategy

Add full-chain app-shell coverage to the existing system theme sync test:

- Start under mocked dark system theme and assert `body` computed `color` is `rgba(255, 255, 255, 0.85)`.
- Toggle the E2E theme hook to light and assert `body` computed `color` is `rgba(0, 0, 0, 0.85)`.
- Keep the existing light background assertion to ensure this slice does not regress the verified shell background behavior.

## Acceptance Criteria

- The new app-shell full-chain assertion fails before the CSS fix for the expected color mismatch.
- The focused app-shell test passes after the CSS fix.
- The full app-shell full-chain spec passes.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- Migration dashboard and final review docs record the restored global body text color parity.

## Known Risks

Changing global body text color can affect inherited text on pages that do not set a local color. This is intended for old Ant Design parity. Hard-coded component colors such as `#17202a` remain separate route-polish candidates and are not changed here.
