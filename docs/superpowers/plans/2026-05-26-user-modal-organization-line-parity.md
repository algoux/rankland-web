# User Modal Organization Line Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `UserInfoModal` organization-line spacing in the migrated Vue SRK user modal.

**Architecture:** Keep the organization line in the existing custom user modal body. Add a specific class for the organization paragraph and set only that line's margin to zero, preserving shared line spacing for other modal fields.

**Tech Stack:** Vue 3 SFC, SRK Vue Modal, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add organization-line spacing assertions**

In the main `/ranklist/:id` full-chain test, after opening `Team Alpha` and asserting no duplicate body username, add:

```ts
    const organizationLine = userModal.locator('[data-id="rankland-user-modal-organization"]');
    await expect(organizationLine).toHaveText('Org A');
    const organizationLineStyle = await organizationLine.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      };
    });
    expect(organizationLineStyle).toMatchObject({
      marginTop: '0px',
      marginBottom: '0px',
    });
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fail because the current Vue organization line has `4px` top and bottom margin.

### Task 2: Restore Organization Line Spacing

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add a specific organization-line class**

Update the organization paragraph:

```vue
            <p
              v-if="activeUserOrganization"
              data-id="rankland-user-modal-organization"
              class="rankland-user-modal-line rankland-user-modal-organization"
            >
              {{ activeUserOrganization }}
            </p>
```

- [x] **Step 2: Add the zero-margin style**

Add near the other user modal body styles:

```less
.rankland-user-modal-organization {
  margin: 0;
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
- Modify: `docs/superpowers/plans/2026-05-26-user-modal-organization-line-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record user modal organization-line spacing parity in the current slice, `/ranklist/:id` coverage, SRK Vue wrapper status, deferred product decisions, and known risks.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-user-modal-organization-line-parity-design.md docs/superpowers/plans/2026-05-26-user-modal-organization-line-parity.md
git commit -m "feat: 收口用户弹窗组织行间距一致性"
```
