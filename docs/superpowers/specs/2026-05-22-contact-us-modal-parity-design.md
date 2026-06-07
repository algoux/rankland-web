# Contact Us Modal Parity Design

## Context

The old React `ContactUs` component is used by:

- `rankland-fe/src/pages/index.tsx`;
- `rankland-fe/src/components/StyledRanklistRenderer.tsx` footer.

It renders a clickable child and opens a modal titled `联系我们`. The modal contains:

- contact email link `mailto:algoux.org@gmail.com`;
- QQ group prompt;
- `rankland_qqgroup.jpg` image.

The Vue target currently renders a direct `mailto:` link on the home page and omits the professional hosting contact prompt from the RanklandRanklist footer.

## Goal

Restore the user-visible contact modal behavior in Vue without embedding React.

## Scope

- Add a shared Vue component at `src/client/components/contact-us.vue`.
- Copy the legacy QQ group image into `src/client/assets/rankland_qqgroup.jpg`.
- Replace the home page contact mailto link with a modal trigger.
- Add the old renderer footer contact prompt to `src/client/components/rankland-ranklist.vue`.
- Cover both home and ranklist footer entry points with full-chain Playwright tests.

## Non-Goals

- Exact Ant Design modal styling and animation.
- Site-wide contact entries outside known old React usage.
- Changing email address, QQ image, or footer copy.
- Adding analytics tracking for modal open events.

## Architecture

Use a small SSR-safe Vue component:

- trigger is a button styled as inline text link;
- modal body renders only while open;
- modal uses native `role="dialog"` and `aria-modal="true"`;
- close button and overlay click both close the modal;
- image import goes through Vite asset handling.

This avoids adding another UI dependency surface while preserving the old user-visible behavior.

## Test Strategy

Extend full-chain coverage:

- `/` opens the modal from `data-id="contact-us-trigger"` inside `home-contact`, exposes email and image, then closes it;
- `/ranklist/test-key?focus=yes` exposes the footer contact prompt, opens the same modal, and preserves existing ranklist route assertions.

The tests run through the real full-chain harness so SSR, hydration, route data, and asset bundling are exercised.

## Acceptance Criteria

- Home and ranklist footer contact triggers open the contact modal.
- Modal contains the legacy email and QQ image.
- Modal can be closed.
- Existing home and ranklist full-chain behavior still passes.
- No generated router outputs are edited.
