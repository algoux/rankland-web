# SRK Extra Ref-Link Trigger Product Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only hidden reference-link trigger product class while preserving the old React trigger behavior.

**Architecture:** Keep the shared Vue `RanklandRanklist` wrapper and stable `data-id` selector. Move cursor styling from `.rankland-ranklist-ref-link-extra-action` to `[data-id='rankland-ranklist-ref-link-extra-action']`, then verify the existing ranklist full-chain happy path still covers text, caret, AntD runtime trigger class, color, margin, hover dropdown, and hidden-link attributes.

**Tech Stack:** Vue 3, ant-design-vue Dropdown/Menu, Playwright full-chain E2E, RankLand mock backend.

---

### Task 1: RED Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Assert the extra ref-link trigger has no product class**

In the `/ranklist/:id` happy path test, after the existing text/caret assertions for `[data-id="rankland-ranklist-ref-link-extra-action"]`, add:

```ts
await expect(page.locator('[data-id="rankland-ranklist-ref-link-extra-action"]')).not.toHaveClass(
  /(^|\s)rankland-ranklist-ref-link-extra-action(\s|$)/,
);
await expect(page.locator('[data-id="rankland-ranklist-ref-link-extra-action"]')).toHaveClass(
  /(^|\s)ant-dropdown-trigger(\s|$)/,
);
await expect(page.locator('[data-id="rankland-ranklist-ref-link-extra-action"]')).toHaveCSS('cursor', 'pointer');
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
```

Observed: FAIL because the trigger currently includes the Vue-only `rankland-ranklist-ref-link-extra-action` product class alongside the allowed AntD runtime `ant-dropdown-trigger` class.

### Task 2: Remove Product Class

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove trigger class**

Change:

```vue
<span data-id="rankland-ranklist-ref-link-extra-action" class="rankland-ranklist-ref-link-extra-action">
```

to:

```vue
<span data-id="rankland-ranklist-ref-link-extra-action">
```

- [x] **Step 2: Move cursor styling to data-id**

Change:

```css
.rankland-ranklist-ref-link-extra-action {
  cursor: pointer;
}
```

to:

```css
[data-id='rankland-ranklist-ref-link-extra-action'] {
  cursor: pointer;
}
```

- [x] **Step 3: Run focused GREEN**

Run the same focused ranklist command.

Observed: PASS with no Vue-only product class, the AntD runtime trigger class still present, and preserved cursor/dropdown behavior.

### Task 3: Broaden Verification And Docs

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Run ranklist full-chain file**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Observed: all 9 ranklist full-chain tests passed.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Observed: Node v24.11.1, pnpm 8.15.9, generated 6 client routes, migration tests passed, and whitespace check passed.

- [x] **Step 3: Update migration docs**

Recorded this slice as current verified focus, including RED/GREEN, ranklist full-chain, full gate evidence, and remaining recommended next slice.

- [x] **Step 4: Commit**

Committed as:

```bash
git commit -m "fix: 还原 SRK 隐藏相关链接触发器类名"
```
