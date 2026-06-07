# App Document Head Meta Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React document-level head defaults in the Vue migration's `index.html`.

**Architecture:** Keep route-specific head rendering unchanged. Add full-chain raw HTML coverage in the app-shell suite, then update only the static `index.html` document defaults to match old `document.ejs` while preserving the existing Vue app mount and theme bootstrap script.

**Tech Stack:** Vite HTML template, Vue 3, Playwright full-chain E2E.

---

### Task 1: RED Coverage

**Files:**
- Modify: `tests/e2e/full-chain/app-shell.spec.ts`

- [x] **Step 1: Add legacy document head assertions**

In the existing `bootstraps the system theme before the app is hydrated` test, after `const html = await response.text();`, add:

```ts
expect(html).toContain('lang="zh-Hans"');
expect(html).toContain(
  '<meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=0.5,maximum-scale=1.0,user-scalable=yes"',
);
expect(html).toContain(
  '<meta name="description" content="专业的算法竞赛榜单平台，收录 ICPC、CCPC 等各类赛事的榜单。"',
);
expect(html).toContain(
  '<meta name="keywords" content="RankLand,programming,algorithm,ranklist,standings,编程,算法,竞赛,程序设计,ICPC,CCPC,榜单,排名"',
);
expect(html).toContain('<meta name="color-scheme" content="dark light"');
expect(html).toContain('<meta name="darkreader-lock"');
expect(html).toContain('<meta property="og:site_name" content="RankLand"');
expect(html).toContain('<meta property="og:description" content="RankLand: 专业算竞榜单平台"');
expect(html).toContain('<meta property="og:type" content="website"');
expect(html).toContain('<meta property="og:locale" content="zh_CN"');
expect(html).toContain('<meta name="twitter:card" content="summary_large_image"');
expect(html).toContain('<title>RankLand</title>');
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts -g "bootstraps the system theme before the app is hydrated"
```

Expected: FAIL because the current document still uses `lang="zh-cmn-Hans"`, the Vite starter viewport, and `bwcx Demo`.

Observed: FAIL because the current raw HTML still contained `lang="zh-cmn-Hans"`, the short Vite viewport, and the starter `bwcx Demo` title.

### Task 2: Restore Static Document Defaults

**Files:**
- Modify: `index.html`

- [x] **Step 1: Update the document head**

Change the opening document and head defaults to:

```html
<!DOCTYPE html>
<html lang="zh-Hans">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=0.5,maximum-scale=1.0,user-scalable=yes" />
    <meta name="description" content="专业的算法竞赛榜单平台，收录 ICPC、CCPC 等各类赛事的榜单。" />
    <meta name="keywords" content="RankLand,programming,algorithm,ranklist,standings,编程,算法,竞赛,程序设计,ICPC,CCPC,榜单,排名" />
    <meta name="color-scheme" content="dark light" />
    <meta name="darkreader-lock" />
    <meta property="og:site_name" content="RankLand" />
    <meta property="og:description" content="RankLand: 专业算竞榜单平台" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="zh_CN" />
    <meta name="twitter:card" content="summary_large_image" />
    <title>RankLand</title>
```

Keep the existing `data-rankland-theme-bootstrap` script, app mount, and module script unchanged.

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts -g "bootstraps the system theme before the app is hydrated"
```

Expected: PASS with the legacy static document head defaults and existing theme bootstrap assertions.

Observed: PASS with legacy `lang`, viewport, SEO/OpenGraph/Twitter meta, fallback title, and existing theme bootstrap assertions.

### Task 3: Broaden Verification And Docs

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Run app-shell full-chain file**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts
```

Expected: all app-shell full-chain tests pass.

Observed: all 8 app-shell full-chain tests passed.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node 24, pnpm 8, generated routes stable, migration tests pass, and whitespace check passes.

Observed: Node v24.11.1, pnpm 8.15.9, generated 6 client routes, migration tests passed, and whitespace check passed.

- [x] **Step 3: Update migration docs**

Record `App document head meta parity`, focused RED/GREEN, app-shell full-chain, full gate evidence, and unchanged review-driven next focus.

Observed: `docs/migration/status.md`, `docs/migration/manual-acceptance-checklist.md`, and `docs/migration/final-integration-review.md` now record the document head RED/GREEN, app-shell full-chain 8-test evidence, full gate evidence, and unchanged review-driven next focus.

- [x] **Step 4: Commit**

Committed as:

```bash
git commit -m "fix: 还原应用文档头部元信息"
```
