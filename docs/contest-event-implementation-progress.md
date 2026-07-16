# Contest Event Refactor Implementation Progress

Updated: 2026-07-16

## Decisions

- ORM: TypeORM on MySQL/TDSQL-C. Business logic uses TypeORM repositories, transactions, and query runners rather than direct `mysql2` calls.
- Schema management: `synchronize: false`; migrations are the only schema mutation path.
- Naming: API/DTO/service/entity properties use camelCase; MySQL columns use snake_case through explicit TypeORM mappings.
- Local default DB: `mysql://blue:test@127.0.0.1:3306/rankland`.
- Production DB: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASS`, and `MYSQL_DB` are required when `NODE_ENV=production`; local defaults are only used outside production.
- Startup migration: disabled. Schema changes are applied only by explicitly running `pnpm run db:migration:run`.
- Migration generation: `db:migration:generate` compares entities with the configured database and writes a new migration file.
- Realtime channel: SSE notifications plus HTTP catch-up. SSE sends only `latestEventId` and `streamRevision`.
- Notification rollout: the multi-instance event-availability implementation is complete: local Hub first, Redis Pub/Sub acceleration, unconditional MySQL reconciliation, and unchanged public SSE payload. Real two-machine and browser auto-reconnect checks remain release-environment gates.
- Producer identity: every append request must include `x-token` and `x-producer-id`. The first producer claims the stream lock. Administrators release the lock through HTTP API.
- Event time: stored and emitted as nanoseconds using int64-compatible values.
- Database wall-clock time: every `DATETIME(6)` column stores a UTC wall-clock value. mysql2 encodes/decodes JavaScript `Date` values as UTC and every acquired MySQL session is initialized to `+00:00`; see [MySQL DATETIME UTC](mysql-datetime-utc.md).
- Frozen submissions: consumer catch-up hides progress/result events for solutions whose `NEW_SOLUTION.time` is inside the frozen window; write-side denormalization keeps this cheap for many consumers.

## Implemented

- Added TypeORM entities and migration for:
  - `contest`
  - `contest_user`
  - `contest_event_stream`
  - `contest_event`
- Normalized contest naming in server/common modules from legacy contest/member terminology to contest/user terminology.
- Reworked the initial migration directly; no incremental migration was added for the table rename.
- Kept `uk` unique on `contest` and removed redundant `uk` storage from `contest_event_stream`.
- Switched MySQL column names to snake_case while keeping TypeScript DTO/service/entity properties in camelCase through explicit TypeORM column mappings.
- Changed string-capable contest user fields (`name`, `avatar`, `photo`, `organization`) to MySQL `text` with a transformer that keeps scalar strings unquoted while preserving JSON-backed I18N values and legacy reads.
- Standardized all eight `datetime` columns across the four contest tables on microsecond precision (`datetime(6)`).
- Standardized UTC semantics for those eight contest `datetime(6)` columns plus the two `id_worker_registry` columns without changing their schema or rewriting historical rows.
- Migrated contest, contest-user, and contest-event row identities plus all `contest_id` references from UUID/varchar columns to Snowflake `BIGINT UNSIGNED` columns while retaining decimal strings in TypeScript and JSON.
- Added `id_worker_registry`, a process-level generator service, MySQL named-lock worker ownership, and persistent logical timestamp fencing. See [Contest ID Generation](contest-id-generation.md).
- Replaced contest persistence with MySQL-backed TypeORM repositories.
- Added append-only event stream logic:
  - batch protobuf decode and verification
  - strictly increasing batch event ids
  - persisted high-water mark gap check
  - one-query payload hash idempotency check for all event ids in the appended batch
  - bulk insert for newly accepted event rows after validation
  - producer lock enforcement and admin release
  - nanosecond normalization
  - semantic payload checks for required ids, strings, time, raw result enums, deprecated `FZ` fallback allowance, forbidden `FB`, and progress range
  - write-side `solution_submit_time_ns` denormalization for progress/result events
- Added HTTP APIs:
  - `POST /api/v2/contests`
  - `PATCH /api/v2/contests/:uk`
  - `GET /api/v2/contests/:uk`
  - `GET /api/v2/public/contests/:uk`
  - `GET /api/v2/contests/:uk/users`
  - `GET /api/v2/contests/:uk/users/:userId`
  - `PATCH /api/v2/contests/:uk/users/:userId`
  - `GET /api/v2/public/contests/:uk/users`
  - `GET /api/v2/public/contests/:uk/users/:userId`
  - `POST /api/v2/contests/:uk/events` for direct JSON or protobuf event batches
  - `GET /api/v2/public/contests/:uk/events` for catch-up
  - `GET /api/v2/contests/:uk/event-stream` for admin inspection
  - `GET /api/v2/public/contests/:uk/event-stream` for public bootstrap
  - `GET /api/v2/public/contests/:uk/event-stream/notifications` for SSE notifications
  - `DELETE /api/v2/contests/:uk/event-stream/producer-lock` for admin lock release
  - `POST /api/v2/contests/:uk/events/reset` for stream reset
  - contest/user APIs now use MySQL and expose the `users` field
- Refactored the contest-specific protobuf/SSE middleware into generic, metadata-driven infrastructure:
  - Capability decorators `@ProtobufContract(req?, resp?)` and `@Sse()` declare route capabilities as metadata.
  - Global `ContentNegotiationMiddleware` resolves the response content type from `Accept` + supported types
    onto `ctx.state.respContentType` (prefers JSON on tie/no priority; `406` for strict routes with no match).
  - Global `ProtobufMiddleware` decodes protobuf request bodies before validation (`415`/`413`/`400`).
  - Global `SseMiddleware` does generic SSE plumbing; the SSE business hookup is now a `@Sse()` controller route.
  - `DefaultResponseHandler` wraps success generically (JSON `{success,code,data}` or protobuf-encode + `X-RL-*`);
    exception handlers wrap failure generically (JSON body or empty protobuf body + `X-RL-*` headers).
  - Removed `ContestEventMiddleware`, `contest-event-response.ts`, `binary-response.ts`, and the manual
    `createContestEventBinaryResponse` wrapping; the events endpoints no longer carry protobuf-first logic.
- Catch-up reads stream state and event page in one MySQL snapshot and filters by the same `streamRevision`.
- Catch-up requires `streamRevision`; a stale revision returns an empty reset envelope with `resetRequired: true`.
- Append requires producer batches to include the current `streamRevision`; mismatches return `ErrCode.ContestEventStreamRevisionMismatch` (`100007`).
- Default catch-up compaction now checks later settle/change events beyond the current page before dropping stale progress events.
- Catch-up now filters frozen submissions before compaction. The filter uses the solution's new-solution submit time, works even when `compactProgress=false`, and still advances `checkpointEventId` across filtered events.
- Removed Socket.IO server startup from the Node process.
- Changed Docker startup to foreground `npm run start`.
- Removed Mongo contest legacy config/client/model code and excluded local-only files from Docker build context.
- Excluded server test files from application dependency scanning.
- Regenerated `src/common/api/api-client.ts` so JSON contest APIs are available to clients.
- Reset the local `rankland` database and reran the rewritten initial migration.
- Smoke-tested v2 create/read/users/stream/append/catch-up/SSE paths locally.
- Smoke-tested Snowflake-backed create/read/admin stream/append/catch-up paths with IDs above `Number.MAX_SAFE_INTEGER`.
- Added a revision-first event high-water model and rebuilt the local SSE Hub around database `contestId` identity with per-client monotonic gates.
- SSE event frames are now written atomically, slow clients retain at most one latest pending high-water mark, and connections that remain blocked for 10 seconds are closed for recovery by reconnect.
- Added 15-second SSE comment heartbeats, active-contest tracking, terminal registration handles, and idempotent contest/all-client drain operations.
- Added canonical contest identity reads plus one-query active-contest stream-state loading, including soft-delete filtering and empty-input short-circuiting.
- Added the local notification coordinator with two-read SSE attachment, per-instance fixed-rate/single-flight MySQL reconciliation, missing-contest closure, and synchronous draining of pending and registered clients.
- Added the strict namespaced Redis v1 notification adapter with a dedicated subscriber connection, explicit subscribe-ACK generations, fail-open 500 ms publishing, terminal shutdown, and rate-limited recovery logging.
- Routed append/reset and public SSE attachment through the coordinator while explicitly preserving the existing append response DTO and client-request `uk` payload semantics.
- Added idempotent application disposal that drains notifications before HTTP, uses no network wait for the Redis subscriber, bounds later resource cleanup, and cleans bootstrap resources after startup failure.
- Added real Redis/MySQL gated integration tests plus a production multi-process smoke for local/remote fan-out, commit-to-publish process death, namespace partition, Redis blackhole, heartbeat, self-echo deduplication, soft deletion, and graceful shutdown.
- Added production namespace configuration, Compose/CI wiring, an optional real-nginx smoke, and the deployment/blue-green/rollback runbook.

## Commands

```bash
pnpm run db:migration:generate
pnpm run db:migration:run
pnpm run test
RUN_MYSQL_TESTS=true pnpm run test
RUN_REDIS_TESTS=true pnpm run test
pnpm run build
RUN_NOTIFICATION_SMOKE=true REDIS_NAMESPACE=rankland-smoke AUTH_TOKEN=rankland-smoke pnpm run test:notification-smoke
```

## Migration Mechanics

- The initial migration file `1716500000000-ContestEventSchema.ts` was written manually to match the TypeORM entities and the desired index names.
- The initial migration creates `contest`, `contest_user`, `contest_event_stream`, and `contest_event`; `contest_event_stream` does not store a redundant `uk`.
- `contest_event` includes `solution_submit_time_ns` and `IDX_contest_event_solution_type_lookup` for efficient append-time submit-time lookup.
- All table columns in the initial migration use snake_case. TypeORM maps them back to camelCase entity properties. This is covered by the MySQL integration schema regression test.
- Future schema changes should be made on entities first, then generated with `pnpm run db:migration:generate`, reviewed, and committed.
- `1784000000000-ContestSnowflakeIds.ts` is a deliberately destructive migration that rebuilds the four contest tables, creates `id_worker_registry`, and retains the post-precision `datetime(6)` schema. Its down migration is destructive as well.
- TypeORM tracks executed migrations in the `typeorm_migrations` table. `pnpm run db:migration:run` compares this table with files in `src/server/database/migrations`, then executes only files that have not been recorded yet, in timestamp order.
- Runtime startup does not execute migrations. Operators must run `pnpm run db:migration:run` as an explicit deployment step before or alongside application rollout.

## Notes

- Old Mongo event logs are not migrated.
- Runtime no longer connects to MongoDB for contest data.
- `resetContestEvents` now resets the stream: retains old event rows, increments `streamRevision`, clears `lastEventId`, and releases the producer lock.
- `resetContestEvents` announces the committed `streamRevision`/`latestEventId=0` watermark through the same local/Redis/reconcile notification path.
- Consumers should persist both `checkpointEventId` and `streamRevision`. `checkpointEventId` may be sparse when compaction removes stale progress events.
- Catch-up compaction filters stale progress events only in HTTP recovery responses. Live realtime notifications are never compacted because they do not carry event payloads.

## Follow-Up Backlog

- Define retention/archive policy for retained old-revision `contest_event` rows before resets become routine.
- Load-test large contests for catch-up settled-event aggregation and public user text filters; optimize indexes or push filtering into SQL only if measurements justify it.
- Tighten public user DTO/query types so they do not advertise admin-only fields.
- Decide one `uk -> contestId` lookup strategy and either bound/invalidate `contestIdCacheMap` or remove it.
- Run the A4 check on two real green machines and verify browser `EventSource` reconnection through the target nginx before production cutover.
- Measure the authoritative batch query at the deployment's expected maximum active-contest count and keep p99 below 1 second before asserting the 6-second SLO at that capacity.
