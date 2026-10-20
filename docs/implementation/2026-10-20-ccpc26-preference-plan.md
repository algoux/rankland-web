# ProgressBar patch release and Rankland integration

## Requested behavior

Publish the completed ProgressBar state customization as a patch release for all five
framework packages. Wait for the release workflow and public npm artifacts before
updating the sibling `rankland-web` repository.

In Rankland, use the newly published Vue dependency and its `timeMachine` slot. For
a ranklist declaring CCPC26, show the existing application Switch UI to the right
of the centered label, without affecting the label's center.

The switch represents a localStorage-backed user preference, defaulting to true.
It is independent of the effective renderer mode. Effective CCPC26 is the preference
AND the existing declaration/time/freeze eligibility. Crossing freeze boundaries,
dragging or exiting replay must never rewrite the saved preference. A false
preference disables CCPC26 presentation at every replay position and in live mode.

## Stages

- [x] Commit the scoped renderer change and five-package patch changeset.
- [x] Push, verify CI, inspect/merge the generated version PR, and verify npm publication.
- [x] After publication, update Rankland's Vue dependency and implement the saved preference.
- [x] Verify persistence, defaults, freeze boundaries, replay changes, modal/worker effects,
      SSR hydration, and desktop/mobile switch geometry.
- [x] Record the final integration design and results in Rankland.

## Scope

Preserve pre-existing demo data and unrelated CCPC26 documents in renderer, and
loadtest/docs/migration work in Rankland. No new branches or worktrees.
Renderer commit/push/release and Rankland implementation are authorized. The user
subsequently authorized committing and pushing the completed Rankland change;
no separate Rankland deployment is requested.

## Progress

- Renderer feature commit `1be0bb2d` pushed to `master`; five framework packages are
  planned for `0.7.3`, with core/styles unchanged.
- Full local `test:release` passed: all 428 framework/workspace tests, 14 release
  contract/SSR checks, and all builds.
- CI run `39438724140` passed for the pushed feature commit.
- Version PR #13 was inspected and merged after CI `39439127311` passed on its
  exact head `bf7413d4801e69c6e3516ce64e6903700e4f785f`; the merged master CI
  and npm publishing workflow then completed successfully.
- Read-only Rankland inspection selected existing `StyledRanklistSettings` JSON
  persistence and the existing shadcn-vue/radix-vue Switch. Add `preferCCPC26`, default
  true, and gate the existing computed mode without changing replay keys or Live
  SSR clock gates. Implementation was deferred until the npm artifacts were available.

- Release run `39439710096` succeeded on merge `61a85a30`. All five npm `0.7.3`
  tarballs were downloaded and checked against their registry integrity hashes.
  The Vue artifact required waiting for registry distribution after publish.
- Rankland implementation started only after artifact verification. The existing
  settings/renderer paths now support `preferCCPC26`.

- Installed the published Vue `0.7.3`; package/lock changes are limited to that
  dependency. 706 unit/SSR tests passed (21 existing environment-gated tests skipped),
  and client/SSR/server builds passed.
- Static review identified narrow desktop preview panes as well as mobile. The layout
  now uses the progress container width, with a 720px container-query threshold.
- Browser QA uses fresh temporary MySQL/Redis on 34320/36320 after the default
  local test account was denied access to the E2E schema; existing services are untouched.

## Final validation

- All 13 CCPC26 Chromium scenarios passed, including default/disabled preferences,
  reload persistence, keyboard toggles, unchanged replay position, pre/post-freeze
  behavior, Live clock, modal privacy, Worker cancellation, no-switch ordinary ICPC,
  390px mobile and a 420px preview container in a 1280px desktop viewport.
- Two additional regressions passed: saved preference hydration without replacing
  the SSR table, and package styling under application theme overrides.
- The extra settings-modal regression failed its existing popover z-index assertion
  (`50` actual versus `>=1000` expected). Its test and PopoverContent/SettingInfoTip
  implementation are unchanged from HEAD; the baseline PopoverContent uses `z-50`.
  This unrelated assertion was not modified. Overall expanded browser run: 15 pass,
  1 failure. The final three preference/geometry cases passed again after adding
  an immediate unchanged-slider-position assertion and cropped screenshots.
- Screenshots inspected for desktop, mobile and narrow-container states. UI text is
  centered on the bar; the switch is to its right and does not overlap time labels.
- Browser evidence: `/private/tmp/rankland-ccpc26-preference-qa/` and
  `/private/tmp/rankland-ccpc26-preference-final-qa/`. Unit/build/browser logs remain
  under `/private/tmp/rankland-ccpc26-*.log`.
- Final design: `docs/ccpc26-preference.md`. The user authorized a scoped commit and
  push after implementation; no Rankland deploy was requested. Existing
  loadtest/docs/migration work is preserved.

- Follow-up layout adjustment: CCPC26 label now precedes the Switch, and the gap
  from Time Travel Mode increases from 10px to 16px. The group remains absolute.

- Follow-up layout QA loaded the actual renderer and Switch at 1280px and 390px:
  label-before-switch order, exactly 16px spacing, zero center offset, and mouse
  toggle behavior all passed. Evidence: `/private/tmp/rankland-switch-layout-qa/`.
