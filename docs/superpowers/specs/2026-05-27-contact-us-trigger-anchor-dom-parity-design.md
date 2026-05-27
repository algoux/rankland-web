# ContactUs trigger anchor DOM parity design

## Context

Old React `ContactUs` renders an outer clickable `span` and preserves the caller-provided children. The Home page passes `<a>与我们联系</a>`, and the SRK footer passes `<a>联系我们</a>`. Those anchors have no `href`; click handling is on the wrapper `span`.

The migrated Vue `ContactUs` currently renders its own `<button>` trigger around slot text. That keeps the modal usable, but changes the public DOM and the link-like markup used by the old React surfaces.

## Scope

- Restore old trigger DOM on the Home contact paragraph and SRK footer contact prompt:
  - `ContactUs` root remains a `span`.
  - The clickable handler lives on that wrapper span.
  - Callers pass an `<a>` trigger without `href`.
- Preserve existing stable E2E selector `data-id="contact-us-trigger"` and `.contact-us-trigger` styling hook on the anchor.
- Preserve Ant Design Vue modal behavior, title, close affordance, email link, QQ image, `w-full` class, dark modal styling, and click-to-open behavior.

## Non-goals

- Do not replace Ant Design Vue Modal or change contact body copy.
- Do not change footer package/project links, beian links, or unrelated home resource links.
- Do not introduce navigation for the no-`href` trigger anchors.

## Test strategy

- Extend Home full-chain coverage to assert the contact trigger is an `a` element without `href`.
- Extend ranklist full-chain coverage to assert the footer contact trigger is an `a` element without `href`.
- Run focused RED before implementation.
- Run focused GREEN after implementation.
- Run the full migration gate before commit.

## Acceptance criteria

- Home and SRK footer contact triggers match old React anchor DOM while remaining clickable.
- Existing contact modal content and close behavior continue to pass.
- Full migration gate passes.
