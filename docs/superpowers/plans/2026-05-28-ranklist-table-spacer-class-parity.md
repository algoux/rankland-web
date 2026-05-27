# Ranklist Table Spacer Class Parity Implementation Plan

> **For agentic workers:** Execute task-by-task. Keep checkboxes updated with observed evidence.

**Goal:** Remove the Vue-only `.rankland-ranklist-table-spacer` product class while preserving old React `div.mt-6` table spacer layout.

**Architecture:** Keep the Vue ranklist renderer and `data-id` test hook. Move any needed presentation to the old utility class already present in the component stylesheet.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - Capture Table Spacer Class Contract

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Tighten spacer class assertion**

In `renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend`, assert:

- spacer class list contains `mt-6`;
- spacer class list does not contain `rankland-ranklist-table-spacer`;
- existing margin checks remain unchanged.

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
```

Expected: FAIL because current Vue still renders `.rankland-ranklist-table-spacer`.

Observed: FAIL as expected. Playwright reported `Expected value: not "rankland-ranklist-table-spacer"` with received class list `["rankland-ranklist-table-spacer", "mt-6"]`.

### Task 2: GREEN - Remove Vue-Only Spacer Class

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove spacer product class**

Change the spacer to:

```vue
<div data-id="rankland-ranklist-table-spacer" class="mt-6" />
```

- [x] **Step 2: Remove now-unused class style**

Remove the `.rankland-ranklist-table-spacer` CSS rule. The spacer's layout remains driven by `.mt-6`.

- [x] **Step 3: Run focused GREEN**

Run the focused command from Task 1. Expected: PASS.

Observed: PASS, `1 passed (18.9s)`.

- [x] **Step 4: Run ranklist full-chain regression**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: PASS.

Observed: PASS, `9 passed (26.8s)`.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/superpowers/plans/2026-05-28-ranklist-table-spacer-class-parity.md`

- [x] **Step 1: Update migration docs**

Record:

- slice name: `Ranklist table spacer class parity`;
- RED evidence for the Vue-only spacer class;
- GREEN evidence for focused ranklist route test;
- ranklist full-chain regression and full gate evidence.

Observed: migration status, final integration review, and manual acceptance checklist now record the table spacer class parity RED/GREEN and ranklist regression evidence, with full gate marked pending until the fresh gate run completes.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated client routes, build/unit/SSR/shallow/full-chain migration tests green, and no whitespace errors.

Observed: PASS. `node -v` returned `v24.11.1`; `corepack pnpm -v` returned `8.15.9`; `gen:client-router` generated 8 client routes; `test:migration` passed build, 35 unit files / 152 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

- [x] **Step 3: Commit the completed slice**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-ranklist-table-spacer-class-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-table-spacer-class-parity.md
git diff --cached --check
git commit -m "fix: 还原榜单表格间隔类名"
```

Observed: prepared for commit after full gate passed and `git diff --check` passed.
