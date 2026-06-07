# User Modal Wrap Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only `rankland-user-modal` class from the SRK user modal wrap while preserving modal behavior.

**Architecture:** Keep the change inside the shared `RanklandRanklist` wrapper. The Ranklist full-chain test owns the product DOM contract by inspecting `.srk-modal-wrap` after opening the user modal.

**Tech Stack:** Vue 3, `@algoux/standard-ranklist-renderer-component-vue`, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: RED - capture user modal wrap class parity

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add modal wrap helper**

Add this helper next to `getModalRootClasses`:

```ts
async function getModalWrapClasses(page: Page, wrapperDataId: string) {
  return page.evaluate((dataId) => {
    const modalWrap = document.querySelector<HTMLElement>(`[data-id="${dataId}"] .srk-modal-wrap`);
    if (!modalWrap) {
      throw new Error(`Missing modal wrap for ${dataId}`);
    }
    return Array.from(modalWrap.classList);
  }, wrapperDataId);
}
```

- [x] **Step 2: Assert old exact wrap class list**

Inside the existing Ranklist full-chain user modal block, after the modal root class assertion, add:

```ts
expect(await getModalWrapClasses(page, 'rankland-ranklist-user-modal')).toEqual(['srk-modal-wrap']);
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
```

Expected: FAIL because current Vue renders `['srk-modal-wrap', 'rankland-user-modal']`.

Observed: FAIL. The focused Ranklist full-chain test reported `['srk-modal-wrap', 'rankland-user-modal']` for the user modal wrap, proving the test catches the Vue-only class.

### Task 2: GREEN - remove Vue-only user modal wrap class

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Remove user modal wrap-class-name**

Change:

```vue
<Modal
  :open="!!activeUserPayload"
  :title="activeUserTitle"
  :width="userModalWidth"
  root-class-name="srk-general-modal-root srk-react-modal-root"
  wrap-class-name="rankland-user-modal"
  @close="handleUserModalClose"
>
```

to:

```vue
<Modal
  :open="!!activeUserPayload"
  :title="activeUserTitle"
  :width="userModalWidth"
  root-class-name="srk-general-modal-root srk-react-modal-root"
  @close="handleUserModalClose"
>
```

- [x] **Step 2: Retarget broken asset test selector**

Change:

```ts
const userModal = page.locator('.rankland-user-modal');
```

to:

```ts
const userModal = page.locator('[data-id="rankland-ranklist-user-modal"] .srk-modal');
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page|hides broken SRK asset images"
```

Expected: PASS. The user modal wrap class is exact old React `srk-modal-wrap`, while broken asset behavior remains covered.

Observed: PASS. The focused Ranklist full-chain run passed the main user-modal parity scenario and the broken SRK asset scenario; the user modal wrap class is exact old React `srk-modal-wrap`, and the broken photo hiding coverage uses the stable modal panel selector.

### Task 3: Docs, full gate, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-28-user-modal-wrap-class-parity.md`

- [x] **Step 1: Update migration docs**

Record this slice as `User modal wrap class parity`, including focused RED/GREEN evidence and the old React no-`wrapClassName` baseline.

Observed: docs now record `User modal wrap class parity`, focused RED/GREEN evidence, the old React no-`wrapClassName` baseline, and the passing full gate.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with Node 24, pnpm 8, generated client routes, migration tests, and whitespace check.

Observed: PASS. The full gate used Node `v24.11.1` and pnpm `8.15.9`; `gen:client-router` generated 6 client routes, `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-user-modal-wrap-class-parity-design.md docs/superpowers/plans/2026-05-28-user-modal-wrap-class-parity.md
git commit -m "fix: 还原用户弹窗 wrap 类名"
```

Observed: PASS. Created commit `fix: 还原用户弹窗 wrap 类名`.

- [x] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
ps -ax -o pid,command | rg 'playwright|vite|tsx|node.*rankland|mock-api|full-chain|9232|3100|3101'
```

Expected: clean branch status, no whitespace errors, and no lingering Playwright/Vite/mock full-chain server.

Observed: PASS. `git status --short --branch` was clean on `migration/live-page-foundation`, `git show --check --oneline HEAD` reported the slice commit without whitespace errors, `git diff --check` passed, and the process scan found only Chrome renderer / editor TypeScript server / current `rg` false positives, with no lingering Playwright/Vite/mock full-chain server.
