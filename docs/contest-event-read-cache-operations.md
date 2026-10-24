# Contest Event Read Cache Operations

Updated: 2026-10-24

This runbook covers startup configuration, staged rollout, failure handling, and rollback for the process-local
contest event read cache. Its correctness contract is defined in
[Contest Event Read Cache Optimization Plan](contest-event-read-cache-optimization-plan.md).

## Safety boundary

- MySQL is the only authority for contest existence, revision, high-water mark, event bytes, and freeze metadata.
- Redis availability and cache contents do not affect `/api/checkHealth`; Redis carries only watermark/control hints.
- Cache entries are process-local and non-persistent. A restart starts cold and requires no cache or Redis cleanup.
- The cache serves only inside a 6-second authority lease. A failed refresh after lease expiry returns HTTP 503 with
  `Retry-After: 1`; operators must not extend the lease to hide MySQL failure.
- Configuration is read only at process startup. There is no runtime admin switch.
- `CONTEST_EVENT_READ_CACHE_MODE` defaults to `on`; `off` remains the stateless rollback and B1 baseline.

## Configuration

Compose 与 README 不重复展开性能变量。全部启动项、当前代码默认值、范围、约束与调优依据集中记录在
[服务端性能配置](server-performance-configuration.md)；常规部署直接使用代码默认值，只在保存正式
压测/发布配置指纹或进行明确的单变量调优时覆盖。

Startup rejects invalid modes, non-integers, an entry budget above the process budget, a hot refresh not below the
lease, or a reconciliation maximum above the lease. Changing a value changes the cache-config fingerprint and
invalidates paired B1/C evidence.

`SERVER_LISTEN_BACKLOG` is a transport setting rather than part of the cache fingerprint. Its default is `4096`:
the 2026-07-20 local 6,300-viewer A/B found the former Node-sized queue saturating at `Recv-Q=512`, with
`ListenDrops` and SYN retransmits, while `4096` removed those counters and retained about 74% queue headroom. The
effective queue remains bounded by host/container sysctls. Record `ss -lnt` Send-Q and the relevant `TcpExt` deltas
after every rollout; do not raise it as a substitute for fixing sustained CPU, event-loop, database, or pool overload.

`MYSQL_CONNECTION_LIMIT` defaults to `20` per process. It is deployment capacity rather than a cache semantic knob:
keep the fleet total plus administrative/monitoring headroom below the MySQL server's `max_connections`, and use pool
high-water/failed-acquire counters before raising or lowering it. The practical profile proved that 20 removes the
observed pool=10 admission ceiling, but it was not a strict single-variable production database benchmark.

The strict invalidation channel is separate from the watermark channel:

```text
<REDIS_NAMESPACE>:contest-event-read-cache-control:v1
```

All instances in one deployment must share the exact Redis endpoint and namespace. The control channel carries only
strict delete or visibility-fingerprint envelopes; it never carries event payloads and has no retained state.

## Modes

Contest finalization adds numeric `status` to the visibility fingerprint: `Created=0` (the default created state)
and `Finalized=99`; API responses use `status: 0 | 99`. All writers and readers must use the same new
build before enabling finalization; old binaries ignore the status and cannot enforce immutable final results.
The state migration and deployment procedure are documented in [Contest finalization](contest-finalization.md).
Finalized authority (`status=99`) uses no freeze boundary. Both explicit finalize and empty-stream static file association
publish metadata invalidation after committing, without changing the stream revision or notifying clients to replay.
An in-flight response pinned before invalidation may finish. Lost control messages converge through the existing
authority lease/reconciliation; this is not a cross-instance linearizability guarantee.

Authenticated `ignoreFrozen=true` reads bypass the public cache in all modes (including shadow comparisons),
use the existing bounded database fallback, and return `Cache-Control: private, no-store`.
Never cache those responses in a CDN or reuse them as a public materialized snapshot.

`off` is the rollback and B1 baseline. GET uses the optimized legacy snapshot path through its bounded bulkhead.
Cache-aware writers still publish delete/metadata control so an `off` instance can safely coexist with `on` from
the same build during a rollout.

`shadow` is for test or low traffic only. Clients receive the legacy result. The process hydrates cache entries and
compares complete response semantics in the background; any mismatch increments the mismatch counter and evicts the
shadow generation. The double-read cost makes this unsuitable as the normal peak-traffic mode.

`on` serves materialized JSON/protobuf views. Oversize entries use the bounded legacy path. Every other cache
authority, corruption, gap, queue, or budget failure returns 503 rather than silently serving stale data.
Every cache/fallback read is bounded from pool acquisition through transaction completion, and each SELECT also
carries the configured MySQL statement hint. A cache/fallback acquisition fails fast when the main pool is full
instead of joining mysql2's internal wait queue. Deadline expiry releases the application bulkhead slot immediately,
destroys an acquired connection, and fences a connection that arrives late before it can query or publish a result.
The UTC session-initialization query is covered before TypeORM sees the raw connection. A failed or unproven rollback
also destroys the session instead of returning a possibly open transaction to the pool.
Authority, range, decode, or validation failure puts the affected generation into a short cooldown so retrying
viewers do not immediately repeat the same database work. If post-commit cache update and normal invalidation both
fail, the contest is inserted into a process-local deny-set before notification delivery continues. That contest
remains unavailable until the process is replaced; failure of the contest deny-set escalates to the process-wide
cache kill switch.

## Required rollout

1. Preserve the pre-quick-win B0 image and fixed corpus outside this working tree.
2. Deploy the same cache-aware build to every writer/reader with `mode=off`. Verify both Redis channels subscribe
   and writers publish delete/metadata control.
3. Restore the exact corpus before each run and complete valid B1 plus injector calibration. Missing monitoring is
   `INFRA_INVALID`, never zero pressure.
4. Deploy `shadow` only to the designated test/low-traffic slice. Exercise compact on/off, freeze/no-freeze,
   JSON/PB, reset, append, delete, and metadata update; require zero semantic mismatch.
5. Build a green pool from the same immutable build with `mode=on`. Do not mix it with a pre-cache binary.
6. Run paired 1,000-viewer B1/C evidence, then C at 5,000. Require at least 95% MySQL read statement/transaction
   reduction and no more than 10% C 1,000-to-5,000 same-work growth.
7. Run JSON-only and protobuf-only 5,000-viewer suites with all three fixed seeds, then valid 10,000 stretch,
   30-minute pre-soak, and 60-minute mixed soak.
8. Only after every gate passes, switch traffic to green. Archive app/build/config/corpus fingerprints, monitoring,
   SLO/final-cursor results, and the exact load-balancer action.

The manager deliberately does not restore/drop a database or alter deployment state. Follow
`loadtest/contest/READ-CACHE-ACCEPTANCE.md` for credentials, corpus sentinels, profiles, commands, and comparison
artifacts.

## Observe

Set `CONTEST_EVENT_RUNTIME_DIAGNOSTICS_ENABLED=true` on the load-test, canary, or temporary diagnostic slice.
The production default is `false`. When enabled, the application emits `contest_event_read_cache.summary` at
startup, configured intervals, and once during drain. Record the
cumulative endpoints and deltas for resident/builder/retired/total bytes, high-water bytes, hits/misses,
hydration/singleflight, generation discard/regression, TTL/LRU/oversize, bulkhead/queue/cooldown, deny-set, projection rebuild,
comparison/mismatch, store calls/rows, and read transaction started/committed/rolled back.

The byte gauges use structural identity accounting. `residentBytes` is the union of unique immutable parts referenced
by current snapshots; `retiredPinnedBytes` is only the unique material retained exclusively by leased retired
generations; `totalAccountedBytes` is the union of resident and retired parts plus the active builder reservation.
Shared chunks or projections are counted once even when an append generation and a pinned predecessor both reference
them. Before hydration reads payload rows, a bounded range-metadata query returns row and byte totals; the cache
reserves that estimate before the payload SELECT, then accounts for the simultaneous raw rows and replacement
snapshot while building. Append and cold build follow the same reserve-before-allocation rule with a conservative
schema-aware upper bound. The cache rejects or evicts before allocation and asserts that actual unique allocation
does not exceed the reservation. Alert on sustained non-zero builder bytes, but do not add the three structural
gauges together because their sets intentionally overlap.

The same summary also exposes mysql2 current/high-water pool gauges, acquire failures by stable code,
pool-acquisition retry attempts/success/exhaustion, bootstrap authority singleflight and attachment-batch counts,
and eager materialization attempts/starts/joins/completions/failures/timeouts. A higher-revision watermark remains a
hard fence until MySQL confirms it; `pendingWatermarkAuthorityRejects` must remain zero in healthy operation.

Also alert on:

- `contest_event_read_cache.local_commit_failed`, `.local_fail_close_failed`, `.local_control_failed`,
  `.remote_watermark_failed`, `.remote_control_failed`, and `.control_publish_failed`;
- event-page 503/429/5xx, fallback/bulkhead rejects, authority timeout, and shadow mismatch;
- MySQL digest/rows/time/CPU/pool wait, Redis commandstats and publish/receive/control ratios;
- external per-instance Node RSS, restart/OOM, HTTP/SSE p99, producer backlog, ACK-to-cursor, and final cursor ratio.

For load-test availability, count every non-2xx lifecycle request rather than only 503. Require the SSE handshake
total and every setup/ramp/steady/drain phase counter as one atomic evidence set. Apply the same atomic rule to the
unexpected-disconnect total and four phase counters, the four SSE close lifecycle fields, and the four viewer terminal
lifecycle fields; missing or partial evidence makes the round `INFRA_INVALID`. Require zero handshake failures,
close-registration misses and unexpected disconnects in every phase, plus one idempotent final-cursor result per
expected VU. A disconnect followed by a successful retry still fails the lifecycle SLO instead of disappearing from
the final active-connection count. Missing lifecycle evidence takes precedence over injector, target, correctness, and
readiness attribution. With complete evidence, failed viewers must be zero, closed connections must cover every
non-failed terminal viewer, and close attempts must cover every recorded close; an all-zero close group is not proof
of successful cleanup. Because `failedUsers` is a generic scenario terminal rather than a root cause, it falls back to
`INJECTOR_LIMITED` only when no correctness, target, lifecycle, readiness, or performance SLO evidence explains the
failure. Saturation of Gatling's bounded unmatched-message buffer is `INJECTOR_LIMITED`, because the injector may have
discarded protocol evidence; a malformed message observed before saturation remains a target correctness failure. A
committed SSE 200 followed immediately by EOF is not a successful bootstrap; current servers delay the response
commit until authority bootstrap succeeds so a retryable failure stays an HTTP 503 with `Retry-After`.

Cache admission/eviction decisions do not inspect heap/RSS/GC and the service does not emit per-request cache logs.
The existing once-per-summary runtime marker now includes sampled Node/V8 memory fields for diagnosis only: RSS,
heap/external/ArrayBuffer, selected V8 spaces and context counts. Formal RSS remains independently sampled once per
second. Its growth gate excludes the configured growth warmup and then uses the same-second complete-roster fleet
average per app, while full-steady per-instance p99 remains a hard limit and per-instance growth/maxima are retained
as diagnostics. The formal 60-minute soak uses a 10-minute growth warmup plus post-warmup first/end 15-minute median
windows; per-instance growth above the threshold is a warning that requires a longer soak. A short fleet pass is not
proof of no leak. Until the target monitoring pipeline exports every required application series, or an external RSS
gate declares the complete expected app roster, a formal round remains invalid.

## Rollback

Rollback is fail-fast and does not tune budgets live:

1. Remove/drain `on` instances from the load balancer.
2. Start or scale the same cache-aware build with `mode=off`.
3. Keep all writers cache-aware until every `on` instance has drained; do not roll back to a pre-cache binary while
   any `on` instance can receive traffic.
4. Wait for normal graceful shutdown. Cache disposal runs before SSE Hub drain and drops asynchronous late results.
5. Do not delete Redis keys, cache files, or database events; none are used for cache persistence.

Trigger rollback for any semantic mismatch, unexplained 503, authority/fail-close failure, budget violation, RSS
trend/limit breach, producer backlog regression, final-cursor error, or database/Redis evidence gate failure. Retain
the structured summaries and load-test artifacts for diagnosis before retrying rollout.
