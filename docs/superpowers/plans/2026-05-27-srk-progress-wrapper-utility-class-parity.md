# SRK Progress Wrapper Utility Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `StyledRanklistRenderer` progress wrapper `mx-4` horizontal spacing in the Vue SRK wrapper.

**Architecture:** Keep the existing `data-id="rankland-ranklist-progress"` and `.rankland-ranklist-progress` hook. Add only the old `mx-4` utility class to the progress wrapper and prove its 16px horizontal margins through Ranklist full-chain coverage.

**Tech Stack:** Vue 3 SFC, ant-design-vue app shell context, `@algoux/standard-ranklist-renderer-component-vue`, Playwright full-chain tests, pnpm migration gates.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add progress wrapper utility-class assertions**

In `renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend`, immediately after:

```ts
    await expect(page.locator('[data-id="rankland-ranklist-progress"]')).toBeVisible();
```

add:

```ts
    const progressWrapper = page.locator('[data-id="rankland-ranklist-progress"]');
    await expect(progressWrapper).toHaveClass(/(^|\s)mx-4(\s|$)/);
    expect(await progressWrapper.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        marginLeft: style.marginLeft,
        marginRight: style.marginRight,
      };
    })).toMatchObject({
      marginLeft: '16px',
      marginRight: '16px',
    });
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL because the current Vue progress wrapper lacks `mx-4`.

### Task 2: Restore Progress Wrapper Class

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add `mx-4` to the progress wrapper**

Change:

```vue
<div v-if="showProgress" data-id="rankland-ranklist-progress" class="rankland-ranklist-progress">
```

to:

```vue
<div v-if="showProgress" data-id="rankland-ranklist-progress" class="rankland-ranklist-progress mx-4">
```

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: PASS.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-srk-progress-wrapper-utility-class-parity.md`

- [x] **Step 1: Update migration docs**

Record SRK progress wrapper `mx-4` parity in the Ranklist route coverage, shared SRK Vue wrapper notes, manual checklist, and final integration review.

- [x] **Step 2: Run the full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-srk-progress-wrapper-utility-class-parity-design.md docs/superpowers/plans/2026-05-27-srk-progress-wrapper-utility-class-parity.md
git commit -m "fix: 还原 SRK 进度条外壳工具类"
```
