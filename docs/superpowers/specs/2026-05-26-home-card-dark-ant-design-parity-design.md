# Home Card Dark Ant Design Parity Design

## Slice

Restore old React Ant Design Card dark-theme styling for the home recommendation and tool cards.

## Source Behavior

The old React home page in `rankland-fe/src/pages/index.tsx` renders recommendation and tool entries with Ant Design `Card`.

Old Ant Design theme CSS defines:

- Light `.ant-card`: background `#fff`, border `#f0f0f0`, text `rgba(0, 0, 0, 0.85)`, radius `2px`.
- Dark `.ant-card`: background `#141414`, border `#303030`, text `rgba(255, 255, 255, 0.85)`, radius `2px`.
- Card body padding: `24px`.
- Card headings inherit old Ant Design heading color: light `rgba(0, 0, 0, 0.85)`, dark `rgba(255, 255, 255, 0.85)`.

## Target Gap

`src/client/modules/home/home.view.vue` already uses Ant Design Vue `a-card`, but the local home card styles hard-code light text colors:

- `.home-card h2 { color: #17202a; }`
- `.home-card p { color: #3f4a56; }`
- `.home-card em { color: #17202a; }`

Ant Design Vue is not globally themed for dark mode in this app, so the home cards can remain light-colored under `html.dark`, diverging from the old React Ant Design dark card surface and inherited text.

## Decision

Apply a legacy card token patch to the unique `.home-card.ant-card` class used by the home route.

- Preserve existing `a-card` DOM and Ant Design Vue usage.
- Keep existing card body min-height and icon/logo spacing.
- Add light/dark `.home-card.ant-card` token rules for background, border, text color, and radius in the global stylesheet so they reliably hit the Ant Design Vue component root.
- Change `.home-card h2`, `.home-card p`, and `.home-card em` to inherit the card text color instead of forcing Vue-specific light colors.
- Do not alter non-card home sections in this slice.

## Test Strategy

Use the existing home full-chain test, which already forces dark system theme for the primary SSR/hydration path.

Add assertions for a visible home card:

- `.home-card.ant-card` background-color is `rgb(20, 20, 20)`.
- `.home-card.ant-card-bordered` border-top-color is `rgb(48, 48, 48)`.
- `.home-card.ant-card` border-radius is `2px`.
- `.home-card.ant-card` color is `rgba(255, 255, 255, 0.85)`.
- `.home-card h2` color is `rgba(255, 255, 255, 0.85)`.
- `.home-card p` color is `rgba(255, 255, 255, 0.85)`.

The assertions should fail before implementation because the current card surface and/or local text rules are light-theme values.

## Acceptance Criteria

- The focused home full-chain test fails before implementation for the expected card dark-style mismatch.
- The focused home full-chain test passes after implementation.
- The full home full-chain spec passes.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- Migration docs record home card dark Ant Design parity and the latest gate result.

## Risks

This slice intentionally restores card-level dark styling without introducing a global Ant Design Vue theme provider. The `.home-card` class is unique to the home route. Other Ant Design Vue components may still require dedicated parity slices when a concrete visual gap is identified.
