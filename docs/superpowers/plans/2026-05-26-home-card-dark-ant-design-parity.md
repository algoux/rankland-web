# Home Card Dark Ant Design Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React Ant Design dark card surface and text behavior on the home recommendation/tool cards.

**Architecture:** Keep the existing Vue home page and ant-design-vue `a-card` usage. Add global CSS for the unique `.home-card.ant-card` light/dark tokens so it reliably hits the Ant Design Vue component root, and remove local light-only text color overrides from card heading/body/emphasis text.

**Tech Stack:** Vue 3, ant-design-vue Card, LESS, Playwright full-chain E2E, bwcx/vite-ssr migration harness.

---

## File Structure

- Modify `tests/e2e/full-chain/home.spec.ts`: add RED assertions for dark home card background, border, radius, and inherited text color.
- Modify `src/client/modules/home/home.view.vue`: make card text inherit.
- Modify `src/client/index.less`: add legacy home card light/dark token rules for `.home-card.ant-card`.
- Modify `docs/migration/status.md`: update current slice, home coverage, risks, and gate evidence.
- Modify `docs/migration/manual-acceptance-checklist.md`: add the 2026-05-26 home card dark verification record.
- Modify `docs/migration/final-integration-review.md`: record home card dark Ant Design parity.
- Create `docs/superpowers/specs/2026-05-26-home-card-dark-ant-design-parity-design.md`: design decisions and acceptance criteria.
- Create `docs/superpowers/plans/2026-05-26-home-card-dark-ant-design-parity.md`: executable plan and verification checklist.

## Task 1: Add RED Home Card Coverage

**Files:**
- Modify: `tests/e2e/full-chain/home.spec.ts`

- [x] **Step 1: Add computed style assertions**

Inside `renders the RankLand home page through SSR, hydration, RanklandApiService, and the mock backend`, after the existing recommendation card visibility/count assertions, assert dark Ant Design card tokens:

```ts
const recommendationCard = page.locator('[data-id="home-recommendation-search"] .home-card.ant-card');
await expect(recommendationCard).toHaveCSS('background-color', 'rgb(20, 20, 20)');
await expect(recommendationCard).toHaveCSS('border-top-color', 'rgb(48, 48, 48)');
await expect(recommendationCard).toHaveCSS('border-radius', '2px');
await expect(recommendationCard).toHaveCSS('color', 'rgba(255, 255, 255, 0.85)');
await expect(recommendationCard.locator('h2')).toHaveCSS('color', 'rgba(255, 255, 255, 0.85)');
await expect(recommendationCard.locator('p')).toHaveCSS('color', 'rgba(255, 255, 255, 0.85)');
```

- [x] **Step 2: Run RED verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "renders the RankLand home page"
```

Result: FAIL confirmed because the dark home recommendation card background was still `rgb(255, 255, 255)` instead of old Ant Design dark `rgb(20, 20, 20)`.

## Task 2: Implement Home Card Dark Tokens

**Files:**
- Modify: `src/client/modules/home/home.view.vue`
- Modify: `src/client/index.less`

- [x] **Step 1: Add route-local card token styles**

Add global rules to `src/client/index.less` for the unique `.home-card.ant-card` class:

```less
.home-card.ant-card {
  color: rgba(0, 0, 0, 0.85);
  background: #fff;
  border-color: #f0f0f0;
  border-radius: 2px;
}

html.dark .home-card.ant-card {
  color: rgba(255, 255, 255, 0.85);
  background: #141414;
  border-color: #303030;
}
```

- [x] **Step 2: Make card copy inherit**

Change local home card text rules:

```less
.home-card h2 {
  margin: 0 0 14px;
  color: inherit;
  font-size: 20px;
  line-height: 1.4;
}

.home-card p {
  margin: 0;
  color: inherit;
  line-height: 1.7;
}

.home-card em {
  color: inherit;
  font-style: normal;
  font-weight: 700;
}
```

- [x] **Step 3: Run focused GREEN verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts --grep "renders the RankLand home page"
```

Result: PASS, 1/1 home full-chain test.

- [x] **Step 4: Run full home full-chain verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts
```

Result: PASS, 2/2 home full-chain tests.

## Task 3: Update Migration Docs And Gates

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-26-home-card-dark-ant-design-parity.md`

- [x] **Step 1: Record pending doc state**

Update migration docs to mention home card dark Ant Design parity and mark final gate as pending until the full command completes.

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
git add tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-26-home-card-dark-ant-design-parity-design.md docs/superpowers/plans/2026-05-26-home-card-dark-ant-design-parity.md
git commit -m "fix: 还原首页卡片深色样式"
```

Expected: one coherent commit for this slice.
