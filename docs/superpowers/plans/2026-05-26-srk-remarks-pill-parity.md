# SRK Remarks Pill Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React SRK remarks pill placement and styling in the Vue RankLand renderer.

**Architecture:** Keep the behavior inside the shared `RanklandRanklist` component so ranklist, collection, live, and playground inherit the same renderer parity. Use the existing full-chain ranklist fixture to expose `remarks` and assert rendered DOM plus computed styles through Playwright.

**2026-05-26 follow-up:** Restore the old theme-scoped remarks border color. The original pill slice restored placement/shape but left the border hard-coded to Ant Design Vue blue; old React uses `rgba(var(--primary-color-r), 0.8)`.

**Tech Stack:** Vue 3 SFC, Ant Design Vue app shell, `@algoux/standard-ranklist-renderer-component-vue`, Playwright full-chain tests, pnpm.

---

### Task 1: Write the RED Full-Chain Coverage

**Files:**
- Modify: `tests/fixtures/ranklist.srk.json`
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add fixture remarks**

Add a top-level `remarks` field after `contributors` in `tests/fixtures/ranklist.srk.json`:

```json
"remarks": "赛后补题榜单，仅供展示",
```

- [x] **Step 2: Assert the old wrapper-local pill contract**

In the main `/ranklist/:id` full-chain test, assert:

```ts
const remarks = page.locator('[data-id="rankland-ranklist-table-wrapper"] .srk-remarks');
await expect(remarks).toHaveText('备注：赛后补题榜单，仅供展示');
await expect(remarks).toBeVisible();
expect(await remarks.evaluate((element) => {
  const style = window.getComputedStyle(element);
  return {
    display: style.display,
    fontSize: style.fontSize,
    borderTopWidth: style.borderTopWidth,
    borderTopStyle: style.borderTopStyle,
    borderTopColor: style.borderTopColor,
    borderRadius: style.borderRadius,
    paddingLeft: style.paddingLeft,
    paddingTop: style.paddingTop,
    opacity: style.opacity,
  };
})).toMatchObject({
  display: 'inline-block',
  fontSize: '12px',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'rgba(255, 129, 4, 0.8)',
  borderRadius: '4px',
  paddingLeft: '8px',
  paddingTop: '4px',
  opacity: '0.75',
});
```

- [x] **Step 3: Run the focused test and verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fails because `.srk-remarks` is missing from the table wrapper.

2026-05-26 primary-color follow-up RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail|passes the RankLand dark theme"
```

Expected: fails because light receives `rgba(22, 119, 255, 0.8)` instead of `rgba(255, 129, 4, 0.8)`, and dark receives `rgba(22, 119, 255, 0.8)` instead of `rgba(246, 172, 6, 0.8)`.

### Task 2: Implement the Vue Remarks Pill

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Move remarks into the table wrapper**

Change the template so `ranklandState.staticRanklist.remarks` renders inside `data-id="rankland-ranklist-table-wrapper"` before `<Ranklist />`:

```vue
<div data-id="rankland-ranklist-table-wrapper" :class="tableClass">
  <div v-if="ranklistState.staticRanklist.remarks" class="rankland-ranklist-remarks">
    <span class="srk-remarks">备注：{{ resolveTextValue(ranklistState.staticRanklist.remarks) }}</span>
  </div>
  <Ranklist ... />
</div>
```

- [x] **Step 2: Restore the old pill CSS**

Update scoped CSS:

```less
.rankland-ranklist-remarks {
  margin-bottom: 16px;
  text-align: center;
}

.srk-remarks {
  display: inline-block;
  padding: 4px 8px;
  border: 1px solid rgba(var(--rankland-primary-color-rgb), 0.8);
  border-radius: 4px;
  font-size: 12px;
  opacity: 0.75;
}
```

For the primary-color follow-up, define `--rankland-primary-color-rgb` beside `--rankland-primary-color` in `src/client/index.less`:

```less
html.light body {
  --rankland-primary-color-rgb: 255, 129, 4;
}

html.dark body {
  --rankland-primary-color-rgb: 246, 172, 6;
}
```

- [x] **Step 3: Run the focused test and verify GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: ranklist full-chain tests pass.

2026-05-26 primary-color follow-up GREEN:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail|passes the RankLand dark theme"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: focused light/dark border checks pass, then all ranklist full-chain tests pass.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-srk-remarks-pill-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record this slice in `docs/migration/status.md` as SRK remarks pill parity, including fixture-backed full-chain coverage and remaining lower-level pixel risks.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/fixtures/ranklist.srk.json tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-srk-remarks-pill-parity-design.md docs/superpowers/plans/2026-05-26-srk-remarks-pill-parity.md
git commit -m "feat: 收口 SRK 备注样式一致性"
```
