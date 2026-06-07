# Playground Welcome Docs Copy Parity Design

## Goal

Restore the old React `/playground` welcome modal docs cue.

## Source Behavior

`rankland-fe/src/components/SrkPlayground.tsx` opens an Ant Design `Modal.info` after Monaco mounts. The third paragraph says:

- `需要参考 srk 文档？请点击右上角的`
- an inline `QuestionCircleOutlined` icon
- `图标。`

This copy points to the docs affordance in the top-right preview pane.

## Target Behavior

- The Vue welcome modal keeps the existing one-time `PlaygroundWelcomeMessageRead` persistence.
- The modal third paragraph matches the old right-top icon cue.
- The paragraph renders `QuestionCircleOutlined` inline.
- The migrated-only text `页面中的 srk 文档入口` is not shown.
- Existing Monaco readiness, modal OK behavior, preview docs link, and no-upstream-call behavior remain unchanged.

## Non-goals

- Do not change the welcome modal persistence key.
- Do not change modal width, close behavior, or OK button behavior.
- Do not change the preview-pane docs link itself.
- Do not change Monaco loader/version behavior.

## Test Strategy

- Extend the existing full-chain one-time welcome modal test.
- Assert old right-top cue copy, inline `anticon-question-circle`, and absence of the migrated-only docs-entry wording.
- Verify RED before implementation.
- Run focused GREEN, then full migration gate.

## Acceptance

- Focused welcome modal test fails before implementation because current Vue copy says `页面中的 srk 文档入口` and has no inline icon.
- Focused welcome modal test passes after implementation.
- Full migration gate passes:
  `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
