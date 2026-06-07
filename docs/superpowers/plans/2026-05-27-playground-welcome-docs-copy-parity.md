# Playground Welcome Docs Copy Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React welcome modal docs cue in `/playground`.

**Architecture:** Keep the existing Ant Design Vue modal and persistence flow. Change only the modal paragraph content and full-chain coverage.

**Tech Stack:** Vue 3 SFC, Ant Design Vue icon component, Playwright full-chain E2E.

---

### Task 1: Restore Welcome Modal Docs Cue

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`
- Modify: `src/client/modules/playground/playground.view.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Write the failing test**

Add assertions to the existing one-time welcome modal full-chain test:

```ts
await expect(page.locator('[data-id="playground-welcome-modal"]')).toContainText(
  '需要参考 srk 文档？请点击右上角的',
);
await expect(page.locator('[data-id="playground-welcome-modal"] .anticon-question-circle')).toBeVisible();
await expect(page.locator('[data-id="playground-welcome-modal"]')).toContainText('图标。');
await expect(page.locator('[data-id="playground-welcome-modal"]')).not.toContainText('页面中的 srk 文档入口');
```

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "shows the one-time welcome modal"
```

Expected: FAIL because the Vue modal still says `页面中的 srk 文档入口` and has no inline question-circle icon.

- [x] **Step 3: Restore old modal cue**

Change the welcome modal third paragraph to:

```vue
<p>
  需要参考 srk 文档？请点击右上角的 <QuestionCircleOutlined /> 图标。
</p>
```

`QuestionCircleOutlined` is already registered for the preview docs link.

- [x] **Step 4: Run focused verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "shows the one-time welcome modal"
```

Expected: PASS.

- [x] **Step 5: Update migration docs**

Record that the Playground welcome modal now matches the old right-top docs icon cue.

- [x] **Step 6: Run full gate and commit**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node 24, pnpm 8, route generation succeeds, all migration tests pass, and `git diff --check` exits cleanly.

Commit:

```bash
git add tests/e2e/full-chain/playground.spec.ts src/client/modules/playground/playground.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-playground-welcome-docs-copy-parity-design.md docs/superpowers/plans/2026-05-27-playground-welcome-docs-copy-parity.md
git commit -m "fix: 还原演练场欢迎弹窗文档提示"
```
