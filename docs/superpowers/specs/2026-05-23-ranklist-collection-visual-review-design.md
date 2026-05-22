# Ranklist Collection Visual Review Design

## Context

Home and search now have desktop/mobile visual review. The next high-risk page pair is `/ranklist/:id` and `/collection/:id` because they render SRK tables, action controls, banners, filters, and collection navigation.

## Goal

Add focused visual/layout review for ranklist and collection routes.

## Scope

- Capture desktop and mobile screenshots for `/ranklist/test-key?focus=yes`.
- Capture desktop and mobile screenshots for `/collection/official?rankId=test-key`.
- Assert the document itself does not create horizontal page overflow.
- Assert key controls and panels remain inside viewport bounds.
- Assert the SRK table container is visible and usable.

## Non-Goals

- Pixel snapshot comparison.
- Solving exact `StyledRanklistRenderer` visual parity.
- Full table column fitting inside a narrow mobile viewport; SRK tables may intentionally scroll horizontally inside their renderer.
- Collection category icon parity.

## Architecture

Extend the existing full-chain specs locally with layout helpers and screenshots. Keep the checks to page-level overflow and key wrapper controls rather than individual table cells, so legitimate SRK internal horizontal scrolling is not treated as a page failure.

## Acceptance Criteria

- Ranklist desktop/mobile screenshots are produced.
- Collection desktop/mobile screenshots are produced.
- Page-level horizontal overflow is not present.
- Ranklist header/actions/footer and collection nav/panel wrappers stay within the viewport.
- Existing route behavior remains covered by the existing assertions.
