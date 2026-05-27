# SRK Check Error Wrapper Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore exact old React class output for the SRK checker-error wrapper.

**Architecture:** Keep the existing Vue SRK validation path and stable `data-id` selector. Tighten the full-chain DOM assertion first, then remove the extra Vue-only product class from `rankland-ranklist.vue`.

**Tech Stack:** Vue 3, Playwright full-chain E2E, pnpm 8, Node 24.

---

### Task 1: Focused RED Test

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`

- [ ] **Step 1: Tighten the checker-error wrapper class assertion**

Replace the loose `ml-8` class assertion in `preserves the legacy checker error DOM for object JSON that is not valid SRK` with:

```ts
await expect(checkError).toHaveClass(/^ml-8$/);
await expect(checkError).not.toHaveClass(/rankland-ranklist-check-error/);
```

- [ ] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts -g "preserves the legacy checker error DOM"
```

Expected: FAIL because the current Vue wrapper class is `rankland-ranklist-check-error ml-8`.

### Task 2: Minimal GREEN Implementation

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [ ] **Step 1: Remove the Vue-only class**

Change:

```vue
class="rankland-ranklist-check-error ml-8"
```

to:

```vue
class="ml-8"
```

- [ ] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts -g "preserves the legacy checker error DOM"
```

Expected: PASS.

### Task 3: Migration Docs, Full Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Update migration docs**

Record this slice as `SRK check-error wrapper class parity`, including RED/GREEN evidence and the exact `class="ml-8"` wrapper parity.

- [ ] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/playground.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-srk-check-error-wrapper-class-parity-design.md docs/superpowers/plans/2026-05-27-srk-check-error-wrapper-class-parity.md
git commit -m "fix: 还原 SRK 检查错误外层类名"
```

- [ ] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch status and no whitespace errors.
