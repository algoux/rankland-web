# App Site Switch Button px-2 Class Parity Design

## Context

The old React `RightMenu` renders the site-switch trigger as:

```tsx
<Button type="text" className="px-2">切换</Button>
```

The Vue app shell already preserves the Ant Design Vue text button shape and the visible 8px horizontal padding through `.app-site-switch`, but it does not preserve the old `px-2` class token on the button. Earlier app-shell slices restored the dropdown link and menu content DOM contracts; this slice closes the remaining trigger-button class contract.

## Decision

Restore the old trigger-button utility-class contract while preserving the migrated hook:

- Add `px-2` to the site-switch trigger button class list.
- Add a global `.px-2` utility rule with `padding-left: 8px` and `padding-right: 8px`.
- Keep `.app-site-switch` on the same button and keep its current display, height, min-height, color, radius, hover, dropdown trigger behavior, and route-aware menu behavior.
- Do not change the dropdown content, href construction, Ant Design Vue Button/Dropdown/Menu usage, theme sync, analytics, or focus-mode behavior.

## Test Strategy

Use the existing app-shell full-chain test because this is public app-shell DOM and presentation:

- Probe the site-switch trigger class list and computed horizontal padding.
- Verify RED before implementation: current Vue button computes the old padding but lacks the old `px-2` class token.
- Verify GREEN after implementation: trigger contains both `app-site-switch` and `px-2`, while computed left/right padding remains `8px`.
- Run the full migration gate before committing.

## Acceptance Criteria

- The site-switch trigger remains an Ant Design Vue text button and dropdown trigger.
- The trigger class list includes `app-site-switch` and old `px-2`.
- The trigger computes `padding-left: 8px` and `padding-right: 8px`.
- Existing app-shell navigation, site-switch href/target/rel, dropdown menu content, theme, analytics, focus mode, and viewport coverage remain unchanged.
- Migration status, manual acceptance checklist, and final integration review record this slice.
