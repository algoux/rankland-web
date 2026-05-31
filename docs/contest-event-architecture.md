# Contest Event Architecture

Updated: 2026-05-28

## Goals

This design covers the contest event ingestion and consumption path. The priorities are:

1. Preserve event correctness and append-only ordering.
2. Make producer retry behavior deterministic.
3. Let consumers recover from any disconnect through HTTP catch-up.
4. Keep realtime delivery lightweight and replaceable.

The existing protobuf package and generated proto type names remain unchanged.

## Current Choice

The implemented architecture is TypeORM + MySQL/TDSQL-C + HTTP/SSE.

- MySQL is the canonical store.
- TypeORM repositories, entity managers, and transactions are the only business data access layer.
- `mysql2` is used only as TypeORM's MySQL driver dependency.
- HTTP is the canonical producer append and consumer catch-up protocol.
- SSE only sends availability notifications: `uk`, `latestEventId`, and `streamRevision`.
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
- `contest_event`: append-only event log keyed by `(contest_id, event_id)`. It stores normalized `time_ns` and denormalized `solution_submit_time_ns` so consumer catch-up can filter frozen submissions without querying `NEW_SOLUTION` for every request.

`contest_event_stream` is intentionally normalized through the TypeScript `contestId` property, mapped to the `contest_id` column. Services resolve `contest.uk` to `contest.id` before touching stream or event rows.

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
2. Require non-empty batch.
3. Require event ids to be strictly increasing inside the batch.
4. Resolve `uk -> contestId`.
5. Lock the `contest_event_stream` row in a transaction.
6. The first producer claims the stream lock.
7. Later appends must use the same `x-producer-id` until an admin releases the lock.
8. `eventId` must continue from `lastEventId + 1`.
9. Duplicate retries are accepted only when the stored payload hash matches.
10. Conflicting duplicate payloads and gaps abort the transaction.
11. For non-new solution events, resolve the solution submit time from an earlier `NEW_SOLUTION` in the same batch or one batch lookup of existing new-solution rows.
12. `lastEventId` is updated only after the event rows are inserted.
13. SSE notifications are broadcast only after transaction commit.

This one-request/one-ack flow is the correctness boundary. Producers should not send the next batch until the previous append response succeeds.

## Time Semantics

Contest event `TimeDuration` values use nanosecond semantics internally.

- Incoming `S`, `MS`, `US`, and `NS` values are normalized to nanoseconds.
- MySQL stores the normalized value in `contest_event.time_ns`.
- Outgoing client protobuf events use `unit = NS`.
- Large integer values are handled with Long/string-compatible paths instead of plain JS number assumptions.

When `contest.frozenDuration` is positive, catch-up computes `frozenStartNs = duration - frozenDuration`. If a solution's `NEW_SOLUTION.time` is at or after that start, the HTTP catch-up response hides that solution's progress, result settle, and result change events. The new-solution event itself remains visible.

## Consumer Protocol

Catch-up endpoint:

- `GET /api/v2/contests/:uk/events?afterEventId=123&limit=1000`

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

Consumers are expected to persist their own `lastEventId` and cached events. When reconnecting, they pass `afterEventId` and apply returned events in event-id order.

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

- `GET /api/v2/contests/:uk/events/stream`

Implemented as a controller route marked `@Sse()`; the generic `SseMiddleware` handles the event-stream
plumbing and the controller performs the business hookup (resolve stream state, register with the SSE hub).
This endpoint is unauthenticated by current implementation. It carries no event payloads.

The stream sends `events-available` events:

```json
{
  "uk": "contest-uk",
  "latestEventId": 123,
  "streamRevision": 1
}
```

Clients should treat SSE as a hint and then use HTTP catch-up to fetch missing events.

## Admin Operations

Admin APIs are under `/api/v2`:

- `POST /api/v2/contests`
- `POST /api/v2/contests/:uk`
- `GET /api/v2/contests/:uk`
- `GET /api/v2/contests/:uk/users`
- `GET /api/v2/contests/:uk/users/:userId`
- `POST /api/v2/contests/:uk/users/:userId`
- `GET /api/v2/contests/:uk/stream`
- `POST /api/v2/contests/:uk/producer/release`
- `POST /api/v2/contests/:uk/events/reset`

These admin APIs require `x-token`.

Reset deletes event rows for the contest, increments `streamRevision`, resets `lastEventId` to `0`, and releases the producer lock. Consumers that see a changed or stale `streamRevision` should reset local event state and catch up from the new stream.

Public APIs are:

- `GET /api/v2/public/contests/:uk`
- `GET /api/v2/public/contests/:uk/users`
- `GET /api/v2/public/contests/:uk/users/:userId`

## Deployment Notes

The service runs as a single foreground Node process in each container. Horizontal scaling should route the same contest `uk` to the same instance when possible, but correctness is still guarded by MySQL transactions and unique indexes.

Before rollout, run:

```bash
pnpm run db:migration:run
pnpm run build
pnpm run start
```
