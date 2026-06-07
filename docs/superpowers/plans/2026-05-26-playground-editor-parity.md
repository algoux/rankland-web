# Playground Editor Parity Plan

## Scope

Replace the current textarea playground editor with client-only Monaco editor behavior aligned with `rankland-fe`, including SRK schema diagnostics, theme switching, and remaining-height layout.

## File Set

- `package.json`
- `pnpm-lock.yaml`
- `vite.config.js`
- `src/server/index.ts`
- `tests/unit/playground-monaco.spec.ts`
- `tests/unit/vite-config.spec.ts`
- `tests/e2e/full-chain/playground.spec.ts`
- `src/client/modules/playground/playground-monaco-loader.ts`
- `src/client/modules/playground/playground-monaco.ts`
- `src/client/modules/playground/playground.view.vue`
- `docs/migration/status.md`
- `docs/superpowers/specs/2026-05-26-playground-editor-parity-design.md`
- `docs/superpowers/plans/2026-05-26-playground-editor-parity.md`

## Steps

1. Add failing tests:
   - unit tests for diagnostics/theme helper behavior;
   - full-chain tests for Monaco-ready DOM, stable preview states, and dark theme mapping.
2. Confirm focused tests fail for missing Monaco editor/helper behavior.
3. Attempt old-app version parity with `monaco-editor@0.34.0` and `vite-plugin-monaco-editor@1.1.0`; reject it after Vite 2 full-chain dev serving hangs on Monaco ESM import paths.
4. Add `@guolao/vue-monaco-editor@1.6.0` and `monaco-editor@0.43.0`.
5. Add `playground-monaco.ts` helpers for diagnostics options and theme mapping.
6. Add `playground-monaco-loader.ts` and serve local `/monaco-editor/vs` assets from Koa so the Monaco loader does not depend on a CDN.
7. Update `playground.view.vue` to mount Monaco client-side, synchronize source, preview on command, and calculate remaining height.
8. Extend `vite.config.js` coverage for Monaco dependency optimization.
9. Run focused unit and Playground full-chain gates.
10. Run `corepack pnpm run build` as an early production-bundle check.
11. Run `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check`.
12. Update `docs/migration/status.md` and commit the slice.

## Verification

Expected commands:

```bash
corepack pnpm test:unit -- tests/unit/playground-monaco.spec.ts tests/unit/vite-config.spec.ts
corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/playground.spec.ts
corepack pnpm run build
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

## Non-goals

- Do not change SRK parser semantics.
- Do not change route metadata or generated router outputs manually.
- Do not implement broader SRK renderer visual parity in this slice.
