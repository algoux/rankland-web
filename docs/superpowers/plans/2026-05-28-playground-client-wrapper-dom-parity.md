# Playground Client Wrapper DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `/playground` route-level client wrapper DOM by inserting the plain no-class `div` that hosted the dynamically loaded `SrkPlayground` component.

**Architecture:** Keep the hidden hydration marker as a direct route-root probe, then add a plain product wrapper after it. The existing `DIV.srk-playground-container` remains unchanged inside that wrapper, so layout CSS and existing tests continue to target the legacy playground container.

**Tech Stack:** Vue 3 SFC template, Playwright full-chain E2E, Node 24, pnpm 8.

---

### Task 1: RED - capture old route-level client wrapper

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`

- [x] **Step 1: Extend `getPlaygroundShellChrome()`**

Add `routeChildren` to the helper:

```ts
const routeChildren = Array.from(pageElement.children)
  .filter((child) => child instanceof HTMLElement)
  .map((child) => {
    const element = child as HTMLElement;
    return {
      classes: Array.from(element.classList),
      dataId: element.dataset.id || '',
      firstElementClasses: element.firstElementChild instanceof HTMLElement
        ? Array.from(element.firstElementChild.classList)
        : [],
      firstElementTagName: element.firstElementChild?.tagName || '',
      tagName: element.tagName,
    };
  });
```

Return `routeChildren` with the existing shell fields.

- [x] **Step 2: Assert the old wrapper shape**

Extend the existing `getPlaygroundShellChrome(page)` assertion:

```ts
routeChildren: [
  {
    classes: ['playground-hydrated'],
    dataId: 'playground-hydrated',
    tagName: 'DIV',
  },
  {
    classes: [],
    dataId: '',
    firstElementClasses: ['srk-playground-container'],
    firstElementTagName: 'DIV',
    tagName: 'DIV',
  },
],
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts -g "hydrates the CSR playground"
```

Observed RED: FAIL because current Vue exposed `.srk-playground-container` directly as route child 1, and its first element child was `.playground-editor-pane` instead of wrapping the container in a plain no-class `DIV`.

### Task 2: GREEN - restore the plain client wrapper

**Files:**
- Modify: `src/client/modules/playground/playground.view.vue`

- [x] **Step 1: Wrap the playground component content**

Change:

```vue
<div class="srk-playground-container" :style="{ height: `${remainingHeight}px` }">
  ...
</div>

<a-modal
```

to:

```vue
<div>
  <div class="srk-playground-container" :style="{ height: `${remainingHeight}px` }">
    ...
  </div>
</div>

<a-modal
```

Keep the modal outside the wrapper.

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts -g "hydrates the CSR playground"
```

Observed GREEN: PASS with `1 passed`.

### Task 3: Migration docs, full gate, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Update migration docs**

Record this slice as `Playground client wrapper DOM parity`, including:

- old React route-level `<div>{isBrowser() ? <SrkPlayground /> : <Loading />}</div>` evidence;
- route root child order after the hidden hydration marker;
- plain no-class wrapper around `DIV.srk-playground-container`;
- focused RED/GREEN evidence;
- full gate evidence.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Observed: PASS. Node `v24.11.1`, pnpm `8.15.9`, generated 6 client routes, build passed, 36 unit files / 154 unit tests passed, 1 SSR smoke test passed, 1 shallow Playwright test passed, 60 full-chain tests passed with 1 conditional skip, and `git diff --check` produced no output.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/modules/playground/playground.view.vue tests/e2e/full-chain/playground.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-playground-client-wrapper-dom-parity-design.md docs/superpowers/plans/2026-05-28-playground-client-wrapper-dom-parity.md
git commit -m "fix: 还原 Playground 客户端承载层"
```

- [x] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Observed: committed as `fix: 还原 Playground 客户端承载层`; post-checks reported clean branch status and no whitespace errors.
