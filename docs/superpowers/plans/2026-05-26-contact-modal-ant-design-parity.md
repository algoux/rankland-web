# Contact Modal Ant Design Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the shared contact dialog from a custom Vue overlay to old React Ant Design Modal behavior.

**Architecture:** `ContactUs` remains a shared Vue component with the same trigger slot and selectors, but the dialog body is rendered through ant-design-vue `a-modal`. A scoped wrap class applies old Ant Design light/dark modal tokens without changing unrelated modals.

**Tech Stack:** Vue 3, ant-design-vue Modal, LESS, Playwright full-chain E2E, bwcx/vite-ssr migration harness.

---

## File Structure

- Modify `tests/e2e/full-chain/home.spec.ts`: add RED assertions for dark Ant Design modal structure and styles.
- Modify `src/client/components/contact-us.vue`: replace custom overlay markup with `a-modal` and preserve data IDs.
- Modify `src/client/index.less`: add legacy modal token styles through `wrap-class-name` because `a-modal` teleports under `body`.
- Modify `docs/migration/status.md`: update current slice, app-shell/contact modal coverage, risks, and gate evidence.
- Modify `docs/migration/manual-acceptance-checklist.md`: add the 2026-05-26 contact modal verification record.
- Modify `docs/migration/final-integration-review.md`: record shared contact modal Ant Design parity.
- Create `docs/superpowers/specs/2026-05-26-contact-modal-ant-design-parity-design.md`: design decisions and acceptance criteria.
- Create `docs/superpowers/plans/2026-05-26-contact-modal-ant-design-parity.md`: executable plan and verification checklist.

## Task 1: Add RED Contact Modal Coverage

**Files:**
- Modify: `tests/e2e/full-chain/home.spec.ts`

- [x] **Step 1: Add computed style assertions**

Inside `renders the RankLand home page through SSR, hydration, RanklandApiService, and the mock backend`, immediately after `await expect(page.locator('[data-id="contact-us-dialog"]')).toBeVisible();`, assert the old dark Ant Design modal styles:

```ts
await expect(page.locator('.contact-us-modal-wrap .ant-modal-content')).toHaveCSS(
  'background-color',
  'rgb(31, 31, 31)',
);
await expect(page.locator('.contact-us-modal-wrap .ant-modal-content')).toHaveCSS('border-radius', '2px');
await expect(page.locator('.contact-us-modal-wrap .ant-modal-title')).toHaveCSS(
  'color',
  'rgba(255, 255, 255, 0.85)',
);
await expect(page.locator('.contact-us-modal-wrap .ant-modal-close')).toHaveCSS(
  'color',
  'rgba(255, 255, 255, 0.45)',
);
await expect(page.locator('.contact-us-modal-wrap .ant-modal-body')).toHaveCSS('padding', '24px');
```

- [x] **Step 2: Run RED verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "renders the RankLand home page"
```

Result: FAIL confirmed because the current custom contact modal did not render `.ant-modal-content` under `.contact-us-modal-wrap`.

## Task 2: Implement Ant Design Vue Contact Modal

**Files:**
- Modify: `src/client/components/contact-us.vue`
- Modify: `src/client/index.less`

- [x] **Step 1: Replace custom overlay with `a-modal`**

Use `a-modal` with `v-model:open`, `title="联系我们"`, `:footer="null"`, `wrap-class-name="contact-us-modal-wrap"`, and a `closeIcon` slot containing the existing close selector:

```vue
<a-modal
  v-model:open="open"
  title="联系我们"
  wrap-class-name="contact-us-modal-wrap"
  :footer="null"
  :destroy-on-close="true"
>
  <template #closeIcon>
    <span data-id="contact-us-close" class="contact-us-close" aria-label="关闭联系我们弹窗">×</span>
  </template>
  <div data-id="contact-us-dialog" class="contact-us-body">
    <p>
      联系邮箱：
      <a data-id="contact-us-email" href="mailto:algoux.org@gmail.com">algoux.org@gmail.com</a>
    </p>
    <p>或加入讨论群：</p>
    <img data-id="contact-us-qq-image" :src="qqGroupImg" alt="RankLand QQ group">
  </div>
</a-modal>
```

- [x] **Step 2: Add global legacy modal styles**

Remove obsolete custom overlay/panel/header styles and add global wrap-class styles in `src/client/index.less` for old Ant Design tokens:

```less
:global(.contact-us-modal-wrap .ant-modal-content) {
  background-color: #fff;
  border-radius: 2px;
}

:global(.contact-us-modal-wrap .ant-modal-header) {
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 2px 2px 0 0;
}

:global(.contact-us-modal-wrap .ant-modal-title) {
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
  font-size: 16px;
  line-height: 22px;
}

:global(.contact-us-modal-wrap .ant-modal-body) {
  padding: 24px;
  font-size: 14px;
  line-height: 1.5715;
}

:global(.contact-us-modal-wrap .ant-modal-close) {
  color: rgba(0, 0, 0, 0.45);
}

:global(.contact-us-modal-wrap .ant-modal-close:hover),
:global(.contact-us-modal-wrap .ant-modal-close:focus) {
  color: rgba(0, 0, 0, 0.75);
}

:global(html.dark .contact-us-modal-wrap .ant-modal-content),
:global(html.dark .contact-us-modal-wrap .ant-modal-header) {
  background-color: #1f1f1f;
}

:global(html.dark .contact-us-modal-wrap .ant-modal-header) {
  border-bottom-color: #303030;
}

:global(html.dark .contact-us-modal-wrap .ant-modal-title) {
  color: rgba(255, 255, 255, 0.85);
}

:global(html.dark .contact-us-modal-wrap .ant-modal-close) {
  color: rgba(255, 255, 255, 0.45);
}

:global(html.dark .contact-us-modal-wrap .ant-modal-close:hover),
:global(html.dark .contact-us-modal-wrap .ant-modal-close:focus) {
  color: rgba(255, 255, 255, 0.75);
}
```

- [x] **Step 3: Run focused GREEN verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "renders the RankLand home page"
```

Result: PASS, 1/1 home full-chain test.

- [x] **Step 4: Run contact-related full-chain coverage**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the RankLand home page|renders the ranklist detail page"
```

Result: PASS, 2/2 full-chain tests covering the home contact path and ranklist footer contact path.

## Task 3: Update Migration Docs And Gates

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-26-contact-modal-ant-design-parity.md`

- [x] **Step 1: Record pending doc state**

Update migration docs to mention contact modal Ant Design parity and mark final gate as pending until the full command completes.

- [x] **Step 2: Run final migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Result: Node `v24.11.1`, pnpm `8.15.9`, route generation PASS with 8 client routes, migration suite PASS with build, 35 unit files / 151 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 52 full-chain Playwright tests, and whitespace check PASS.

- [x] **Step 3: Record verified doc state**

Replace pending gate wording with the verified gate evidence, including unit, SSR, shallow, and full-chain counts from `test:migration`.

- [x] **Step 4: Commit**

Run:

```bash
git add tests/e2e/full-chain/home.spec.ts src/client/components/contact-us.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-26-contact-modal-ant-design-parity-design.md docs/superpowers/plans/2026-05-26-contact-modal-ant-design-parity.md
git commit -m "fix: 还原联系弹窗 Ant Design 样式"
```

Expected: one coherent commit for this slice.
