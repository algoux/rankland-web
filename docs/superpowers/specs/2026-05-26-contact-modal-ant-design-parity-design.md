# Contact Modal Ant Design Parity Design

## Slice

Restore the shared contact dialog to old React Ant Design Modal behavior while preserving the Vue trigger slot and existing contact content.

## Source Behavior

The old React frontend uses `rankland-fe/src/components/ContactUs.tsx`.

- Trigger: a wrapper `<span>` around caller-provided children.
- Dialog: Ant Design `Modal`.
- Title: `联系我们`.
- Footer: `null`.
- Content: email link, discussion group text, and QQ group image.

The old Ant Design theme CSS defines modal tokens:

- Light modal content/header background: `#fff`
- Dark modal content/header background: `#1f1f1f`
- Light title/header text: `rgba(0, 0, 0, 0.85)`
- Dark title/header text: `rgba(255, 255, 255, 0.85)`
- Light close color: `rgba(0, 0, 0, 0.45)` and hover `rgba(0, 0, 0, 0.75)`
- Dark close color: `rgba(255, 255, 255, 0.45)` and hover `rgba(255, 255, 255, 0.75)`
- Header padding: `16px 24px`
- Body padding: `24px`
- Radius: `2px`

## Target Gap

`src/client/components/contact-us.vue` currently implements a custom overlay and modal panel instead of Ant Design Vue. It also hard-codes a light modal surface and `#17202a` text color, so dark theme contact dialogs stay light and diverge from old Ant Design.

## Decision

Replace the custom dialog markup with `a-modal` from ant-design-vue.

- Keep the existing `data-id` selectors:
  - `contact-us-trigger`
  - `contact-us-dialog`
  - `contact-us-email`
  - `contact-us-qq-image`
  - `contact-us-close`
- Keep the trigger as a native button so keyboard/accessibility behavior remains explicit.
- Use `wrap-class-name="contact-us-modal-wrap"` to scope legacy modal styling.
- Use a custom close button in the `closeIcon` slot so existing tests and selectors can close the modal through `data-id="contact-us-close"`.
- Preserve the old content and image behavior.

## Non-Goals

- Do not change home or ranklist footer copy.
- Do not change email, QQ image asset, or trigger link colors.
- Do not introduce global Ant Design theme provider work in this slice.
- Do not change Playground or SRK user modal behavior.

## Test Strategy

Extend the existing home full-chain contact path because it already opens the shared contact dialog from the public home page.

Add computed style assertions after opening the dialog under the dark system-theme test environment:

- `.contact-us-modal-wrap .ant-modal-content` background is `rgb(31, 31, 31)`.
- `.contact-us-modal-wrap .ant-modal-title` color is `rgba(255, 255, 255, 0.85)`.
- `.contact-us-modal-wrap .ant-modal-close` color is `rgba(255, 255, 255, 0.45)`.
- `.contact-us-modal-wrap .ant-modal-body` padding is `24px`.
- `.contact-us-modal-wrap .ant-modal-content` border radius is `2px`.

The new assertions should fail before implementation because the current component does not render Ant Design modal classes and uses a custom white modal.

## Acceptance Criteria

- The focused home full-chain test fails before implementation for the expected missing Ant Design modal / wrong dark surface.
- The focused home full-chain test passes after implementation.
- Ranklist footer contact full-chain coverage still passes.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- Migration docs record contact modal Ant Design parity and the latest gate result.

## Risks

Ant Design Vue `a-modal` teleports content into `body`. Styling must be global or attached through `wrap-class-name`; scoped selectors alone are not enough. Existing `data-id` selectors must remain stable because home and ranklist full-chain tests use them.
