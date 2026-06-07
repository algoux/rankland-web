# RankLand Migration Inventory

## Public Routes

| Route | Source file | Target module | Render method |
| --- | --- | --- | --- |
| `/` | `rankland-fe/src/pages/index.tsx` | `src/client/modules/home/home.view.vue` | SSR |
| `/search` | `rankland-fe/src/pages/search/index.tsx` | `src/client/modules/search/search.view.vue` | CSR |
| `/ranklist/:id` | `rankland-fe/src/pages/ranklist/[id].tsx` | `src/client/modules/ranklist/ranklist.view.vue` | SSR |
| `/collection/:id` | `rankland-fe/src/pages/collection/[id].tsx` | `src/client/modules/collection/collection.view.vue` | SSR |
| `/playground` | `rankland-fe/src/pages/playground/index.tsx` | `src/client/modules/playground/playground.view.vue` | CSR |
| `/live/:id` | `rankland-fe/src/pages/live/[id].tsx` | `src/client/modules/live/live.view.vue` | CSR |
| `/:catchAll(.*)` | `rankland-fe/src/pages/404.tsx` | `src/client/modules/fallback/not-found.view.vue` | CSR fallback |

## Shared Source Components

| Source file | Migration target |
| --- | --- |
| `src/layouts/index.tsx` | Vue app shell |
| `src/layouts/NavMenu.tsx` | Vue navigation component |
| `src/layouts/RightMenu.tsx` | Vue right menu component |
| `src/components/StyledRanklist.tsx` | Vue SRK validation wrapper |
| `src/components/StyledRanklistRenderer.tsx` | Vue SRK renderer wrapper |
| `src/components/SrkPlayground.tsx` | Vue playground component |
| `src/components/UserInfoModal.tsx` | Vue user modal integration |
| `src/components/plugins/ScrollSolution/ScrollSolution.tsx` | Vue live scroll-solution component |

## Shared Source Utilities

| Source file | Migration target |
| --- | --- |
| `src/utils/title-format.util.ts` | `src/client/utils/title-format.util.ts` |
| `src/utils/time-format.util.ts` | `src/client/utils/time-format.util.ts` |
| `src/utils/srk-asset.util.ts` | `src/client/utils/srk-asset.util.ts` |
| `src/utils/mini-cache.util.ts` | `src/client/utils/mini-cache.util.ts` |
| `src/utils/ranklist.util.ts` | `src/client/utils/ranklist.util.ts` |
| `src/utils/rank-time-data.util.ts` | `src/client/utils/rank-time-data.util.ts` |
| `src/utils/realtime-solutions.util.ts` | `src/client/utils/realtime-solutions.util.ts` |
