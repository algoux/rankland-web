# Live Realtime Toastify DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the Live realtime submission panel DOM to the old React Toastify `div` container and direct `div` toast row structure.

**Architecture:** Keep the existing Vue Live route and scroll-solution state logic. Change only the realtime panel template and its focused full-chain assertions, preserving hidden status markers and existing class-based presentation.

**Tech Stack:** Vue 3 SFC, Playwright full-chain E2E, RankLand mock WebSocket harness.

---

## File Structure

- Modify `tests/e2e/full-chain/live.spec.ts`: add DOM tag and direct-child assertions to the existing realtime Toastify presentation test.
- Modify `src/client/modules/live/live-scroll-solution.vue`: replace `aside > ul > li` with old-style `div` container and direct `div.Toastify__toast` rows.
- Modify `docs/migration/status.md`: record the verified Live realtime Toastify DOM parity slice.
- Modify `docs/migration/final-integration-review.md`: add this slice to the final review evidence.
- Modify `docs/migration/manual-acceptance-checklist.md`: add manual acceptance wording for the Live realtime Toastify DOM.

## Tasks

### Task 1: Add RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [ ] **Step 1: Add the failing DOM shape assertion**

Inside `test('renders realtime events with the legacy Toastify container and Zoom presentation', ...)`, extend the `toastifyLayout` object with:

```ts
dom: {
  containerTagName: containerElement.tagName,
  rowTagName: toastElement.tagName,
  listCount: containerElement.querySelectorAll('ul, li').length,
  visibleChildTags: Array.from(containerElement.children)
    .filter((child) => child.getAttribute('data-id') !== 'live-scroll-solution-status')
    .map((child) => child.tagName),
},
```

Then assert:

```ts
expect(toastifyLayout.dom).toEqual({
  containerTagName: 'DIV',
  rowTagName: 'DIV',
  listCount: 0,
  visibleChildTags: ['DIV'],
});
```

- [ ] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "renders realtime events with the legacy Toastify container and Zoom presentation"
```

Expected: FAIL because the current Vue template emits `ASIDE` and `LI`.

### Task 2: Restore Vue Toastify DOM Shape

**Files:**
- Modify: `src/client/modules/live/live-scroll-solution.vue`

- [ ] **Step 1: Replace semantic wrapper tags**

Change:

```vue
<aside ...>
  <div data-id="live-scroll-solution-status" class="live-scroll-solution-status">{{ status }}</div>
  <ul class="live-scroll-solution-list">
    <li ...>
      ...
    </li>
  </ul>
</aside>
```

to:

```vue
<div
  class="live-scroll-solution plugin_scroll-solution-container Toastify__toast-container Toastify__toast-container--bottom-left"
  data-id="live-scroll-solution"
>
  <div data-id="live-scroll-solution-status" class="live-scroll-solution-status">{{ status }}</div>
  <div
    v-for="solution in solutions"
    :key="solution.key"
    class="live-scroll-solution-item Toastify__toast Toastify__toast--default Toastify__zoom-enter"
    data-id="live-scroll-solution-item"
  >
    ...
  </div>
</div>
```

Remove the unused `.live-scroll-solution-list` style block.

- [ ] **Step 2: Run focused GREEN**

Run the same focused Playwright command. Expected: PASS.

### Task 3: Widen Verification And Document

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`

- [ ] **Step 1: Run Live route regression**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts
```

Expected: 11 passed.

- [ ] **Step 2: Run completed-slice gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node 24, pnpm 8, route generation succeeds, `test:migration` passes, and `git diff --check` emits no output.

- [ ] **Step 3: Update migration docs**

Record the slice as `Live realtime Toastify DOM parity`, including RED/GREEN evidence, Live regression, full gate evidence, and the next recommended slice.

- [ ] **Step 4: Commit**

Run:

```bash
git add src/client/modules/live/live-scroll-solution.vue tests/e2e/full-chain/live.spec.ts docs/migration/status.md docs/migration/final-integration-review.md docs/migration/manual-acceptance-checklist.md docs/superpowers/specs/2026-05-28-live-realtime-toastify-dom-parity-design.md docs/superpowers/plans/2026-05-28-live-realtime-toastify-dom-parity.md
git commit -m "fix: 还原实时提交面板结构"
```

- [ ] **Step 5: Run post-commit checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch status, HEAD check has no whitespace errors, and diff check emits no output.

## Self-Review

- Spec coverage: the plan covers test, implementation, docs, gate, commit, and post-checks.
- Placeholder scan: the plan contains no unfinished marker text.
- Type consistency: all referenced selectors and file paths match existing Live route code.
