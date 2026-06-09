# Dev Contest Scripts

Temporary helpers for exercising the local contest event API.

```bash
AUTH_TOKEN=dev-token scripts/dev-contest/create-contest.ts
AUTH_TOKEN=dev-token scripts/dev-contest/append-events.ts 1 0 4
AUTH_TOKEN=dev-token scripts/dev-contest/append-events-interactive.ts scripts/dev-contest/event-fixtures/02-close-chase-ranking-series.json
AUTH_TOKEN=dev-token scripts/dev-contest/drop-events.ts
scripts/dev-contest/reset-dev-db.ts
```

Environment knobs:

- `DEV_SERVER_URL`, default `http://127.0.0.1:3000`
- `DEV_CONTEST_UK`, default `tmp-live-contest`
- `DEV_PRODUCER_ID`, default `tmp-producer`
- `AUTH_TOKEN`, must match the dev server's `AUTH_TOKEN`
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASS`, `MYSQL_DB` for `reset-dev-db.ts`

`append-events.ts` uses fixture indexes as `[start_index, end_index)`, matching `Array.slice()`.
Switch JSON/protobuf append mode by editing the `SEND_FORMAT` constant near the top of that file.

`append-events-interactive.ts` uses the fixed contest fixture from `fixtures.ts`, accepts `<event_fixture.json>`,
resets an existing stream on startup, uses the current server `streamRevision`, then sends one event from the JSON fixture for each Enter keypress. The JSON fixture can be
either a ProducerEvent array or an object with an `events` array.

Ready-made interactive event fixtures:

- `event-fixtures/01-result-coverage.json`: failed submissions, `AC`, progress, config change, and result changes.
- `event-fixtures/02-close-chase-ranking-series.json`: a longer close chase where several teams repeatedly overtake each other and move through the fixed 1/1/1 series segments.
- `event-fixtures/03-repeat-after-ac.json`: repeated submissions on the same problem after a prior `AC`, including later `WA`, `TLE`, and another `AC`.
- `event-fixtures/04-freeze-boundary.json`: pre-freeze submissions with post-freeze progress/settle/change events, plus submissions created after freeze.
- `event-fixtures/05-rejudge-fb-transfer.json`: rejudge sequence where a later result change transfers computed first blood.
- `event-fixtures/06-single-team-freeze-result-sequence.json`: one team repeatedly submits two problems with mixed visible and hidden result sequences across freeze.
