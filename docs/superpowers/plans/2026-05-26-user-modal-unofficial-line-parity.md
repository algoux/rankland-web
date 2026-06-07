# User Modal Unofficial Line Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React unofficial-participant line spacing in the Vue RankLand user modal.

**Architecture:** Keep the behavior inside `RanklandRanklist`, where the user modal already branches on `activeUserPayload.user.official === false`. Use Team Beta in the existing full-chain fixture to exercise the unofficial path without changing ranklist filter semantics.

**Tech Stack:** Vue 3 SFC scoped Less, SRK fixture JSON, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/fixtures/ranklist.srk.json`
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Make Team Beta explicitly unofficial**

Add to Team Beta's user object:

```json
"official": false
```

- [x] **Step 2: Add user modal unofficial line assertions**

After closing Team Alpha's modal, open Team Beta and assert:

```ts
await page.locator('.srk-user-cell', { hasText: 'Team Beta' }).click();
await expect(userModal.locator('.srk-modal')).toBeVisible();
const unofficialLine = userModal.locator('[data-id="rankland-user-modal-unofficial"]');
await expect(unofficialLine).toHaveText('＊ 非正式参加者');
const unofficialLineStyle = await unofficialLine.evaluate((element) => {
  const style = window.getComputedStyle(element);
  return {
    marginTop: style.marginTop,
    marginBottom: style.marginBottom,
  };
});
expect(unofficialLineStyle).toMatchObject({
  marginTop: '16px',
  marginBottom: '0px',
});
await userModal.getByRole('button', { name: 'Close' }).click();
await expect(userModal.locator('.srk-modal')).toBeHidden();
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fails because `rankland-user-modal-unofficial` is absent and the line still uses generic spacing.

### Task 2: Implement Vue Unofficial Line Styling

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add stable selector and old class name**

Update the unofficial line template:

```vue
<p
  v-if="activeUserPayload.user.official === false"
  data-id="rankland-user-modal-unofficial"
  class="rankland-user-modal-unofficial"
>
  ＊ 非正式参加者
</p>
```

- [x] **Step 2: Restore old spacing**

Add scoped CSS:

```less
.rankland-user-modal-unofficial {
  margin: 16px 0 0;
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
- Modify: `docs/superpowers/plans/2026-05-26-user-modal-unofficial-line-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record user modal unofficial line parity in `/ranklist/:id` coverage, SRK wrapper infrastructure status, deferred product decisions, known risks, and current focus.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/fixtures/ranklist.srk.json tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-user-modal-unofficial-line-parity-design.md docs/superpowers/plans/2026-05-26-user-modal-unofficial-line-parity.md
git commit -m "feat: 收口用户弹窗非正式提示一致性"
```
