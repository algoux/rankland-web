# User Modal Slogan Spacing Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `mt-4 mb-2` class tokens on the user modal slogan node in the Vue SRK wrapper.

**Architecture:** Keep the existing migrated `.rankland-user-modal-slogan` hook and old `.slogan` hook. Add only the missing utility class tokens and verify them through the existing Ranklist full-chain user modal scenario.

**Tech Stack:** Vue 3 SFC, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Capture RED Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [ ] **Step 1: Add slogan spacing class assertions**

```ts
await expect(slogan).toHaveClass(/(^|\s)mt-4(\s|$)/);
await expect(slogan).toHaveClass(/(^|\s)mb-2(\s|$)/);
```

- [ ] **Step 2: Extend computed style coverage**

```ts
const sloganStyle = await slogan.evaluate((element) => {
  const style = window.getComputedStyle(element);
  const beforeStyle = window.getComputedStyle(element, '::before');
  return {
    textAlign: style.textAlign,
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    marginTop: style.marginTop,
    marginBottom: style.marginBottom,
    beforeContent: beforeStyle.content,
    beforeDisplay: beforeStyle.display,
    beforeFontSize: beforeStyle.fontSize,
  };
});
expect(sloganStyle).toMatchObject({
  textAlign: 'center',
  fontSize: '32px',
  marginTop: '16px',
  marginBottom: '8px',
  beforeContent: '"SLOGAN"',
  beforeDisplay: 'block',
  beforeFontSize: '14px',
});
```

- [ ] **Step 3: Run the focused full-chain test and verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL because the slogan class is currently `rankland-user-modal-slogan slogan` and does not include `mt-4` or `mb-2`.

### Task 2: Restore Vue Class Tokens

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [ ] **Step 1: Add the old utility classes to the slogan node**

```vue
class="rankland-user-modal-slogan slogan mt-4 mb-2"
```

- [ ] **Step 2: Run the focused full-chain test and verify GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: PASS.

### Task 3: Update Migration Records And Gate

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Record the verified slogan spacing class parity slice**

Update the dashboard, acceptance checklist, and final review to mention old `slogan mt-4 mb-2` class parity and computed spacing coverage.

- [ ] **Step 2: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with Node 24, pnpm 8, generated client routes, migration test suite, and whitespace check.

- [ ] **Step 3: Commit the verified slice**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-user-modal-slogan-spacing-class-parity-design.md docs/superpowers/plans/2026-05-27-user-modal-slogan-spacing-class-parity.md
git commit -m "fix: 还原用户弹窗旧版标语间距类名"
```
