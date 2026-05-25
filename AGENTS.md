# Agent Instructions

## Project Context

`rankland-web` is the Vue 3 + bwcx + vite-ssr migration target for the old `rankland-fe` React frontend.

The migration should preserve public routes, SSR behavior where it matters for SEO, RankLand API semantics, and the user-visible behavior documented in the existing migration specs.

## Working Principles

- Preserve public route compatibility with `rankland-fe`.
- Prefer SSR for SEO-sensitive pages such as home, ranklist detail, and collection pages.
- Prefer CSR for browser-only workflows such as playground and live ranklist interactions.
- Do not embed React in the Vue app. Port shared behavior into Vue components, composables, or framework-neutral utilities.
- Keep generated router files generated. Do not hand-edit generated route outputs under `src/client/router` or `src/common/router`.
- Protect user changes already present in the worktree. Do not revert unrelated edits.
- Avoid unrelated refactors. Keep migration slices small and verifiable.
- When changing UI, aim for migration equivalence before redesigning product behavior or visual language.

## Repository Boundaries

- `src/client`: Vue views, client components, browser code, and SSR-compatible frontend logic.
- `src/server`: bwcx/Koa server modules, controllers, middleware, render services, and server-only integrations.
- `src/common`: shared DTOs, RPOs, API contracts, enums, router metadata, and code that is safe for both server and client runtimes.
- `tests/unit`: focused unit coverage for shared logic, adapters, route helpers, and utilities.
- `tests/ssr`: SSR smoke coverage.
- `tests/e2e`: Playwright coverage, including full-chain migration scenarios.
- `docs/migration`: migration inventory and API contract references.
- `docs/superpowers/specs` and `docs/superpowers/plans`: accepted migration designs and implementation plans.

Read `docs/migration/playbook.md` and the relevant migration documents before changing a route, data contract, SSR path, or cross-runtime helper.

## Common Commands

Use Node.js `^24.0.0` and pnpm `^8.0.0`; `.node-version` currently pins `v24.11.1`, and `package.json` pins `packageManager` to `pnpm@8.15.9`.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm run dev
corepack pnpm run build
corepack pnpm test:unit
corepack pnpm test:ssr
corepack pnpm test:e2e
corepack pnpm test:e2e:full-chain
corepack pnpm test:migration
```

## Testing Guidance

- For narrow utility or adapter changes, run the closest unit test.
- For SSR behavior changes, run the relevant SSR test and any affected unit tests.
- For route, migration, data-loading, or full-chain behavior changes, prefer `pnpm test:migration`.
- For documentation-only changes, inspect the rendered or diffed document content; a runtime build is not required.

## Comments

Add concise Chinese comments where they clarify non-obvious behavior, especially:

- business rules;
- migration differences from `rankland-fe`;
- SSR/CSR runtime boundaries;
- API error mapping;
- cache behavior;
- generated-code constraints.

Do not add comments that only restate obvious code.

## Commits

Use Conventional Commits format with a Chinese description:

```text
docs: 添加 agent 工作约定
feat: 迁移榜单详情页基础视图
fix: 修复榜单路由参数类型
test: 补充全链路榜单页面覆盖
```
