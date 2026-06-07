# Ranklist Modal Parity Design

## Goal

Port the next small `StyledRanklistRenderer` behavior into the shared Vue `RanklandRanklist` wrapper: clicking a user opens a user modal, and clicking a status with solution history opens a solution modal.

## Source Behavior

The old React `StyledRanklistRenderer`:

- handles `onUserClick` from the SRK table;
- opens `UserInfoModal` for the clicked user;
- handles `onSolutionClick`;
- opens `DefaultSolutionModal` with the clicked user, problem, and solution history;
- closes the other modal when one opens.

## Scope

This slice includes:

- wire Vue renderer `user-click` and `solution-click` events in `rankland-ranklist.vue`;
- render `DefaultUserModal` and `DefaultSolutionModal` from `@algoux/standard-ranklist-renderer-component-vue`;
- keep the modal behavior shared for all pages using `RanklandRanklist`;
- add solution history to the deterministic SRK fixture so the solution cell is clickable in full-chain tests;
- extend live full-chain coverage to click a user and a solution cell.

## Non-Goals

This slice does not migrate the custom React `UserInfoModal` rank-time chart, asset URL rewriting, user photo/team member presentation beyond the package default modal, custom modal widths matching every breakpoint, or export/share menus.

## Test Strategy

Full-chain E2E:

- `/live/:id` renders rows through `RanklandRanklist`;
- clicking `Team Alpha` opens the user modal and shows the user name and organization;
- closing the user modal works;
- clicking Team Alpha's accepted status opens the solution modal and shows the problem title and `AC` history.

## Acceptance Criteria

- User and solution clicks no longer no-op in the migrated Vue wrapper.
- Existing live full-chain API/WebSocket/control assertions still pass.
- `corepack pnpm test:migration` and `git diff --check` pass before commit.
