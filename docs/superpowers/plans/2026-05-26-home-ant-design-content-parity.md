# Home Ant Design Content Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React Home page's Ant Design card/grid content layout in Vue.

**Architecture:** Register Ant Design Vue `Card`, `Row`, and `Col` alongside the existing global Ant Design components. Replace only the Home recommendation/tool card wrappers with `a-row`, `a-col`, and `a-card`, preserving the existing stable selectors, routes, assets, and SSR/head data flow.

**Tech Stack:** Vue 3 Options API, ant-design-vue, bwcx/vite-ssr, Playwright full-chain E2E.

---

## File Map

- Modify `src/client/main.ts` to register `Card`, `Col`, and `Row`.
- Modify `src/client/modules/home/home.view.vue` recommendation/tool markup and related scoped CSS.
- Modify `tests/e2e/full-chain/home.spec.ts` to assert Ant Design Vue card/grid parity.
- Add this design spec and implementation plan.
- Update `docs/migration/status.md` after verification.

## Tasks

- [x] Write this spec and plan for the Home Ant Design content parity slice.
- [x] Add RED full-chain assertions for Home Ant Design card/grid DOM.
- [x] Run focused Home full-chain and confirm failure on missing `.ant-card`/`.ant-row`/`.ant-col`.
- [x] Register Ant Design Vue Card/Row/Col in `src/client/main.ts`.
- [x] Replace Home recommendation/tool custom grid markup with `a-row`, `a-col`, and hoverable `a-card`.
- [x] Run focused Home full-chain until green.
- [x] Run `corepack pnpm run gen:client-router`.
- [x] Run `corepack pnpm test:migration`.
- [x] Run `git diff --check`.
- [x] Update `docs/migration/status.md`.
- [x] Commit with `feat: 收口首页内容卡片一致性`.
