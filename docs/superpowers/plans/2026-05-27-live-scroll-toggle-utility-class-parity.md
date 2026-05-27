# Live Scroll Toggle Utility-Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React utility-class DOM and spacing parity for the `/live/:id` scroll-solution toggle.

**Architecture:** Keep `.live-scroll-toggle` as the Vue hook and mobile-hide selector, then add the old `inline-flex items-center` and `mr-1` class contract at the markup boundary. Move the 4px spacing assertion from wrapper `gap` to the label span's right margin.

**Tech Stack:** Vue 3 single-file component, Ant Design Vue Switch, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Add RED E2E Coverage

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [ ] **Step 1: Extend `getLiveControlsChrome`**

Add the live toggle text element lookup and return class/style details:

```ts
const liveToggleText = liveToggle.querySelector<HTMLElement>('span');
if (!controls || !extraAction || !liveToggle || !liveToggleText) {
  throw new Error('Missing live controls chrome target');
}

const liveToggleTextStyle = window.getComputedStyle(liveToggleText);
return {
  // existing fields...
  liveToggleClasses: Array.from(liveToggle.classList),
  liveToggleTextClasses: Array.from(liveToggleText.classList),
  liveToggleTextMarginRight: liveToggleTextStyle.marginRight,
  liveToggleRowGap: liveToggleStyle.rowGap,
};
```

- [ ] **Step 2: Update the first `/live/:id` test assertions**

Replace wrapper gap assertions with old class/margin assertions:

```ts
await expect(page.locator('.live-scroll-toggle')).toHaveClass(/(^|\s)inline-flex(\s|$)/);
await expect(page.locator('.live-scroll-toggle')).toHaveClass(/(^|\s)items-center(\s|$)/);
await expect(page.locator('.live-scroll-toggle > span').first()).toHaveClass(/(^|\s)mr-1(\s|$)/);
await expect(page.locator('.live-scroll-toggle > span').first()).toHaveCSS('margin-right', '4px');
await expect(page.locator('.live-scroll-toggle')).toHaveCSS('column-gap', 'normal');
```

Update `getLiveControlsChrome(page)` expected values to include:

```ts
liveToggleClasses: expect.arrayContaining(['live-scroll-toggle', 'inline-flex', 'items-center']),
liveToggleTextClasses: expect.arrayContaining(['mr-1']),
liveToggleColumnGap: 'normal',
liveToggleRowGap: 'normal',
liveToggleTextMarginRight: '4px',
```

- [ ] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page, preserves queries, polls live ranklist, and guards WebSocket setup"
```

Expected: FAIL because the current Vue markup lacks `inline-flex`, `items-center`, and `mr-1`, and `.live-scroll-toggle` still has `column-gap: 4px`.

### Task 2: Implement Minimal Vue/CSS Parity

**Files:**
- Modify: `src/client/modules/live/live.view.vue`

- [ ] **Step 1: Restore old class tokens in markup**

Change the extra-action markup to:

```vue
<label class="live-scroll-toggle inline-flex items-center">
  <span class="mr-1">实时滚动提交状态</span>
  <a-switch
    data-id="live-scroll-solution-toggle"
    :checked="scrollSolutionEnabled"
    size="small"
    @change="handleScrollSolutionToggle"
  />
</label>
```

- [ ] **Step 2: Remove wrapper gap as spacing source**

Keep `.live-scroll-toggle` for route-local behavior and remove the Vue-only gap:

```css
.live-scroll-toggle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  font-size: 14px;
}

.live-scroll-toggle .mr-1 {
  margin-right: 4px;
}
```

- [ ] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page, preserves queries, polls live ranklist, and guards WebSocket setup"
```

Expected: PASS.

### Task 3: Document, Verify, And Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Update migration docs**

Record the slice as `Live scroll toggle utility-class parity`, including the focused RED/GREEN result and full gate result.

- [ ] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated routes, migration tests pass, and whitespace check passes.

- [ ] **Step 3: Commit**

Run:

```bash
git add docs/superpowers/specs/2026-05-27-live-scroll-toggle-utility-class-parity-design.md docs/superpowers/plans/2026-05-27-live-scroll-toggle-utility-class-parity.md tests/e2e/full-chain/live.spec.ts src/client/modules/live/live.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原 Live 滚动开关工具类"
```

- [ ] **Step 4: Post-commit checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch, commit subject `fix: 还原 Live 滚动开关工具类`, no whitespace errors.
