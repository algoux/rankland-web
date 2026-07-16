# Contest Event Architecture

Updated: 2026-07-16

## Goals

This design covers the contest event ingestion and consumption path. The priorities are:

1. Preserve event correctness and append-only ordering.
2. Make producer retry behavior deterministic.
3. Let consumers recover from any disconnect through HTTP catch-up.
4. Keep realtime delivery lightweight and replaceable.

The existing protobuf package and generated proto type names remain unchanged.

## Current Choice

The implemented architecture is TypeORM + MySQL/TDSQL-C + HTTP/SSE, with Redis Pub/Sub as a best-effort
cross-instance notification accelerator.

- MySQL is the canonical store.
- TypeORM repositories, entity managers, and transactions are the only business data access layer.
- `mysql2` is used only as TypeORM's MySQL driver dependency.
- HTTP is the canonical producer append and consumer catch-up protocol.
- SSE only sends availability notifications: `uk`, `latestEventId`, and `streamRevision`.
- The writing instance notifies its local SSE hub immediately after commit, then publishes the same high-water mark
  through Redis Pub/Sub for other instances.
- Every instance reconciles the authoritative MySQL high-water marks for its locally active contests every 5 seconds.
  This closes Pub/Sub disconnects, message loss, and the commit-to-publish process-exit window.
- Redis remains fail-open: an unavailable notification accelerator does not change application readiness or a
  successfully committed append/reset response.
- Socket.IO is not started by the server process.

## Naming Boundary

- HTTP request/response fields, DTOs, services, and TypeORM entity properties use camelCase.
- MySQL table columns use snake_case.
- TypeORM entities explicitly map camelCase properties to snake_case columns.
- Proto package names and generated proto type names remain unchanged.
- `teamMembers`, `ProblemDTO.alias`, and `problemAlias` keep their existing meanings and are not contest `uk` or contest user naming.

## Database Model

Tables:

- `contest`: contest metadata. `uk` is unique and is the public contest key.
- `contest_user`: contest users. `(contest_id, user_id)` is unique.
- `contest_event_stream`: one row per contest event stream. It stores `contest_id`, `last_event_id`, `stream_revision`, and producer lock fields. It does not store `uk`.
- `contest_event`: append-only event log keyed by `(contest_id, stream_revision, event_id)`. It stores normalized `time_ns` and denormalized `solution_submit_time_ns` so consumer catch-up can filter frozen submissions without querying `NEW_SOLUTION` for every request. Older revisions remain in this table as retained history after reset.
- `id_worker_registry`: Snowflake worker-registration audit and logical timestamp fencing.

`contest_event_stream` is intentionally normalized through the TypeScript `contestId` property, mapped to the `contest_id` column. Services resolve `contest.uk` to `contest.id` before touching stream or event rows.

Contest row IDs and every `contest_id` reference are `BIGINT UNSIGNED` in MySQL and decimal strings in TypeScript/JSON. The generator, MySQL named-lock ownership, timestamp fencing, and deployment constraints are documented in [Contest ID Generation](contest-id-generation.md).

Schema changes are made through migrations only. Runtime startup does not run migrations.

## Producer Protocol

Append endpoint:

- `POST /api/v2/contests/:uk/events`
- Required header: `x-producer-id`
- Required header for append: `x-token`
- Supported payloads:
  - direct `BatchProducerEvent` JSON object
  - raw protobuf bytes with `application/x-protobuf` or `application/protobuf`

Append rules:

1. Decode and verify `BatchProducerEvent`.
2. Require `streamRevision` and a non-empty batch.
3. Require event ids to be strictly increasing inside the batch.
4. Resolve `uk -> contestId`.
5. Lock the `contest_event_stream` row in a transaction.
6. Reject the append if batch `streamRevision` differs from the locked stream row.
7. The first producer claims the stream lock.
8. Later appends must use the same `x-producer-id` until an admin releases the lock.
9. `eventId` must continue from `lastEventId + 1`.
10. Duplicate retries are accepted only when the stored payload hash matches within the current revision.
11. Conflicting duplicate payloads and gaps abort the transaction.
12. For non-new solution events, resolve the solution submit time from an earlier `NEW_SOLUTION` in the same batch or one batch lookup of existing new-solution rows in the current revision.
13. `lastEventId` is updated only after the event rows are inserted.
14. Event-availability notifications are announced only after transaction commit. The local hub is notified first;
    Redis publication is best-effort and notification-plane failures cannot turn a committed append into an HTTP
    failure.

This one-request/one-ack flow is the correctness boundary. Producers should not send the next batch until the previous append response succeeds.

## Time Semantics

Contest event `TimeDuration` values use nanosecond semantics internally.

- Incoming `S`, `MS`, `US`, and `NS` values are normalized to nanoseconds.
- MySQL stores the normalized value in `contest_event.time_ns`.
- Outgoing client protobuf events use `unit = NS`.
- Large integer values are handled with Long/string-compatible paths instead of plain JS number assumptions; direct JSON batches reject unsafe numeric `TimeDuration.value` values before protobuf conversion.

Solution result values in events should be raw judge results whenever the upstream data source exposes them. They intentionally differ from SRK `SolutionResultLite` / `SolutionResultFull`: `FZ` maps to the SRK `?` frozen/unknown display state and is deprecated, but remains producer-supported as a fallback when the raw frozen result cannot be retrieved. `FB` is a computed ranklist property derived from AC events, so append and catch-up event payloads must not contain `FB`. If a retained legacy payload already contains deprecated `FB`, the catch-up codec normalizes it back to raw `AC` before responding.

When persisted `frozen_duration_s` is positive, catch-up computes the absolute freeze boundary as `start_at + duration_s - frozen_duration_s`. Because producer event times are relative to `start_at`, the comparison value is stored in the snapshot as `frozenStartNs = (duration_s - frozen_duration_s) * 1e9`. If a solution's `NEW_SOLUTION.time` is at or after that start, the HTTP catch-up response hides that solution's progress, result settle, and result change events. The new-solution event itself remains visible.

## Consumer Protocol

Catch-up endpoint:

- `GET /api/v2/public/contests/:uk/events?afterEventId=123&limit=1000&streamRevision=1`

This endpoint is unauthenticated by current implementation.

The response envelope includes:

- `uk`
- `fromEventId`
- `toEventId`
- `checkpointEventId`
- `latestEventId`
- `streamRevision`
- `hasMore`
- `events`
- `resetRequired`

Consumers are expected to persist their own `lastEventId`, `streamRevision`, and cached events. When reconnecting,
they pass `afterEventId` and apply returned events in event-id order. A lower `streamRevision` notification belongs
to an obsolete generation and must be ignored. A higher revision replaces the old generation, clears local event
state, and resets the target cursor to the new revision's high-water mark. In-flight catch-up responses are applied
only when the generation and revision captured when the request started are still current.

Catch-up compaction is enabled by default. If a recovery range contains later settle/change events for a solution, earlier progress events for that same solution can be omitted from that recovery response. The returned `checkpointEventId` marks the safe cursor after compaction, so returned events may be sparse.

Live realtime delivery does not carry event payloads and is never compacted.

## Transport: content negotiation, protobuf & SSE

Request parsing and response wrapping are handled by generic, business-agnostic infrastructure; controllers
only declare capabilities through decorators and return plain objects.

- Capability decorators (metadata only): `@ProtobufContract(ReqMessage | null, RespMessage | null)` and `@Sse()`.
- Global middlewares (run before bwcx validation):
  - `ContentNegotiationMiddleware` resolves the response content type from `Accept` + the route's supported
    types and stores it on `ctx.state.respContentType`; strict (protobuf/SSE-capable) routes return `406`
    when nothing acceptable matches, plain routes fall back to JSON. Default prefers JSON on tie/no priority.
  - `ProtobufMiddleware` decodes protobuf request bodies via the declared request message (`415` for other
    binary types, `413` over 5 MiB, `400` for undecodable bytes) so the decoded body reaches DTO validation.
  - `SseMiddleware` opens the event-stream response (headers, `ctx.respond = false`, `retry:`), then hands off.
- `DefaultResponseHandler` wraps the success path by content type: JSON → `{ success, code, data }`; protobuf →
  encode the route return with the declared response message + `X-RL-Resp-Success/Code` headers.
- Exception handlers wrap the failure path by content type: JSON → `{ success, code, msg, ... }`; protobuf →
  empty body + `X-RL-Resp-Success/Code/Msg` (and optional `X-RL-Resp-Meta`) headers.

This keeps `application/protobuf` ⇄ JSON interchange a transport concern; the same controller serves both.

## SSE Protocol

SSE endpoint:

- `GET /api/v2/public/contests/:uk/event-stream/notifications`

Implemented as a controller route marked `@Sse()`; the generic `SseMiddleware` handles the event-stream
plumbing and the controller delegates the business hookup to `ContestEventNotificationCoordinator`. The coordinator
resolves the canonical contest identity, registers by database `contestId`, and performs a second authoritative read
to close the read-to-register race.
This public notification endpoint is unauthenticated by current implementation. It carries no event payloads.

The stream sends `events-available` events:

```json
{
  "uk": "contest-uk",
  "latestEventId": 123,
  "streamRevision": 1
}
```

Clients should treat SSE as a hint and then use HTTP catch-up to fetch missing events.

The public named-event contract remains unchanged:

- the route, `events-available` event name, JSON fields, and `retry: 1000` hint are unchanged;
- the `uk` field is the original value used by that SSE connection, even when MySQL resolves a case variant to the
  same contest;
- no SSE `id:` field is sent and recovery does not use `Last-Event-ID`;
- the server emits `: heartbeat\n\n` as an SSE comment approximately every 15 seconds. Comments maintain the
  transport path and are ignored by `EventSource` event listeners; they are not availability notifications;
- each connection sees `(streamRevision, latestEventId)` advance monotonically. A higher revision with event id `0`
  supersedes every watermark from an older revision;
- notification loss, duplication, and reordering are permitted because HTTP catch-up remains authoritative.

When Redis is healthy and the target instance has acknowledged its subscription, the cross-instance notification
target is within 1 second after MySQL commit. If Pub/Sub loses a signal, the 5-second reconciliation path converges
within 6 seconds only while MySQL is healthy and the authoritative batch query completes within 1 second.

## Admin Operations

Admin APIs are under `/api/v2`:

- `POST /api/v2/contests`
- `PATCH /api/v2/contests/:uk`
- `GET /api/v2/contests/:uk`
- `GET /api/v2/contests/:uk/users`
- `GET /api/v2/contests/:uk/users/:userId`
- `PATCH /api/v2/contests/:uk/users/:userId`
- `GET /api/v2/contests/:uk/event-stream`
- `DELETE /api/v2/contests/:uk/event-stream/producer-lock`
- `POST /api/v2/contests/:uk/events/reset`

These admin APIs require `x-token`.

Reset retains historical event rows, increments `streamRevision`, resets `lastEventId` to `0`, and releases the
producer lock. Consumers switch generations only when they observe a higher revision or an authoritative catch-up
response with `resetRequired`; a lower-revision notification is stale and must be ignored.

Public APIs are:

- `GET /api/v2/public/contests/:uk`
- `GET /api/v2/public/contests/:uk/event-stream`
- `GET /api/v2/public/contests/:uk/event-stream/notifications`
- `GET /api/v2/public/contests/:uk/events`
- `GET /api/v2/public/contests/:uk/users`
- `GET /api/v2/public/contests/:uk/users/:userId`

## Deployment Notes

The service runs as a single foreground Node process in each container. Horizontal scaling does not require sticky
sessions: all instances in one deployment share the same MySQL write primary, standalone Redis endpoint, and exact
`REDIS_NAMESPACE`. Different environments and independent deployments use different namespaces; `REDIS_DB` does
not isolate Pub/Sub channels.

Production requires a non-empty `REDIS_NAMESPACE`. A missing namespace is a startup configuration error, while a
runtime Redis outage is fail-open and does not change `/api/checkHealth`. Nginx must disable buffering and caching for
the actual location that matches the SSE route.

Before rollout, run:

```bash
pnpm run db:migration:run
pnpm run build
pnpm run start
```

This notification change adds no database migration. Existing migrations must still be applied through the normal
deployment workflow before the application starts.
