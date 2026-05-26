# Live Scroll Toggle Spacing Parity Design

## Context

The old React live page renders the scroll-solution control as an inline-flex label. The text span uses Tailwind `mr-1`, which gives the text-to-switch spacing 4px.

The Vue live page renders the same Ant Design Vue small switch, but the wrapper currently uses `gap: 8px`. That makes the live control looser than the old React control.

## Goal

Restore the old live scroll-solution toggle spacing while preserving the existing Ant Design Vue Switch, query behavior, WebSocket lifecycle, and mobile hiding behavior.

## Non-Goals

- Do not change scroll-solution query semantics.
- Do not change WebSocket setup, reconnect, or close behavior.
- Do not change the Toastify-style realtime event panel.
- Do not alter mobile hiding behavior.

## Design

Change `.live-scroll-toggle` spacing from 8px to 4px. The Vue wrapper can continue using flex `gap`; matching the old visual spacing is the product contract for this slice.

## Test Strategy

Extend the existing `/live/:id` full-chain hydration test to assert `.live-scroll-toggle` computes `column-gap: 4px`.

The test should fail before implementation because the current Vue CSS computes the gap as 8px.

## Acceptance Criteria

- Focused live full-chain test fails before implementation for the 8px spacing.
- Focused live full-chain test passes after the minimal CSS change.
- Full migration gate passes:
  - `corepack pnpm run gen:client-router`
  - `corepack pnpm test:migration`
  - `git diff --check`
- Migration status, manual checklist, and final integration review reflect the verified slice.

## Risks

The old implementation used child margin while the Vue implementation uses flex gap. This keeps DOM simpler while restoring the same 4px visible spacing.
