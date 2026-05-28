# SRK Footer Root DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `StyledRanklistRenderer` footer root DOM by rendering the shared SRK footer as a plain `DIV`.

**Architecture:** Keep footer ownership inside `src/client/components/rankland-ranklist.vue`. Extend the existing ranklist full-chain helper that already verifies footer utility classes so the same route locks the root tag name.

**Tech Stack:** Vue 3 SFC, ant-design-vue, Playwright full-chain E2E, Node 24, pnpm 8.

---

### Task 1: RED - capture SRK footer root tag

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add footer root tag assertion**

Update `getFooterUtilityClasses(page)` to return `footerTagName`:

```ts
return {
  footerTagName: footer.tagName,
  footerClasses: Array.from(footer.classList),
  paragraphClasses: paragraphs.slice(0, 5).map((paragraph) => Array.from(paragraph.classList)),
};
```

Then update the existing footer assertion in `renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend`:

```ts
expect(await getFooterUtilityClasses(page)).toMatchObject({
  footerTagName: 'DIV',
  footerClasses: ['text-center', 'mt-8'],
  paragraphClasses: [
    expect.arrayContaining(['mb-0']),
    expect.arrayContaining(['mt-1', 'mb-0']),
    expect.arrayContaining(['mt-1', 'mb-0']),
    expect.arrayContaining(['mt-1', 'mb-0']),
    expect.arrayContaining(['mt-1', 'mb-0']),
  ],
});
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
```

Expected: FAIL because current Vue renders `[data-id="rankland-ranklist-footer"]` as `FOOTER`.

Observed: FAIL. The focused full-chain test expected `footerTagName: 'DIV'` and received `footerTagName: 'FOOTER'`, reproducing the root DOM tag gap.

### Task 2: GREEN - restore footer root DIV

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Change footer root to DIV**

Change:

```vue
<footer v-if="showFooter" data-id="rankland-ranklist-footer" class="text-center mt-8">
```

to:

```vue
<div v-if="showFooter" data-id="rankland-ranklist-footer" class="text-center mt-8">
```

and change the matching close tag from `</footer>` to `</div>`.

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
```

Expected: PASS with the new `DIV` tag assertion and existing SRK footer behavior checks.

Observed: PASS. The focused ranklist full-chain case verifies the footer root `DIV`, the SRK renderer top-level DOM list, and the existing footer text/link/contact/spacing behavior.

### Task 3: Migration docs, full gate, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Update migration docs**

Record this slice as `SRK footer root DOM parity`, including:

- old React `div.text-center.mt-8` footer root evidence;
- focused RED/GREEN evidence;
- full gate evidence after it runs.

Observed: migration status, manual acceptance checklist, and final integration review now record the SRK footer root DOM RED/GREEN and full gate evidence.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with Node 24, pnpm 8, generated client routes, migration tests, and whitespace check.

Observed: PASS. Node `v24.11.1`, pnpm `8.15.9`; `gen:client-router` generated 6 client routes; `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-srk-footer-root-dom-parity-design.md docs/superpowers/plans/2026-05-28-srk-footer-root-dom-parity.md
git commit -m "fix: 还原 SRK footer 根节点"
```

Observed: committed as the current `fix: 还原 SRK footer 根节点` slice commit; this plan evidence will be amended into the same commit.

- [x] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
ps -ax -o pid,command | rg 'playwright|vite|tsx|node.*rankland|mock-api|full-chain|9232|3100|3101'
```

Expected: clean branch status, no whitespace errors, and no lingering Playwright/Vite/mock full-chain server.

Observed: `git status --short --branch` was clean, `git show --check --oneline HEAD` reported the current `fix: 还原 SRK footer 根节点` commit, `git diff --check` passed, and the process check found no lingering Playwright/Vite/mock full-chain server.
