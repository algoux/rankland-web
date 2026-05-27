# SRK Remarks Wrapper Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `mb-4 text-center` class tokens on the shared SRK remarks wrapper.

**Architecture:** Keep the existing Vue-only `.rankland-ranklist-remarks` hook and computed styles. Add full-chain coverage for the old class tokens, then append the legacy classes beside the existing hook.

**Tech Stack:** Vue 3 SFC, Playwright full-chain tests, pnpm migration gates.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add remarks wrapper class assertions**

In `renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend`, after the existing `remarks` locator is defined, add:

```ts
const remarksWrapper = page.locator('[data-id="rankland-ranklist-table-wrapper"] .rankland-ranklist-remarks');
await expect(remarksWrapper).toHaveClass(/(^|\s)mb-4(\s|$)/);
await expect(remarksWrapper).toHaveClass(/(^|\s)text-center(\s|$)/);
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL because the current Vue remarks wrapper does not carry `mb-4` or `text-center`.

### Task 2: Restore Legacy Remarks Wrapper Classes

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add old classes beside the Vue hook**

Change the remarks wrapper to:

```vue
<div v-if="ranklistState.staticRanklist.remarks" class="rankland-ranklist-remarks mb-4 text-center">
```

Do not remove `.rankland-ranklist-remarks` or change the existing CSS.

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
- Modify: `docs/superpowers/plans/2026-05-27-srk-remarks-wrapper-class-parity.md`

- [x] **Step 1: Update migration docs**

Record SRK remarks wrapper utility-class parity in the route coverage, SRK wrapper infrastructure row, known risks/deferred decisions, manual checklist notes, and final integration review.

- [x] **Step 2: Run the full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-srk-remarks-wrapper-class-parity-design.md docs/superpowers/plans/2026-05-27-srk-remarks-wrapper-class-parity.md
git commit -m "fix: 还原 SRK 备注外层旧版工具类"
```
