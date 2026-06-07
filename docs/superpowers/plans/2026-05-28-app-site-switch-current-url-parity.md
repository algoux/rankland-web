# App Site Switch Current URL Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the App shell site-switch link use old React `useCurrentUrl()` semantics for the current route path.

**Architecture:** Keep the App shell and Ant Design Vue dropdown as-is. Add one helper inside `App.vue` for deriving the site-switch path, then use it in `siteSwitchHref`.

**Tech Stack:** Vue 3 options API, Ant Design Vue shell, Playwright full-chain app-shell test.

---

## File Structure

- Modify: `src/client/App.vue`
- Modify: `tests/e2e/full-chain/app-shell.spec.ts`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

## Tasks

### Task 1: RED Test

- [x] Update `tests/e2e/full-chain/app-shell.spec.ts` to open `/search?kw=Test%202024&focus=no&%E8%81%9A%E7%84%A6=否#scoreboard`.
- [x] Keep the shell visible assertion.
- [x] Expect the site-switch href to be `//rl.algoux.cn/search?kw=Test%202024`.
- [x] Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts -g "renders the global shell"
```

- [x] Expected RED: fails because current `siteSwitchHref` includes `focus`, `聚焦`, and/or the hash from `$route.fullPath`.

### Task 2: Minimal Implementation

- [x] Add a helper in `src/client/App.vue` that strips hash and filters only query keys `focus` and `聚焦`.
- [x] Preserve remaining raw query segments and order.
- [x] Use that helper in `siteSwitchHref`.

### Task 3: GREEN Verification

- [x] Re-run the focused app-shell full-chain test.
- [x] Expected GREEN: site-switch link keeps only the legacy current URL path/query.

### Task 4: Migration Docs

- [x] Update `docs/migration/status.md` with current slice, route coverage evidence, latest gate, and next queue.
- [x] Update `docs/migration/manual-acceptance-checklist.md` with site-switch current URL filtering notes.
- [x] Update `docs/migration/final-integration-review.md` with the verified slice.

### Task 5: Full Gate And Commit

- [x] Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

- [x] Expected: Node 24, pnpm 8, route generation succeeds, migration tests pass, whitespace check passes.
- [x] Inspect `git status --short`.
- [x] Commit with:

```bash
git add src/client/App.vue tests/e2e/full-chain/app-shell.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-app-site-switch-current-url-parity-design.md docs/superpowers/plans/2026-05-28-app-site-switch-current-url-parity.md
git commit -m "fix: 还原站点切换当前地址过滤"
```
