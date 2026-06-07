# Ranklist Footer Beian Parity Design

## Goal

Restore the old React ranklist footer beian line in the Vue SRK wrapper for the China site alias.

## Old React Baseline

`rankland-fe/src/components/StyledRanklistRenderer.tsx` renders a footer when `showFooter` is enabled. The footer includes copyright, GitHub, Standard Ranklist, collection contribution, contact, and for `process.env.SITE_ALIAS === 'cnn'` an extra line:

```tsx
{process.env.SITE_ALIAS === 'cnn' && (
  <p className="mt-1 mb-0">
    备案号：
    <BeianLink />
  </p>
)}
```

`BeianLink` links to `https://beian.miit.gov.cn/` and displays `process.env.BEIAN || ''`.

## Current Vue Gap

`src/client/modules/home/home.view.vue` already implements the old beian behavior for the home footer, but `src/client/components/rankland-ranklist.vue` omits the beian line from the shared ranklist footer. That affects `/ranklist/:id`, `/collection/:id`, and `/live/:id` whenever they render `showFooter`.

## Scope

- Add a small footer-site helper so the beian environment rule can be tested without mounting the large SRK wrapper.
- Add unit coverage for:
  - `RANKLAND_SITE_ALIAS=cnn` taking precedence and showing the configured `BEIAN` text.
  - legacy `SITE_ALIAS=cnn` showing the configured `BEIAN` text.
  - non-`cnn` aliases hiding the line.
- Render the conditional beian line in `rankland-ranklist.vue` with stable `data-id`s.
- Add full-chain coverage that the default non-`cnn` fixture footer still does not render the beian line.
- Update migration status after verification.

## Non-Goals

- Do not change the home page footer.
- Do not change app shell site switching or canonical URL behavior.
- Do not force the full-chain dev server to run as the China site alias.
- Do not change footer copy, layout, or link targets beyond restoring the missing beian line.

## Test Strategy

Use unit tests for the environment-dependent beian rule, because full-chain runs one dev server with a fixed default alias and should keep covering the default non-`cnn` path. Use the existing ranklist full-chain test to assert the default footer does not show a stale beian line.

## Acceptance Criteria

- The new unit test fails before implementation because the helper does not exist.
- The unit test passes after implementation.
- Focused ranklist full-chain test passes and confirms no default beian line leak.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records this verified slice.
