# User Modal Segment Line Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `UserInfoModal` segment-line `mt-4 mb-0` spacing in the migrated Vue SRK user modal.

**Architecture:** Keep the existing segment row and label in the custom Vue user modal body. Add a full margin declaration to the segment row so it no longer inherits the shared modal line's bottom margin.

**Tech Stack:** Vue 3 SFC, SRK Vue Modal, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add segment-line spacing assertions**

In the main `/ranklist/:id` full-chain test, replace the direct segment line text assertion with a locator and computed-style assertion:

```ts
    const segmentLine = userModal.locator('[data-id="rankland-user-modal-segment"]');
    await expect(segmentLine).toContainText('所在奖区（Rank）：');
    const segmentLineStyle = await segmentLine.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      };
    });
    expect(segmentLineStyle).toMatchObject({
      marginTop: '16px',
      marginBottom: '0px',
    });
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fail because the current Vue segment line still has `marginBottom: 4px`.

### Task 2: Restore Segment Line Spacing

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Set the full segment-line margin**

Update the segment line style:

```less
.rankland-user-modal-segment {
  margin: 16px 0 0;
}
```

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: all ranklist full-chain tests pass.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-user-modal-segment-line-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record user modal segment-line spacing parity in the current slice, `/ranklist/:id` coverage, SRK Vue wrapper status, deferred product decisions, and known risks.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-user-modal-segment-line-parity-design.md docs/superpowers/plans/2026-05-26-user-modal-segment-line-parity.md
git commit -m "feat: 收口用户弹窗奖区行间距一致性"
```
