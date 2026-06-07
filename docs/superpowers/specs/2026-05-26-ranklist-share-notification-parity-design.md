# Ranklist Share Notification Parity Design

## Goal

Restore the old React share-copy success feedback in the Vue SRK wrapper.

## Old React Baseline

`rankland-fe/src/components/StyledRanklistRenderer.tsx` uses Ant Design notification when a share action copies successfully:

```tsx
notification.success({
  message: '链接已复制',
  duration: 2,
  style: {
    width: 280,
  },
});
```

The same notification pattern is used for `嵌入代码已复制`.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` currently writes success messages into the header inline `actionStatus` span:

```ts
await this.writeClipboardText(text);
this.actionStatus = successMessage;
```

That makes copying functional, but the visible feedback differs from the old product behavior.

## Scope

- Add full-chain coverage that ranklist copy-link shows an Ant Design notification with `链接已复制`.
- Add full-chain coverage that ranklist copy-embed and live copy-embed show an Ant Design notification with `嵌入代码已复制`.
- Use Ant Design Vue `notification.success` for successful share copy actions.
- Keep clipboard contents, share menu items, export action statuses, and copy failure inline status unchanged.
- Update migration status after verification.

## Non-Goals

- Do not change export success/failure feedback in this slice.
- Do not change share URL or embed code generation.
- Do not change notification placement, theme, or global app config beyond using the Ant Design Vue default.

## Test Strategy

Update existing full-chain tests that already click share-copy actions and assert clipboard contents. Replace copy-success inline status assertions with notification assertions. The tests should fail before implementation because no `.ant-notification-notice-message` is rendered for copy success.

## Acceptance Criteria

- Focused ranklist/live full-chain tests fail before implementation because copy success notification is absent.
- Focused ranklist/live full-chain tests pass after implementation.
- Existing clipboard content assertions remain green.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records this verified slice.
