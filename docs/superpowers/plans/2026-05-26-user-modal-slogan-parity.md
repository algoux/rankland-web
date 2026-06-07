# User Modal Slogan Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `x_slogan` presentation in the Vue RankLand user modal.

**Architecture:** Keep the behavior inside `RanklandRanklist`, where `activeUserSlogan` is already computed. Use fixture-backed full-chain E2E to verify user-visible text and computed CSS.

**Tech Stack:** Vue 3 SFC, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/fixtures/ranklist.srk.json`
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add fixture slogan**

Add to Team Alpha's user object:

```json
"x_slogan": "Keep moving forward"
```

- [x] **Step 2: Add user modal slogan assertions**

After opening Team Alpha's user modal, assert:

```ts
const slogan = userModal.locator('[data-id="rankland-user-modal-slogan"]');
await expect(slogan).toHaveText('Keep moving forward');
expect(await slogan.evaluate((element) => {
  const style = window.getComputedStyle(element);
  const beforeStyle = window.getComputedStyle(element, '::before');
  return {
    textAlign: style.textAlign,
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    beforeContent: beforeStyle.content,
    beforeDisplay: beforeStyle.display,
    beforeFontSize: beforeStyle.fontSize,
  };
})).toMatchObject({
  textAlign: 'center',
  fontSize: '32px',
  beforeContent: '"SLOGAN"',
  beforeDisplay: 'block',
  beforeFontSize: '14px',
});
```

Then assert `fontFamily` contains `ZCOOL XiaoWei`.

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fails because `rankland-user-modal-slogan` is absent.

### Task 2: Implement Vue Slogan Styling

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add stable selector**

Update the slogan element:

```vue
<p v-if="activeUserSlogan" data-id="rankland-user-modal-slogan" class="rankland-user-modal-slogan">
  {{ activeUserSlogan }}
</p>
```

- [x] **Step 2: Restore old CSS**

Update:

```less
.rankland-user-modal-slogan {
  margin: 16px 0 8px;
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 32px;
  text-align: center;
}

.rankland-user-modal-slogan::before {
  display: block;
  font-size: 14px;
  content: 'SLOGAN';
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
- Modify: `docs/superpowers/plans/2026-05-26-user-modal-slogan-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record user modal slogan parity in route and SRK wrapper status.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/fixtures/ranklist.srk.json tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-user-modal-slogan-parity-design.md docs/superpowers/plans/2026-05-26-user-modal-slogan-parity.md
git commit -m "feat: 收口用户弹窗标语样式一致性"
```
