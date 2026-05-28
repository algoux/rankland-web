# SRK Header Meta Product Class Parity Design

## Context

Old React `rankland-fe/src/components/StyledRanklistRenderer.tsx` renders the SRK header metadata nodes as:

```tsx
<p className="mb-0">贡献者：{renderContributors(staticData.contributors)}</p>
{renderContestRefLinks(staticData.contest.refLinks)}
<p className="text-center mb-0">...</p>
```

`renderContestRefLinks()` returns a plain `span` without a class. The migrated Vue wrapper already restores the header meta block parent, child order, utility classes, text size, link color, contributor/ref-link item span DOM, and time formatting. It still exposes Vue-only product classes on these public header metadata nodes:

```vue
<p data-id="rankland-ranklist-contributors" class="rankland-ranklist-contributors mb-0">
<span data-id="rankland-ranklist-ref-links" class="rankland-ranklist-ref-links">
<p data-id="rankland-ranklist-time" class="rankland-ranklist-time text-center mb-0">
```

The stable `data-id` selectors can preserve test and scoped-style hooks. Product DOM should match old React class contracts where the old utility tokens are already enough.

## Goal

Remove Vue-only SRK header metadata product classes while preserving visual presentation, link behavior, item DOM, header meta placement, and full-chain route behavior.

## Scope

- Remove `.rankland-ranklist-contributors` from the contributors paragraph class list.
- Remove `.rankland-ranklist-ref-links` from the reference-links span class list.
- Remove `.rankland-ranklist-time` from the contest-time paragraph class list.
- Keep stable `data-id` attributes for full-chain tests and scoped CSS.
- Preserve contributor/ref-link color, 14px text size, zero contributor margin, time centering, and zero time bottom margin through `data-id` and old utility-class selectors.

## Non-Goals

- Do not change header action, export/share, view-count, banner, progress, filter controls, table wrapper, footer, modals, or low-level SRK table behavior.
- Do not remove stable `data-id` selectors.
- Do not change external link `target` / `rel` contracts.
- Do not hand-edit generated router output.

## Test Strategy

Focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
```

Expected initial failure: current Vue reports `rankland-ranklist-contributors`, `rankland-ranklist-ref-links`, and `rankland-ranklist-time` in the header metadata class lists.

Focused GREEN: the same command passes after removing the Vue-only product classes and preserving computed presentation.

Ranklist regression:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- Contributors paragraph class list is exactly `mb-0`.
- Ref-links span class list is empty.
- Time paragraph class list is exactly `text-center mb-0`.
- Contributors/ref-links/time remain inside the same header meta and wrapper positions as before.
- Contributors/ref-links/time computed text size and legacy text/link colors remain covered.
- Existing contributor/ref-link item span DOM, external-link attributes, hidden ref-link dropdown, and ranklist full-chain behavior remain green.
