# Route Content Utility Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `mt-8 mb-8` utility class tokens on loaded `/ranklist/:id` and `/live/:id` content wrappers.

**Architecture:** Keep the change route-local. Full-chain tests assert DOM class tokens and existing computed spacing on real mock-backed routes; Vue implementation only updates wrapper classes and local utility spacing declarations without touching data flow, SRK rendering, or WebSocket behavior.

**Tech Stack:** Vue 3 SFC scoped LESS, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - capture loaded content class tokens

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Add ranklist content class assertions**

In `tests/e2e/full-chain/ranklist.spec.ts`, immediately after the existing visible assertion for `[data-id="ranklist-content"][data-ranklist-id="test-key"][data-row-count="2"]`, add:

```ts
await expect(page.locator('[data-id="ranklist-content"]')).toHaveClass(/(^|\s)mt-8(\s|$)/);
await expect(page.locator('[data-id="ranklist-content"]')).toHaveClass(/(^|\s)mb-8(\s|$)/);
```

- [x] **Step 2: Add live content class assertions**

In `tests/e2e/full-chain/live.spec.ts`, immediately after the existing visible assertion for `[data-id="live-ranklist-content"][...]`, add:

```ts
await expect(page.locator('[data-id="live-ranklist-content"]')).toHaveClass(/(^|\s)mt-8(\s|$)/);
await expect(page.locator('[data-id="live-ranklist-content"]')).toHaveClass(/(^|\s)mb-8(\s|$)/);
```

- [x] **Step 3: Run focused tests to verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"
```

Observed RED: ranklist failed with received class `ranklist-content`; live failed with received class `live-content live-content-with-scroll-solution`.

### Task 2: GREEN - restore class tokens and spacing contract

**Files:**
- Modify: `src/client/modules/ranklist/ranklist.view.vue`
- Modify: `src/client/modules/live/live.view.vue`

- [x] **Step 1: Update loaded wrapper class attributes**

Change:

```vue
class="ranklist-content"
```

to:

```vue
class="ranklist-content mt-8 mb-8"
```

Change:

```vue
class="live-content"
```

to:

```vue
class="live-content mt-8 mb-8"
```

- [x] **Step 2: Keep route-local utility spacing explicit**

In each route's scoped style, keep the old computed spacing explicit through route-local utility selectors:

```less
.mt-8 {
  margin-top: 32px;
}

.mb-8 {
  margin-bottom: 32px;
}
```

For ranklist, remove the route-specific `margin: 32px 0` if it becomes redundant.

For live, keep `.live-content` responsible for horizontal margins and use `mt-8` / `mb-8` for vertical spacing.

- [x] **Step 3: Run focused tests to verify GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"
```

Observed GREEN: both focused full-chain tests passed with class tokens and existing computed spacing.

### Task 3: Full gate, docs, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Observed: Node `v24.11.1`, pnpm `8.15.9`, generated 8 routes, `test:migration` passed, and `git diff --check` passed.

- [x] **Step 2: Update migration docs**

Record:

- slice name: `Route content utility class parity`
- RED/GREEN evidence for ranklist and live loaded wrappers
- full gate evidence
- route progress updates for `/ranklist/:id` and `/live/:id`

- [x] **Step 3: Stage and commit**

Run:

```bash
git add src/client/modules/ranklist/ranklist.view.vue src/client/modules/live/live.view.vue tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts docs/superpowers/specs/2026-05-27-route-content-utility-class-parity-design.md docs/superpowers/plans/2026-05-27-route-content-utility-class-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git diff --cached --check
git commit -m "fix: 还原路由内容间距类名"
```
