# SRK Header Meta DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React SRK header meta block DOM structure by making contributors and reference links children of the header meta block.

**Architecture:** Add a full-chain DOM regression test on `/ranklist/test-key?focus=yes`, then move the existing Vue contributors/ref-links template nodes inside the current meta container. Keep all existing hooks and styling.

**Tech Stack:** Vue 3 options API, Ant Design Vue, Playwright full-chain E2E, existing mock backend fixtures.

---

### Task 1: RED - capture header meta DOM structure

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add a DOM helper**

Add this helper near the other header helper functions:

```ts
async function getHeaderMetaDomParity(page: Page) {
  return page.evaluate(() => {
    const meta = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-header-meta"]');
    const contributors = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-contributors"]');
    const refLinks = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-ref-links"]');
    if (!meta || !contributors || !refLinks) {
      throw new Error('Missing ranklist header meta DOM targets');
    }

    return {
      contributorsParentDataId: contributors.parentElement?.getAttribute('data-id') || '',
      refLinksParentDataId: refLinks.parentElement?.getAttribute('data-id') || '',
      timeParentDataId: document
        .querySelector<HTMLElement>('[data-id="rankland-ranklist-time"]')
        ?.parentElement?.getAttribute('data-id') || '',
    };
  });
}
```

- [x] **Step 2: Assert old parent-child DOM**

In `renders the ranklist detail page through SSR...`, after the existing contributors/ref-links text checks, add:

```ts
expect(await getHeaderMetaDomParity(page)).toEqual({
  contributorsParentDataId: 'rankland-ranklist-header-meta',
  refLinksParentDataId: 'rankland-ranklist-header-meta',
  timeParentDataId: '',
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
```

Expected: FAIL because current Vue renders contributors/ref-links as siblings of `[data-id="rankland-ranklist-header-meta"]`.

Result: FAIL reproduced the parity gap. The helper reported empty parent data-id values for contributors and ref-links.

### Task 2: GREEN - move contributors/ref-links into meta block

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Move existing nodes**

Move the existing `rankland-ranklist-contributors` paragraph and `rankland-ranklist-ref-links` span into the existing header meta `div`, immediately after the action block. Keep the `rankland-ranklist-time` paragraph outside the meta `div`.

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
```

Expected: PASS.

Result: PASS. The focused full-chain ranklist route verified contributors/ref-links under the meta block while preserving existing header behavior.

### Task 3: Full verification, docs, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, route generation succeeds, migration tests pass, and whitespace check passes.

Result: PASS. Full gate used Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, passed build, 35 unit files / 151 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 59 passed / 1 skipped full-chain tests; `git diff --check` passed.

- [x] **Step 2: Update migration docs**

Record SRK header meta DOM parity in the current focus, route/SRK wrapper coverage, manual checklist, and final integration review.

- [x] **Step 3: Commit**

Run:

```bash
git add tests/e2e/full-chain/ranklist.spec.ts src/client/components/rankland-ranklist.vue docs/superpowers/specs/2026-05-27-srk-header-meta-dom-parity-design.md docs/superpowers/plans/2026-05-27-srk-header-meta-dom-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原 SRK 头部元信息 DOM"
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: commit succeeds on `migration/live-page-foundation`, post-checks pass.
