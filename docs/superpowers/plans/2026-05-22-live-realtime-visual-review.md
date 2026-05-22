# Live Realtime Visual Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic full-chain visual-layout coverage for the `/live/:id` realtime scroll-solution panel.

**Architecture:** Reuse the existing full-chain mock backend and browser WebSocket stub. Add a test-only helper to emit one realtime solution, then assert element bounding boxes on desktop and mobile. Keep runtime code unchanged unless the new test reveals a concrete defect.

**Tech Stack:** Playwright full-chain E2E, Vue live page, local mock RankLand backend.

---

## File Structure

- Modify `tests/e2e/full-chain/live.spec.ts` for the visual-layout test.
- Modify `src/client/components/rankland-ranklist.vue` if the visual-layout test exposes shared renderer layout overflow.
- Modify `.gitignore` so generated Playwright `test-results/` screenshots do not appear as untracked files.
- Modify `docs/migration/status.md` after verification.
- Create `docs/superpowers/specs/2026-05-22-live-realtime-visual-review-design.md`.
- Create `docs/superpowers/plans/2026-05-22-live-realtime-visual-review.md`.

## Tasks

### Task 1: Add realtime visual-layout coverage

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Add a WebSocket emit helper**

Add a small `emitRealtimeSolution(page, url)` helper near `makeRealtimeSolutionBytes()` that calls the existing browser-side `__ranklandEmitWsMessage` hook with `makeRealtimeSolutionBytes()`.

- [x] **Step 2: Add a layout measurement helper inside the new test**

Inside the new test, use `page.evaluate()` to return `getBoundingClientRect()` values for:

- `[data-id="live-scroll-solution"]`;
- `[data-id="live-scroll-solution-item"]`;
- `[data-id="live-ranklist-content"]`;
- `window.innerWidth` and `window.innerHeight`.

- [x] **Step 3: Add desktop and mobile assertions**

The test should assert:

- desktop panel width is 250px;
- desktop panel is within the viewport and bottom-left anchored;
- first realtime row is visible and 45px high;
- desktop ranklist content starts at or after 250px;
- after resizing to `390x844`, the panel remains within viewport bounds and the row remains visible.
- mobile progress right-side time text remains within viewport bounds.
- desktop and mobile screenshots are attached as `live-realtime-desktop` and `live-realtime-mobile`.

### Task 2: Verify live full-chain behavior

**Files:**
- Read/verify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Run the live full-chain file**

Run:

```bash
FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts
```

Result: first run exposed a mobile progress label defect: `.srk-progress-secondary-area-right` ended at `420.46875px` in a `390px` viewport. After adding screenshot output and the mobile progress CSS fix, the live full-chain file passed 6 `/live/:id` tests.

### Task 2.5: Fix mobile progress label overflow

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add the minimal mobile override**

Add a scoped mobile `:deep` override under `.rankland-ranklist-progress` so `.srk-progress-secondary-area` can wrap and its left/right labels use `min-width: 0` with flexible 140px bases.

- [x] **Step 2: Re-run live full-chain**

Run:

```bash
FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts
```

Result: passed 6 `/live/:id` full-chain tests and regenerated desktop/mobile screenshot files under `test-results`.

### Task 3: Update docs and commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-22-live-realtime-visual-review.md`

- [x] **Step 1: Update migration status**

Set current slice to `live realtime visual review`, record the live full-chain gate, and note that desktop/mobile realtime layout plus mobile progress labels have deterministic coverage.

- [x] **Step 2: Check off completed plan tasks**

Result: completed after verification and `docs/migration/status.md` update.

- [x] **Step 3: Verify diff and commit**

Run:

```bash
git diff --check
git diff -- .gitignore tests/e2e/full-chain/live.spec.ts src/client/components/rankland-ranklist.vue docs/migration/status.md docs/superpowers/specs/2026-05-22-live-realtime-visual-review-design.md docs/superpowers/plans/2026-05-22-live-realtime-visual-review.md
git add .gitignore tests/e2e/full-chain/live.spec.ts src/client/components/rankland-ranklist.vue docs/migration/status.md docs/superpowers/specs/2026-05-22-live-realtime-visual-review-design.md docs/superpowers/plans/2026-05-22-live-realtime-visual-review.md
git commit -m "test: 补充实时榜单视觉布局审查"
```

Result: `git diff --check` passed. The reviewed diff contains the Playwright visual-layout test, the mobile progress label CSS fix, migration docs, and `.gitignore` coverage for generated `test-results/` screenshots.
