# App Document Body Bootstrap Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React document-level body bootstrap behavior that reduces first-frame theme and opacity flicker.

**Architecture:** Keep the existing Vue app mount and theme bootstrap script. Add raw HTML coverage first, then restore the old inline body bootstrap style and Dark Reader cleanup script in `index.html`, with `src/client/index.less` releasing body opacity to `1` after app CSS loads.

**Tech Stack:** Vite HTML template, Less global stylesheet, Vue 3, Playwright full-chain E2E.

---

### Task 1: RED Coverage

**Files:**
- Modify: `tests/e2e/full-chain/app-shell.spec.ts`

- [x] **Step 1: Add raw document body bootstrap assertions**

In `bootstraps the system theme before the app is hydrated`, after the existing `twitter:card` / `title` document assertions, add:

```ts
const inlineBodyBootstrapStyle =
  '<style>body{margin:0;background-color:#f0f2f5;opacity:0;transition:opacity 0.7s cubic-bezier(0.22, 0.61, 0.36, 1);}@media(prefers-color-scheme:dark){body{background-color:#000;}}</style>';
expect(html).toContain(inlineBodyBootstrapStyle);
expect(html.indexOf(inlineBodyBootstrapStyle)).toBeLessThan(html.indexOf('<body'));
expect(html).toContain("const __darkReaderInjected = document.head.querySelector('.darkreader');");
expect(html).toContain('__darkReaderInjected && __darkReaderInjected.remove();');
expect(html.indexOf("__darkReaderInjected")).toBeLessThan(html.indexOf('<div id="app"'));
```

- [x] **Step 2: Add hydrated opacity assertion**

In `syncs system theme and macOS Blink optimization after hydration`, after the existing body color assertion, add:

```ts
await expect(page.locator('body')).toHaveCSS('opacity', '1');
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts -g "bootstraps the system theme before the app is hydrated"
```

Expected: FAIL because the current document lacks the old inline body bootstrap style and Dark Reader cleanup script.

Observed: FAIL in `bootstraps the system theme before the app is hydrated` because the raw app document did not contain the old inline body bootstrap style.

### Task 2: Restore Body Bootstrap

**Files:**
- Modify: `index.html`
- Modify: `src/client/index.less`

- [x] **Step 1: Add the old inline body bootstrap style**

In `index.html`, insert this immediately before the existing `data-rankland-theme-bootstrap` script:

```html
    <style>body{margin:0;background-color:#f0f2f5;opacity:0;transition:opacity 0.7s cubic-bezier(0.22, 0.61, 0.36, 1);}@media(prefers-color-scheme:dark){body{background-color:#000;}}</style>
```

- [x] **Step 2: Add the old Dark Reader cleanup script**

In `index.html`, insert this immediately inside `<body>` and before `<div id="app"></div>`:

```html
    <script>
      const __darkReaderInjected = document.head.querySelector('.darkreader');
      __darkReaderInjected && __darkReaderInjected.remove();
    </script>
```

- [x] **Step 3: Release body opacity after app CSS loads**

In `src/client/index.less`, add `opacity: 1;` to the existing top-level `body` rule:

```less
body {
  margin: 0;
  opacity: 1;
  font-size: 14px;
```

- [x] **Step 4: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts -g "bootstraps the system theme before the app is hydrated|syncs system theme and macOS Blink optimization after hydration"
```

Expected: PASS with raw document bootstrap assertions and hydrated opacity `1`.

Observed: PASS, 2 focused app-shell tests.

### Task 3: Broaden Verification And Docs

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-28-app-document-body-bootstrap-parity.md`

- [x] **Step 1: Run app-shell full-chain file**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts
```

Expected: all app-shell full-chain tests pass.

Observed: PASS, 8 app-shell full-chain tests.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node 24, pnpm 8, generated routes stable, migration tests pass, and whitespace check passes.

Observed: PASS with Node `v24.11.1`, pnpm `8.15.9`, 6 generated client routes, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 60 passed / 1 skipped full-chain Playwright tests, and `git diff --check`.

- [x] **Step 3: Update migration docs**

Record `App document body bootstrap parity`, focused RED/GREEN, app-shell full-chain, full gate evidence, and unchanged review-driven next focus.

- [x] **Step 4: Commit**

Commit as:

```bash
git commit -m "fix: 还原应用文档主体启动样式"
```

Committed as current `HEAD` with message `fix: 还原应用文档主体启动样式`.
