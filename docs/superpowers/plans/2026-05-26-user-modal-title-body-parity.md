# User Modal Title Body Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the migrated Vue user modal's duplicate body username while preserving the old React modal title behavior.

**Architecture:** Keep the shared SRK `Modal` `title` prop as the user-name source of truth. Remove only the custom body heading and its unused scoped style, leaving all existing body details and modal close behavior unchanged.

**Tech Stack:** Vue 3 SFC, SRK Vue Modal, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add duplicate-body-title assertions**

In the main `/ranklist/:id` full-chain test, after opening `Team Alpha` and asserting `.srk-modal` is visible, add:

```ts
    await expect(userModal.locator('.srk-modal-title')).toHaveText('Team Alpha');
    await expect(userModal.locator('[data-id="rankland-user-modal-name"]')).toHaveCount(0);
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fail because the current Vue user modal body still renders `[data-id="rankland-user-modal-name"]`.

### Task 2: Remove Duplicate Body Heading

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove the body heading**

Delete this body heading from the user modal content:

```vue
            <h3 data-id="rankland-user-modal-name" class="rankland-user-modal-name">{{ activeUserTitle }}</h3>
```

- [x] **Step 2: Remove the unused heading CSS**

Delete the scoped CSS block:

```less
.rankland-user-modal-name {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: all ranklist full-chain tests pass.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-user-modal-title-body-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record user modal title/body parity in the current slice, `/ranklist/:id` coverage, SRK Vue wrapper status, deferred product decisions, and known risks.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-user-modal-title-body-parity-design.md docs/superpowers/plans/2026-05-26-user-modal-title-body-parity.md
git commit -m "feat: 收口用户弹窗标题正文一致性"
```
