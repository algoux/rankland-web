# Contest ID Generation

Updated: 2026-07-14

## Scope

`contest.id`, `contest_user.id`, and `contest_event.id` use application-generated Snowflake IDs. The related
`contest_id` columns in `contest_user`, `contest_event`, and `contest_event_stream` use the same representation.

- MySQL type: `BIGINT UNSIGNED`
- TypeScript and JSON type: decimal `string`
- Public business key: `contest.uk` remains the key used by routes and external producers/consumers

The API fields `CreateContestRespDTO._id`, `GetContestRespDTO._id`, `GetPublicContestRespDTO._id`, and the
admin-only `GetContestEventStreamRespDTO.contestId` therefore contain decimal strings. They must never be
converted to JSON numbers because normal IDs exceed `Number.MAX_SAFE_INTEGER`.

## Bit layout

IDs use 63 bits so they remain below the signed BIGINT maximum even though the MySQL columns are unsigned:

```text
[1 unused sign bit][41-bit milliseconds][10-bit worker id][12-bit sequence]
```

- Epoch: `2026-01-01T00:00:00.000Z`
- Worker range: `0..1023`
- Per-worker sequence: `0..4095` per millisecond
- Lifetime: approximately 69.7 years from the epoch

`SnowflakeIdGenerator` computes with `BigInt` and returns `string`. It reuses its last logical timestamp during a
clock rollback of at most 50 ms, rejects larger rollback, and waits for the next millisecond when the sequence is
exhausted. One singleton generator is shared by contest, contest-user, and contest-event writes.

Snowflake IDs are sparse relative to a database-wide auto-increment and do not reveal a global row count. They
are not secrets or authorization tokens: IDs from one worker in one millisecond may be consecutive. Access
control must continue to rely on the existing API authentication and business keys.

## Worker ownership and fencing

MySQL is already required for every persisted write, so it is also the only coordination dependency.

At application startup, `IdGeneratorService`:

1. Opens a dedicated TypeORM `QueryRunner` connection for its full lifetime.
2. Inserts an audit row into `id_worker_registry` and uses `registrationId % 1024` as the first candidate.
3. Probes up to 1024 MySQL named locks (`rankland:snowflake-worker:<id>`). Only a process holding the lock may
   use that worker id.
4. Reads the greatest prior `reserved_until_ms` for the selected worker and starts after that timestamp.
5. Persists a 10-second logical timestamp reservation and renews it every 2 seconds while verifying that the
   dedicated connection still owns the named lock.

The persisted timestamp window is a fence for process death or connection loss. A replacement owner starts
after the previous reservation, while the old process refuses to generate beyond its reserved window. This
prevents a recycled worker id from replaying an earlier timestamp/sequence range.

If a forward clock jump, system sleep, or event-loop pause moves logical time beyond the currently persisted
window before the heartbeat completes, the service does not generate an ID beyond that fence. It starts one
single-flight renewal cycle shared with the heartbeat and rejects the current generation attempt as transient.
Newer targets that arrive while an older update is pending are serialized and persisted before that cycle finishes.
After MySQL successfully persists a window covering the latest target, later attempts resume automatically;
callers may safely retry the rolled-back write.

The service permanently fails closed if the lock connection, ownership check, or reservation renewal fails.
Subsequent writes that need a new row ID throw instead of generating with uncertain ownership. Restart the process
after restoring MySQL connectivity; the service does not silently acquire another worker while running.

`id_worker_registry` stores:

| Column                     | Purpose                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `id`                       | Auto-increment registration/audit id and worker-candidate seed |
| `worker_id`                | Claimed Snowflake worker slot                                  |
| `reserved_until_ms`        | End of this registration's fenced logical timestamp window     |
| `host`, `pid`              | Process identity for operations/debugging                      |
| `created_at`, `updated_at` | Registration and latest-renewal timestamps                     |

Registry rows are retained for auditability. Any future housekeeping must delete only registrations whose
reservation has expired and whose worker named lock is no longer active. Never delete an active registration:
renewal updating zero rows intentionally makes that process fail closed.

## Startup and shutdown

`OurApp.afterWire()` initializes dependencies in this order:

1. Initialize the TypeORM data source.
2. Initialize `IdGeneratorService` and claim/fence a worker.
3. Start `ContestEventNotificationCoordinator`, including its Redis subscriber lifecycle, SSE heartbeat, and MySQL
   reconciliation schedule. An unavailable Redis endpoint enters a degraded state without blocking startup; a missing
   production `REDIS_NAMESPACE` remains a configuration error.
4. Allow bwcx to start the HTTP listener.

The server therefore never accepts writes with an uninitialized generator. During shutdown, the app disposes the
notification coordinator first: it enters draining, stops timers/listeners, closes all SSE responses, and disconnects
the dedicated subscriber without waiting for network I/O. The HTTP server can then close without being held open by
long-lived SSE connections. Finally the app disposes the generator (releasing its named lock and dedicated connection)
before destroying the main TypeORM data source and closing the ordinary Redis command client.

If bootstrap or startup rejects, the entry point performs the same idempotent cleanup and exits with status 1; a
failed worker claim, missing migration, or notification configuration error cannot leave a process alive without an
HTTP listener.

`SNOWFLAKE_WORKER_ID=0..1023` bypasses MySQL worker assignment only for isolated tests or tooling.
`NODE_ENV=production` rejects this override at startup; production deployments must always use the registry,
named-lock ownership, and timestamp fence.

All application instances must use the same MySQL write primary. Named locks do not coordinate independent
MySQL servers or a split-brain database topology.

## Schema migration and deployment

`1784000000000-ContestSnowflakeIds.ts` is intentionally destructive. It drops and recreates the four contest
tables, creates `id_worker_registry`, retains existing index names, and preserves `datetime(6)` precision. Its
rollback is also destructive and recreates the prior UUID schema without preserving Snowflake-backed data.

Do not mix old and new application binaries. For this migration:

1. Stop all application processes.
2. Confirm that contest data may be discarded or has been handled separately.
3. Run `pnpm run db:migration:run` from a source checkout, or `npm run db:migration:run:prod` inside the production image.
4. Start only the new build and verify that each process registers a distinct active worker.

Production startup does not run migrations automatically.

`compose-template.yml` models this as one `migrate` service followed by any number of app services using
`depends_on.migrate.condition: service_completed_successfully`. This gate does not stop old containers or processes:
stop every old app before this destructive rollout. Run only one migrator against a database at a time, and use a
modern Docker Compose implementation that supports `service_completed_successfully`.

The Compose template requires the MySQL connection values and `AUTH_TOKEN` through shell variables or `.env` before
it creates any service. Pin `RANKLAND_IMAGE` to the exact release tag or digest so the migrator and every app instance
run the same build. The production migration DataSource also rejects missing MySQL settings instead of falling back
to local development credentials.

## Verification

The maintained checks cover:

- bit layout, burst uniqueness, sequence rollover, and clock rollback;
- worker-slot acquisition, timestamp fencing, forward-overrun recovery, and both renewal orderings;
- TypeORM entity metadata and migration SQL;
- contest/user/event ID assignment, including preserving IDs during user updates;
- real MySQL column types, numeric-string round trips, bulk event inserts, and two concurrent registered workers;
- API create/read/event-stream/append/catch-up smoke paths.

Run:

```bash
fnm exec --using v20.19.1 pnpm run test
RUN_MYSQL_TESTS=true fnm exec --using v20.19.1 pnpm run test
fnm exec --using v20.19.1 pnpm run build:server
```
