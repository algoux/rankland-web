# Playground Editor Ready Marker Visual Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the Playground Monaco readiness probe from visible product UI while preserving the stable E2E selector and text.

**Architecture:** This is a CSS-only Playground parity slice backed by a full-chain Playwright regression. The Vue page keeps Monaco, the preview action, docs link, welcome modal, and preview rendering unchanged; only the marker's visual presentation changes.

**Tech Stack:** Vue 3 SFC scoped LESS, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Write the Failing Full-Chain Test

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`

- [ ] **Step 1: Add marker visual assertions**

In `hydrates the CSR playground and previews bundled SRK without upstream calls`, immediately after `await expectMonacoReady(page);`, add:

```ts
const editorReadyMarker = page.locator('[data-id="playground-editor-ready"]');
await expect(editorReadyMarker).toHaveText('ready');
await expect(editorReadyMarker).toHaveCSS('position', 'absolute');
await expect(editorReadyMarker).toHaveCSS('width', '1px');
await expect(editorReadyMarker).toHaveCSS('height', '1px');
await expect(editorReadyMarker).toHaveCSS('overflow', 'hidden');
await expect(editorReadyMarker).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
```

- [ ] **Step 2: Verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "hydrates the CSR playground"
```

Expected: FAIL because the marker currently computes as static-flow visible text, not an absolute hidden probe.

### Task 2: Hide the Marker in Product UI

**Files:**
- Modify: `src/client/modules/playground/playground.view.vue`

- [ ] **Step 1: Anchor the hidden probe locally**

Update `.playground-editor-pane`:

```less
.playground-editor-pane {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
}
```

- [ ] **Step 2: Hide `.playground-editor-ready`**

Replace the visible marker styling with:

```less
.playground-editor-ready {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  color: transparent;
}
```

- [ ] **Step 3: Verify GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "hydrates the CSR playground"
```

Expected: PASS.

### Task 3: Update Migration Records and Gate

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Record the verified slice**

Mention that `/playground` keeps Monaco readiness coverage while hiding the editor-ready marker from product UI.

- [ ] **Step 2: Run the completed-slice gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node 24, pnpm 8, router generation succeeds, migration tests pass, and whitespace check passes.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/client/modules/playground/playground.view.vue tests/e2e/full-chain/playground.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-playground-editor-ready-marker-visual-parity-design.md docs/superpowers/plans/2026-05-27-playground-editor-ready-marker-visual-parity.md
git commit -m "fix: 隐藏演练场编辑器就绪探针"
```
