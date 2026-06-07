# App Shell Product Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the RankLand app shell to Ant Design Vue based product parity and prevent first-paint theme flicker.

**Architecture:** Keep the route shell in `src/client/App.vue`, but replace the hand-written shell controls with `ant-design-vue` components. Register Ant Design Vue globally in the existing `mainEntry` hook and add a small static theme bootstrap to `index.html` so SSR and client hydration start from the same theme class. Mount `a-menu` through `ClientOnly` because the Ant Design Vue ResizeObserver/overflow wrapper causes SSR/client node mismatches when rendered server-side.

**Tech Stack:** Vue 3, vite-ssr, ant-design-vue 4, Playwright full-chain E2E.

---

### Task 1: Red Tests For Shell Parity

**Files:**
- Modify: `tests/e2e/full-chain/app-shell.spec.ts`

- [x] **Step 1: Add failing assertions**

Add assertions to the existing app-shell tests:

```ts
await expect(page.locator('[data-id="app-shell"]')).toHaveClass(/ant-layout/);
await expect(page.locator('[data-id="app-header"]')).toHaveClass(/ant-layout-header/);
await expect(page.locator('[data-id="app-nav"]')).toHaveClass(/ant-menu-horizontal/);
await expect(page.locator('[data-id="app-nav"] .ant-menu-item-selected')).toContainText('探索');
await expect(page.locator('[data-id="app-site-switch"]')).toHaveClass(/ant-btn/);
```

Add BackTop and raw HTML bootstrap coverage:

```ts
await expect(page.locator('[data-id="app-back-top"]')).toHaveClass(/ant-back-top/);
const html = await (await request.get('/')).text();
expect(html.indexOf('data-rankland-theme-bootstrap')).toBeGreaterThan(-1);
expect(html.indexOf('data-rankland-theme-bootstrap')).toBeLessThan(html.indexOf('/src/client/entry-client.ts'));
```

- [x] **Step 2: Run focused test and confirm RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts
```

Expected: fail on missing Ant Design classes and missing theme bootstrap.

### Task 2: Implement Ant Design Vue Shell

**Files:**
- Modify: `src/client/main.ts`
- Modify: `src/client/App.vue`
- Modify: `src/client/index.less`

- [x] **Step 1: Register Ant Design Vue**

Import Ant Design Vue and its reset stylesheet in `src/client/main.ts`, then call `app.use(Antd)` in `mainEntry`.

- [x] **Step 2: Replace custom shell controls**

Use `a-layout`, `a-layout-header`, `a-layout-content`, `a-menu`, `a-dropdown`, `a-button`, and `a-back-top` in `src/client/App.vue`. Preserve current `data-id` attributes for tests and existing behavior. Mount `a-menu` through `ClientOnly` to avoid its SSR ResizeObserver hydration mismatch.

- [x] **Step 3: Keep shell CSS scoped to parity gaps**

Update `src/client/index.less` so custom styles only align sizing, logo, mobile menu spacing, theme background, and viewport bounds around Ant Design Vue classes.

- [x] **Step 4: Run focused test and confirm GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts
```

Expected: pass.

### Task 3: Implement Theme Bootstrap

**Files:**
- Modify: `index.html`

- [x] **Step 1: Add bootstrap script**

Add a head script with `data-rankland-theme-bootstrap` that sets `document.documentElement.className` to `dark` or `light` from `matchMedia('(prefers-color-scheme: dark)')`, with a light fallback.

- [x] **Step 2: Verify focused test remains GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts
```

Expected: pass.

### Task 4: Migration Gates And Docs

**Files:**
- Modify: `docs/migration/status.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update dashboard**

Record the app shell product parity slice, the verification commands, and remaining non-app-shell deferred product work in `docs/migration/status.md`.
