# App Site Switch Dropdown Product-Class Parity Design

## Context

The old React `RightMenu` renders the China site-switch dropdown label as:

- an anchor with `target="_blank"` and inline `wordBreak: 'keep-all'`;
- two direct `p.mb-0` children;
- a nested `span.opacity-60.text-xs` for the subtitle text;
- the Ant Design arrow icon after the subtitle.

The Vue app currently preserves the visual result, but adds Vue-only product classes on the two paragraphs:

- `app-site-switch-title`
- `app-site-switch-subtitle`

Those classes are not part of the old public DOM contract and make the migrated shell less exact than the React source.

## Goal

Restore the dropdown content DOM class contract so the visible China site label uses only the old utility classes on the title/subtitle paragraph nodes while preserving the current presentation:

- title paragraph remains `p.mb-0`;
- subtitle paragraph remains `p.mb-0`;
- subtitle text remains `span.opacity-60.text-xs`;
- margins, nowrap behavior, font size, opacity, arrow spacing, link target, omitted `rel`, and current-path filtering remain unchanged.

## Non-Goals

- Do not change the site-switch trigger button class or Ant Design button/dropdown behavior.
- Do not change host selection, `cnn` alias behavior, or current URL query filtering.
- Do not change nav/header layout or mobile metrics.
- Do not change generated router files.

## Test Strategy

Update the app-shell full-chain E2E helper to select the two direct `p.mb-0` nodes under `[data-id="app-site-switch-link"]` instead of Vue-only product classes. The focused test should first fail because the current Vue DOM still contains `app-site-switch-title` and `app-site-switch-subtitle`.

The passing acceptance criteria are:

- no `.app-site-switch-title` node appears inside the site-switch link;
- no `.app-site-switch-subtitle` node appears inside the site-switch link;
- the direct paragraph class lists are exactly `['mb-0']`;
- existing link and subtitle presentation assertions still pass.
