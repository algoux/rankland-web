# Playground Preview Progress Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React playground preview progress-bar behavior by making `RanklandRanklist` default `showProgress` to `true`.

**Architecture:** Preserve the shared wrapper API and old default semantics instead of adding a Playground-only override. Existing route callers that already pass `show-progress` remain unchanged, while Playground regains progress through the shared default.

**Tech Stack:** Vue 3 Options API, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Red Test

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`

- [x] **Step 1: Add the failing progress assertion**

Inside `hydrates the CSR playground and previews bundled SRK without upstream calls`, after the preview/filter assertions, add:

```ts
await expect(page.locator('[data-id="rankland-ranklist-progress"]')).toBeVisible();
```

- [x] **Step 2: Run focused full-chain test and confirm RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts
```

Expected: fail because Playground preview currently does not render `rankland-ranklist-progress`.

### Task 2: Shared Wrapper Default

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Restore old default progress behavior**

Change the prop default:

```ts
showProgress: {
  type: Boolean,
  default: true,
},
```

- [x] **Step 2: Run focused full-chain test and confirm GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts
```

Expected: pass.

### Task 3: Gates, Docs, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-playground-preview-progress-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration docs**

Record Playground preview progress parity and keep remaining Playground risks scoped to Monaco package-version/synthetic editing parity.

- [x] **Step 3: Commit the slice**

Run:

```bash
git status --short
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/playground.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-playground-preview-progress-parity-design.md docs/superpowers/plans/2026-05-26-playground-preview-progress-parity.md
git commit -m "feat: 收口演练场预览进度条一致性"
```

Expected: commit succeeds with only this slice's files.
