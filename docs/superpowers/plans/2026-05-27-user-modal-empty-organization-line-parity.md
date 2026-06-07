# User Modal Empty Organization Line Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old empty organization line DOM in the shared SRK user modal.

**Architecture:** Keep the existing custom Vue user modal body. Remove only the value-based render guard from the organization paragraph, preserving the existing data-id, migrated hooks, old `mb-0` class token, and scoped zero-margin styles.

**Tech Stack:** Vue 3 SFC, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Add RED Coverage

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`

- [x] **Step 1: Import the deterministic ranklist fixture**

Add this import near the top of `tests/e2e/full-chain/playground.spec.ts`:

```ts
import ranklistFixture from '../../fixtures/ranklist.srk.json';
```

- [x] **Step 2: Add the empty-organization full-chain test**

Add this test in the `/playground full-chain route` describe block after the bundled preview test:

```ts
  test('preserves the legacy empty user organization line in the SRK user modal', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await markPlaygroundWelcomeRead(page);

    await page.goto('/playground');
    await expectMonacoReady(page);

    const source = JSON.parse(JSON.stringify(ranklistFixture));
    source.contest.title = 'Empty Organization User Modal Fixture';
    delete source.rows[0].user.organization;
    await replaceMonacoSource(page, JSON.stringify(source));

    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toHaveText(
      'Empty Organization User Modal Fixture',
    );
    await page.locator('.srk-user-cell', { hasText: 'Team Alpha' }).click();

    const userModal = page.locator('[data-id="rankland-ranklist-user-modal"]');
    await expect(userModal.locator('.srk-modal')).toBeVisible();
    const organizationLine = userModal.locator('[data-id="rankland-user-modal-organization"]');
    await expect(organizationLine).toHaveCount(1);
    await expect(organizationLine).toHaveText('');
    await expect(organizationLine).toHaveClass(/(^|\s)mb-0(\s|$)/);
    expect(await organizationLine.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      };
    })).toMatchObject({
      marginTop: '0px',
      marginBottom: '0px',
    });
  });
```

- [x] **Step 3: Run the focused RED command**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "preserves the legacy empty user organization line"
```

Expected: FAIL because `[data-id="rankland-user-modal-organization"]` has count `0`.

### Task 2: Restore the DOM

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove the organization line value guard**

Change:

```vue
<p
  v-if="activeUserOrganization"
  data-id="rankland-user-modal-organization"
  class="rankland-user-modal-line rankland-user-modal-organization mb-0"
>
  {{ activeUserOrganization }}
</p>
```

to:

```vue
<p
  data-id="rankland-user-modal-organization"
  class="rankland-user-modal-line rankland-user-modal-organization mb-0"
>
  {{ activeUserOrganization }}
</p>
```

- [x] **Step 2: Run the focused GREEN command**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "preserves the legacy empty user organization line"
```

Expected: PASS.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-user-modal-empty-organization-line-parity.md`

- [x] **Step 1: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands exit 0.

- [x] **Step 2: Update migration docs**

Record `user modal empty organization line parity`, focused RED/GREEN evidence, and the full gate result in the migration dashboard, manual checklist, and final integration review.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/playground.spec.ts docs/superpowers/specs/2026-05-27-user-modal-empty-organization-line-parity-design.md docs/superpowers/plans/2026-05-27-user-modal-empty-organization-line-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原用户弹窗空组织行"
```
