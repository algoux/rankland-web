# App Shell Analytics Parity Design

## Goal

Restore the old React app shell's Google Analytics initialization and route pageview dispatch in the Vue app shell without adding React dependencies or browser-only SSR side effects.

## Source Behavior

Source references:

- `rankland-fe/src/layouts/index.tsx`
- `rankland-fe/.umirc.ts`

The old React layout:

- initializes `react-ga4` after layout mount with global `GTAG`;
- defines `GTAG` as `G-D4PSNCRQJC` when `SITE_ALIAS === 'cn'`, otherwise `G-D6CVTJBDZT`;
- sends `{ hitType: 'pageview', page }` 500 ms after the Umi location changes;
- builds `page` as `window.location.origin + location.pathname + location.search`;
- runs the side effect even when focus mode bypasses visible shell chrome.

## Target Behavior

The Vue app shell will:

- initialize Google Analytics only on the client after `App.vue` mounts;
- choose the GA tag from `process.env.RANKLAND_GTAG`, legacy `process.env.GTAG`, or the old site-alias fallback;
- create a normal `gtag` data-layer setup and append the Google tag script once per document;
- send a delayed pageview for the initial route and each distinct route `path + query` change;
- expose E2E-only analytics events when `RANKLAND_E2E_PROBE=1`, so full-chain tests can verify behavior while external calls are denied.

## Architecture

Add `src/client/app-analytics.ts` as a browser-safe helper module:

- pure helpers for tag selection and page URL construction;
- `initializeRanklandAnalytics()` for script/data-layer setup;
- `sendRanklandPageview()` for the old pageview payload and gtag call;
- `recordRanklandAnalyticsProbeEvent()` only when `RANKLAND_E2E_PROBE=1`.

Update `src/client/App.vue`:

- call analytics initialization in `mounted()`;
- schedule pageview dispatch with the legacy 500 ms delay;
- watch `$route.fullPath` for CSR navigation and ignore hash-only changes;
- clear pending timers on unmount.

Expose `RANKLAND_GTAG` and legacy `GTAG` in `vite.config.js` so deployments can override the tag without code changes.

## Test Strategy

Unit tests:

- tag fallback maps legacy `SITE_ALIAS=cn` to `G-D4PSNCRQJC`;
- non-`cn` aliases map to `G-D6CVTJBDZT`;
- explicit `RANKLAND_GTAG` and `GTAG` override the fallback;
- page URL helper strips hash and preserves query.

Config tests:

- Vite exposes `RANKLAND_GTAG` and `GTAG` inside bundled `process.env`.

Full-chain E2E:

- with external calls denied, `/search?kw=Analytics%202024` records one initialize event and one pageview for the absolute URL;
- CSR navigation through the app nav records a second pageview for the new route without a second initialize event.

## Non-Goals

- Do not add `react-ga4`.
- Do not add analytics events for modal opens, exports, filters, or buttons.
- Do not make GA calls during SSR.
- Do not change route metadata or generated router files.

## Known Risks

- The old `react-ga4` package may have sent additional internal gtag commands. This slice preserves the product contract that matters for parity: tag initialization and route pageview payloads.
- Full-chain tests intentionally deny external Google requests; the E2E probe verifies local dispatch intent rather than network delivery.
