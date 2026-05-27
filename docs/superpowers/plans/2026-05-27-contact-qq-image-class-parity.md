# Contact QQ Image Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `w-full` class token on the shared ContactUs QQ group image.

**Architecture:** Keep the existing Ant Design Vue modal and local image CSS. Add full-chain coverage for the old image class token, then append `w-full` to the existing QQ image element.

**Tech Stack:** Vue 3 SFC, ant-design-vue Modal, Playwright full-chain tests, pnpm migration gates.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/home.spec.ts`

- [x] **Step 1: Add QQ image class assertion**

In `renders the RankLand home page through SSR, hydration, RanklandApiService, and the mock backend`, after the existing QQ image visibility assertion, add:

```ts
await expect(page.locator('[data-id="contact-us-qq-image"]')).toHaveClass(/(^|\s)w-full(\s|$)/);
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "renders the RankLand home page"
```

Expected: FAIL because the current Vue QQ image does not carry `w-full`.

### Task 2: Restore Legacy Image Class

**Files:**
- Modify: `src/client/components/contact-us.vue`

- [x] **Step 1: Add old class beside existing selectors**

Change the QQ image to:

```vue
<img data-id="contact-us-qq-image" class="w-full" :src="qqGroupImg" alt="RankLand QQ group">
```

Do not change the image source, alt text, modal structure, or existing CSS.

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "renders the RankLand home page"
```

Expected: PASS.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-contact-qq-image-class-parity.md`

- [x] **Step 1: Update migration docs**

Record ContactUs QQ image class parity in the Home/contact coverage, known risks/deferred decisions, manual checklist, and final integration review.

- [x] **Step 2: Run the full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/contact-us.vue tests/e2e/full-chain/home.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-contact-qq-image-class-parity-design.md docs/superpowers/plans/2026-05-27-contact-qq-image-class-parity.md
git commit -m "fix: 还原联系弹窗 QQ 图片旧版类名"
```
