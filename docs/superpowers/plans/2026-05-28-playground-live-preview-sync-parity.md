# Playground Live Preview Sync Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore `/playground` live valid-source preview updates from Monaco `@change`.

**Architecture:** Keep parsing in the existing playground module. Add one pure sync helper that returns `draftSource` and `parseState` together, then use it in the Vue live-change, shortcut, and E2E-hook paths.

**Tech Stack:** Vue 3 options API, Vitest, Monaco via `@guolao/vue-monaco-editor`, existing `parsePlaygroundSrkSource`.

---

## File Structure

- Create: `src/client/modules/playground/playground-preview-sync.ts`
- Create: `tests/unit/playground-preview-sync.spec.ts`
- Modify: `src/client/modules/playground/playground.view.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

## Tasks

### Task 1: RED Test

- [x] Add `tests/unit/playground-preview-sync.spec.ts` with a helper behavior test and Vue source guard:

```ts
import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { syncPlaygroundPreviewSource } from '@client/modules/playground/playground-preview-sync';

describe('syncPlaygroundPreviewSource', () => {
  it('updates draft source and valid preview parse state from the same Monaco change value', () => {
    const source = '{"type":"general","name":"Live Preview Fixture","rows":[]}';

    const result = syncPlaygroundPreviewSource(source);

    expect(result.draftSource).toBe(source);
    expect(result.parseState).toMatchObject({
      kind: 'valid',
      data: {
        name: 'Live Preview Fixture',
      },
    });
  });

  it('returns invalid preview state for malformed live-change source', () => {
    const result = syncPlaygroundPreviewSource('{');

    expect(result.draftSource).toBe('{');
    expect(result.parseState.kind).toBe('invalid');
  });
});

describe('playground live preview wiring', () => {
  it('uses the shared sync helper for Monaco changes and keyboard preview', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/client/modules/playground/playground.view.vue'),
      'utf8',
    );

    expect(source).toContain("import { syncPlaygroundPreviewSource } from './playground-preview-sync';");
    expect(source).toContain('const nextState = syncPlaygroundPreviewSource(value);');
    expect(source).toContain('const nextState = syncPlaygroundPreviewSource(this.draftSource);');
    expect(source).toContain('this.parseState = nextState.parseState;');
  });
});
```

- [x] Run `corepack pnpm exec vitest run tests/unit/playground-preview-sync.spec.ts`.
- [x] Expected RED: fails because `playground-preview-sync.ts` does not exist and/or Vue source does not use it.

### Task 2: Minimal Implementation

- [x] Create `src/client/modules/playground/playground-preview-sync.ts`:

```ts
import { parsePlaygroundSrkSource, type PlaygroundSrkParseState } from './playground-srk';

export interface PlaygroundPreviewSyncState {
  draftSource: string;
  parseState: PlaygroundSrkParseState;
}

export function syncPlaygroundPreviewSource(source: string): PlaygroundPreviewSyncState {
  const draftSource = source || '';

  return {
    draftSource,
    parseState: parsePlaygroundSrkSource(draftSource),
  };
}
```

- [x] Update `src/client/modules/playground/playground.view.vue` to import the helper.
- [x] In `mounted()`, change the throttled `syncEditorSource` callback to call the helper and assign both `draftSource` and `parseState`.
- [x] In `previewSource()`, call the helper after `syncDraftSourceFromEditor()`.
- [x] In the E2E hook, call the helper so hook behavior matches the product state transition.

### Task 3: GREEN Verification

- [x] Run `corepack pnpm exec vitest run tests/unit/playground-preview-sync.spec.ts`.
- [x] Expected GREEN: the new helper tests and source guard pass.
- [x] Run `corepack pnpm exec vitest run tests/unit/playground-srk.spec.ts tests/unit/playground-preview-sync.spec.ts`.
- [x] Expected: both playground unit files pass.

### Task 4: Migration Docs

- [x] Update `docs/migration/status.md` current slice, latest full-gate note, `/playground` route coverage, known risk text, and next queue duplicate.
- [x] Update `docs/migration/manual-acceptance-checklist.md` with the live `@change` parity decision.
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
git add src/client/modules/playground/playground-preview-sync.ts src/client/modules/playground/playground.view.vue tests/unit/playground-preview-sync.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-playground-live-preview-sync-parity-design.md docs/superpowers/plans/2026-05-28-playground-live-preview-sync-parity.md
git commit -m "fix: 还原 Playground 编辑实时预览"
```
