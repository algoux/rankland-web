# Live Mobile Scroll Toggle DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React mobile DOM contract for the `/live/:id` scroll-solution toggle.

**Architecture:** Keep Live route ownership of the extra action content. Track `window.innerWidth` in the CSR Live component and render the toggle label/switch only at desktop widths, while preserving the shared `RanklandRanklist` controls wrapper behavior.

**Tech Stack:** Vue 3 Options API, ant-design-vue Switch, Playwright full-chain E2E, pnpm 8, Node 24.

---

### Task 1: Focused RED Test

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [ ] **Step 1: Tighten the mobile toggle DOM assertion**

In `hides the scroll-solution toggle on mobile while preserving live ranklist rendering`, replace the hidden toggle assertion with exact absence checks:

```ts
await expect(page.locator('[data-id="live-scroll-solution-toggle"]')).toHaveCount(0);
await expect(page.locator('.live-scroll-toggle')).toHaveCount(0);
```

Keep the existing ranklist visibility and hidden scroll-solution panel assertions.

- [ ] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hides the scroll-solution toggle on mobile"
```

Expected: FAIL because the current Vue route keeps a hidden `[data-id="live-scroll-solution-toggle"]` in the mobile DOM.

### Task 2: Minimal GREEN Implementation

**Files:**
- Modify: `src/client/modules/live/live.view.vue`

- [ ] **Step 1: Gate the toggle content by viewport width**

Add a `clientWidth` field to component data:

```ts
clientWidth: 0,
```

Add a computed flag:

```ts
showScrollSolutionToggle(): boolean {
  return this.clientWidth >= 768;
},
```

Change `updateScrollSolutionContainerHeight()` so it also updates `clientWidth`:

```ts
updateScrollSolutionContainerHeight() {
  this.scrollSolutionContainerMaxHeight = window.innerHeight;
  this.clientWidth = window.innerWidth;
  this.scrollSolutions = this.scrollSolutions.slice(0, this.scrollSolutionVisibleLimit);
},
```

Add `v-if="showScrollSolutionToggle"` to the `.live-scroll-toggle` label:

```vue
<label v-if="showScrollSolutionToggle" class="live-scroll-toggle inline-flex items-center">
```

- [ ] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hides the scroll-solution toggle on mobile"
```

Expected: PASS.

### Task 3: Migration Docs, Full Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Update migration docs**

Record this slice as `Live mobile scroll toggle DOM parity`, including RED/GREEN evidence and the old mobile no-toggle-DOM contract.

- [ ] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/client/modules/live/live.view.vue tests/e2e/full-chain/live.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-live-mobile-scroll-toggle-dom-parity-design.md docs/superpowers/plans/2026-05-28-live-mobile-scroll-toggle-dom-parity.md
git commit -m "fix: 还原 Live 移动端滚动开关 DOM"
```

- [ ] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch status and no whitespace errors.
