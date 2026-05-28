# Hydration Probe Product Neutrality Parity Design

## Context

Old React public routes do not render visible hydration/debug probe nodes in the product DOM. The Vue migration keeps small `data-id="*-hydrated"` probes so full-chain tests can distinguish SSR/CSR and hydrated states.

Most current probes are visually minimized with `width: 1px`, `height: 1px`, `overflow: hidden`, and transparent text, but several public routes still leave the marker in normal document flow and expose it to the accessibility tree. Playground already moved its marker out of flow during earlier product chrome work, so the remaining route probes should follow the same product-neutral pattern.

## Goal

Make public route hydration/debug probes product-neutral while preserving their test contract:

- keep existing `data-id` selectors and text values for Playwright assertions;
- remove the hidden probe from normal layout flow with `position: absolute`;
- hide the probe from assistive technology with `aria-hidden="true"`.

## Approach

Apply the same marker treatment to Home, Search, Ranklist, Collection, Live, and Playground test probes:

- add `aria-hidden="true"` to each hydration marker;
- add `position: absolute` to public-route marker CSS that currently lacks it;
- add `aria-hidden="true"` to the Playground editor-ready marker because it is also a test-only readiness probe.

Do not remove markers, change their text, change route wrappers, change SSR/CSR hydration logic, change SRK renderer output, or regenerate route code for this slice.

## Testing

Extend existing full-chain route assertions so every public probe still reports `hydrated` or `ready`, remains 1px/transparent, is `position: absolute`, and has `aria-hidden="true"`.

Run a focused RED on one route before implementation to prove the new assertion catches the current gap, then run the full migration gate after implementation and docs updates.

## Acceptance Criteria

- Home, Search, Ranklist, Collection, Live, and Playground hydration markers remain Playwright-readable.
- All affected probes are out of normal layout flow.
- All affected probes are hidden from the accessibility tree.
- Existing route product assertions continue to pass.
- Full migration gate passes.
