import { rankland_live_contest_client } from '@common/proto/rankland_live_contest';
import { Inject, Provide } from 'bwcx-core';
import ContestEventReadCacheConfig from '@server/configs/contest-event-read-cache/contest-event-read-cache.config';
import {
  ContestEventCacheBuildError,
  ContestEventCacheSnapshot,
  ContestEventJsonResponse,
  buildContestEventCacheSnapshot,
  estimateContestEventSnapshotBuildUpperBoundBytes,
  estimateContestReadableEventBufferTotals,
  estimateContestReadableEventsBufferedBytes,
} from './contest-event-read-cache-core';
import {
  ContestEventAuthorityState,
  ContestEventRangeMemoryEstimate,
  ContestEventRangeRead,
  ContestReadableEvent,
} from './contest-event-store';
import TypeOrmContestEventStore from './contest-event-store.typeorm';
import { ContestCommittedWatermark } from './contest-event-watermark';
import ContestEventReadBulkhead, { ContestEventReadBulkheadError } from './contest-event-read-bulkhead';
import type { ContestEventCacheControl } from './contest-event-cache-control';
export type { ContestEventCacheControl } from './contest-event-cache-control';
import { contestEventReadMetrics, ContestEventReadStoreCounters } from './contest-event-read-metrics';
import LogicException from '@server/exceptions/logic.exception';
import { ErrCode } from '@common/enums/err-code.enum';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { getHeapSpaceStatistics, getHeapStatistics } from 'node:v8';
import { mysqlPoolMetrics } from '@server/database/mysql-pool-metrics';
import type { MysqlPoolMetricsSnapshot } from '@server/database/mysql-pool-metrics';

export type ContestEventReadFormat = 'json' | 'protobuf';

export interface ContestEventReadRequest {
  uk: string;
  afterEventId: number;
  limit: number;
  streamRevision: number;
  compactProgress?: boolean;
}

export type { ContestEventAuthorityState, ContestEventRangeRead } from './contest-event-store';

export interface ContestEventReadCacheLoader {
  readAuthorityByUk(uk: string): Promise<ContestEventAuthorityState>;
  readAuthorityByContestIds(contestIds: readonly string[]): Promise<ContestEventAuthorityState[]>;
  estimateEventRangeMemory(request: ContestEventRangeRead): Promise<ContestEventRangeMemoryEstimate>;
  readEventRange(request: ContestEventRangeRead): Promise<ContestReadableEvent[]>;
}

export interface ContestEventReadCacheOptions {
  maxBytes?: number;
  maxEntryBytes?: number;
  idleTtlMs?: number;
  authorityLeaseMs?: number;
  chunkEventCount?: number;
  maxSynchronousProjectionChunks?: number;
  hydrationConcurrency?: number;
  hydrationPageSize?: number;
  summaryIntervalMs?: number;
  failureCooldownMs?: number;
  now?: () => number;
}

export interface ContestEventReadCacheCounters {
  residentContests: number;
  residentEvents: number;
  residentBytes: number;
  retiredPinnedBytes: number;
  builderReservedBytes: number;
  totalAccountedBytes: number;
  highWaterAccountedBytes: number;
  readyHits: number;
  coldMisses: number;
  hydrationStarted: number;
  hydrationCompleted: number;
  getHydrationStarted: number;
  eagerTailFillAttempts: number;
  eagerTailFillStarted: number;
  eagerTailFillJoined: number;
  eagerTailFillCompleted: number;
  eagerTailFillFailed: number;
  eagerTailFillSkipped: number;
  hydrating: number;
  canonicalizedEvents: number;
  singleflightJoins: number;
  generationDiscards: number;
  targetAdvancesDuringHydration: number;
  writeThroughDeferred: number;
  authorityResultsStaleByTargetAdvance: number;
  hydrationStabilizationFailures: number;
  watermarkRegressions: number;
  pendingWatermarkAuthorityRejects: number;
  lruEvictions: number;
  ttlEvictions: number;
  oversizeMarkers: number;
  bulkheadRejects: number;
  queueTimeouts: number;
  comparisons: number;
  comparisonMismatches: number;
  comparisonInconclusive: number;
  projectionRebuilds: number;
  failureCooldownRejects: number;
  disabledContests: number;
}

export type ContestEventReadCacheResult =
  | {
      format: 'json';
      data: ContestEventJsonResponse;
      release: () => void;
    }
  | {
      format: 'protobuf';
      body: Buffer;
      release: () => void;
    };

interface CacheEntry {
  readonly contestId: string;
  token: object;
  targetVersion: number;
  canonicalUk: string;
  streamRevision: number;
  targetLastEventId: number;
  visibilityFingerprint: string;
  frozenStartNs: string | null;
  authoritySnapshotStartedAtMono: number;
  lastAccessAtMono: number;
  snapshot?: ContestEventCacheSnapshot;
  hydration?: Promise<void>;
  authorityRefresh?: Promise<void>;
  tombstoned: boolean;
  oversize: boolean;
  retryNotBeforeMono: number;
  pendingWatermark?: ContestCommittedWatermark;
}

interface BuilderReservation {
  readonly contestId: string;
  bytes: number;
  released: boolean;
}

interface SnapshotMemoryPartAccounting {
  readonly contestId: string;
  readonly estimatedBytes: number;
  residentReferences: number;
  retiredReferences: number;
}

type SnapshotMemoryKind = 'resident' | 'retired';

interface HydrationStabilizationBudget {
  remainingAuthorityReads: number;
}

const DEFAULTS = {
  maxBytes: 256 * 1024 * 1024,
  maxEntryBytes: 128 * 1024 * 1024,
  idleTtlMs: 15 * 60 * 1000,
  authorityLeaseMs: 6_000,
  chunkEventCount: 512,
  maxSynchronousProjectionChunks: 32,
  hydrationConcurrency: 2,
  hydrationPageSize: 2_000,
  summaryIntervalMs: 60_000,
  failureCooldownMs: 1_000,
} as const;

const MAX_AUTHORITY_STABILIZATION_PASSES = 4;
const MAX_HYDRATION_ATTEMPTS = 2;

export class ContestEventReadCacheUnavailableError extends Error {
  public readonly retryAfterSeconds = 1;

  public constructor(public readonly reason: string) {
    super(`contest event read cache temporarily unavailable: ${reason}`);
    this.name = 'ContestEventReadCacheUnavailableError';
  }
}

@Provide()
export default class ContestEventReadCache {
  private readonly options: Required<Omit<ContestEventReadCacheOptions, 'now'>>;
  private readonly now: () => number;
  private readonly entriesByContestId = new Map<string, CacheEntry>();
  private readonly contestIdByUk = new Map<string, string>();
  private readonly tombstonedContestIds = new Set<string>();
  private readonly tombstonedUks = new Set<string>();
  private readonly disabledContestIds = new Set<string>();
  private readonly accountedBytesByContestId = new Map<string, number>();
  private readonly identityFailureCooldowns = new Map<string, { token: object; retryNotBeforeMono: number }>();
  private readonly identityFlights = new Map<string, Promise<CacheEntry>>();
  private readonly calibrationContexts = new WeakMap<
    object,
    { startedAtMono: number; targetVersionFence: number; tokensByContestId: ReadonlyMap<string, object> }
  >();
  private readonly pinsBySnapshot = new Map<ContestEventCacheSnapshot, number>();
  private readonly retiredSnapshots = new Set<ContestEventCacheSnapshot>();
  private readonly snapshotMemoryParts = new Map<object, SnapshotMemoryPartAccounting>();
  private readonly hydrationBulkhead: ContestEventReadBulkhead;
  private controlToken: object = {};
  private globallyDisabled = false;
  private stopping = false;
  private started = false;
  private targetVersionSequence = 0;
  private summaryTimer?: NodeJS.Timeout;
  private counters: ContestEventReadCacheCounters = emptyCounters();
  private lastSummaryCounters: ContestEventReadCacheCounters = emptyCounters();
  private lastStoreCounters: ContestEventReadStoreCounters = contestEventReadMetrics.snapshot();
  private lastMysqlPoolMetrics: MysqlPoolMetricsSnapshot = mysqlPoolMetrics.snapshot();
  private lastSummaryEpochMs?: number;
  private readonly eventLoopDelay = monitorEventLoopDelay({ resolution: 10 });

  public constructor(
    @Inject(TypeOrmContestEventStore)
    private readonly loader: ContestEventReadCacheLoader,
    @Inject(ContestEventReadCacheConfig)
    options: ContestEventReadCacheOptions = {},
  ) {
    this.options = {
      maxBytes: positiveInteger(options.maxBytes, DEFAULTS.maxBytes, 'maxBytes'),
      maxEntryBytes: positiveInteger(options.maxEntryBytes, DEFAULTS.maxEntryBytes, 'maxEntryBytes'),
      idleTtlMs: positiveInteger(options.idleTtlMs, DEFAULTS.idleTtlMs, 'idleTtlMs'),
      authorityLeaseMs: positiveInteger(options.authorityLeaseMs, DEFAULTS.authorityLeaseMs, 'authorityLeaseMs'),
      chunkEventCount: positiveInteger(options.chunkEventCount, DEFAULTS.chunkEventCount, 'chunkEventCount'),
      maxSynchronousProjectionChunks: positiveInteger(
        options.maxSynchronousProjectionChunks,
        DEFAULTS.maxSynchronousProjectionChunks,
        'maxSynchronousProjectionChunks',
      ),
      hydrationConcurrency: positiveInteger(
        options.hydrationConcurrency,
        DEFAULTS.hydrationConcurrency,
        'hydrationConcurrency',
      ),
      hydrationPageSize: positiveInteger(options.hydrationPageSize, DEFAULTS.hydrationPageSize, 'hydrationPageSize'),
      summaryIntervalMs: positiveInteger(options.summaryIntervalMs, DEFAULTS.summaryIntervalMs, 'summaryIntervalMs'),
      failureCooldownMs: positiveInteger(options.failureCooldownMs, DEFAULTS.failureCooldownMs, 'failureCooldownMs'),
    };
    if (this.options.maxEntryBytes > this.options.maxBytes) {
      throw new RangeError('maxEntryBytes must not exceed maxBytes');
    }
    this.now = options.now ?? monotonicNow;
    this.hydrationBulkhead = new ContestEventReadBulkhead(this.options.hydrationConcurrency, 32, 1_000);
  }

  public async getEvents(
    request: ContestEventReadRequest,
    format: ContestEventReadFormat,
  ): Promise<ContestEventReadCacheResult> {
    if (this.stopping) {
      throw new ContestEventReadCacheUnavailableError('cache is draining');
    }
    if (this.globallyDisabled) {
      throw new ContestEventReadCacheUnavailableError('cache is disabled');
    }
    const normalizedRequest = normalizeRequest(request);
    let entry = await this.resolveEntry(normalizedRequest.uk);
    if (entry.pendingWatermark) {
      entry = await this.refreshEntryAuthority(entry, normalizedRequest.uk);
    }
    this.assertEntryUsable(entry);
    entry.lastAccessAtMono = this.now();

    if (this.now() - entry.authoritySnapshotStartedAtMono > this.options.authorityLeaseMs) {
      entry = await this.refreshEntryAuthority(entry, normalizedRequest.uk);
      this.assertEntryUsable(entry);
    }

    if (normalizedRequest.streamRevision > entry.streamRevision) {
      entry = await this.refreshEntryAuthority(entry, normalizedRequest.uk);
      if (normalizedRequest.streamRevision > entry.streamRevision) {
        throw new ContestEventReadCacheUnavailableError('request revision is ahead of MySQL authority');
      }
    }
    if (normalizedRequest.streamRevision < entry.streamRevision) {
      return this.createResetResult(normalizedRequest.uk, entry, 'stream revision changed', format);
    }
    if (normalizedRequest.afterEventId > entry.targetLastEventId) {
      entry = await this.refreshEntryAuthority(entry, normalizedRequest.uk);
      if (
        normalizedRequest.streamRevision === entry.streamRevision &&
        normalizedRequest.afterEventId > entry.targetLastEventId
      ) {
        return this.createResetResult(normalizedRequest.uk, entry, 'afterEventId is ahead of latestEventId', format);
      }
    }
    if (
      normalizedRequest.streamRevision === entry.streamRevision &&
      normalizedRequest.afterEventId === entry.targetLastEventId
    ) {
      entry = await this.refreshEntryAuthority(entry, normalizedRequest.uk);
      if (normalizedRequest.streamRevision < entry.streamRevision) {
        return this.createResetResult(normalizedRequest.uk, entry, 'stream revision changed', format);
      }
      if (normalizedRequest.streamRevision > entry.streamRevision) {
        throw new ContestEventReadCacheUnavailableError('request revision is ahead of MySQL authority');
      }
      if (normalizedRequest.afterEventId > entry.targetLastEventId) {
        return this.createResetResult(normalizedRequest.uk, entry, 'afterEventId is ahead of latestEventId', format);
      }
    }

    if (entry.oversize) {
      throw new ContestEventReadCacheUnavailableError('contest is oversize');
    }
    if (!entry.snapshot || entry.snapshot.lastEventId !== entry.targetLastEventId) {
      this.counters.coldMisses += 1;
      let materialized = false;
      for (let pass = 0; pass < MAX_AUTHORITY_STABILIZATION_PASSES; pass += 1) {
        await this.ensureHydrated(entry, 'get');
        this.assertEntryUsable(entry);
        if (entry.oversize) {
          throw new ContestEventReadCacheUnavailableError('contest is oversize');
        }
        if (entry.snapshot?.lastEventId === entry.targetLastEventId) {
          materialized = true;
          break;
        }
        if (entry.snapshot && entry.snapshot.lastEventId > entry.targetLastEventId) {
          this.failClosed(entry);
          throw new ContestEventReadCacheUnavailableError('materialized snapshot is ahead of authority target');
        }
      }
      if (!materialized) {
        this.counters.hydrationStabilizationFailures += 1;
        throw new ContestEventReadCacheUnavailableError('materialization did not stabilize');
      }
    } else {
      this.counters.readyHits += 1;
    }
    this.assertEntryUsable(entry);
    if (!entry.snapshot || entry.snapshot.lastEventId !== entry.targetLastEventId || entry.oversize) {
      throw new ContestEventReadCacheUnavailableError(entry.oversize ? 'contest is oversize' : 'entry is stale');
    }
    const snapshot = entry.snapshot;
    const pageRequest = {
      uk: normalizedRequest.uk,
      afterEventId: normalizedRequest.afterEventId,
      limit: normalizedRequest.limit,
      compactProgress: normalizedRequest.compactProgress,
    };
    if (format === 'protobuf') {
      return {
        format,
        body: snapshot.getProtobufResponse(pageRequest),
        release: noop,
      };
    }
    this.pinSnapshot(snapshot);
    let released = false;
    let data: ContestEventJsonResponse;
    try {
      data = snapshot.getJsonResponse(pageRequest);
    } catch (error) {
      this.releaseSnapshot(snapshot);
      throw error;
    }
    return {
      format,
      data,
      release: () => {
        if (released) {
          return;
        }
        released = true;
        this.releaseSnapshot(snapshot);
      },
    };
  }

  public observeCommittedAppend(input: {
    contestId: string;
    canonicalUk: string;
    streamRevision: number;
    lastEventId: number;
    events: readonly ContestReadableEvent[];
  }): void {
    const entry = this.entriesByContestId.get(input.contestId);
    if (!entry || entry.tombstoned || this.globallyDisabled || this.disabledContestIds.has(input.contestId)) {
      return;
    }
    const pending = entry.pendingWatermark;
    if (
      pending &&
      (input.streamRevision < pending.streamRevision ||
        (input.streamRevision === pending.streamRevision && input.lastEventId < pending.latestEventId))
    ) {
      return;
    }
    this.contestIdByUk.set(normalizeUk(input.canonicalUk), input.contestId);
    if (input.streamRevision < entry.streamRevision) {
      return;
    }
    if (input.streamRevision > entry.streamRevision) {
      this.supersedeEntry(entry, input.streamRevision, input.lastEventId, input.canonicalUk);
      return;
    }
    this.advanceTarget(entry, input.lastEventId);
    if (entry.hydration) {
      this.counters.writeThroughDeferred += 1;
      return;
    }
    if (
      !entry.snapshot ||
      input.events.length === 0 ||
      entry.snapshot.lastEventId + 1 !== input.events[0].eventId ||
      input.events[input.events.length - 1].eventId !== input.lastEventId
    ) {
      this.counters.writeThroughDeferred += 1;
      return;
    }
    try {
      const bufferedEventBytes = estimateContestReadableEventsBufferedBytes(input.events);
      const appendAllocationUpperBoundBytes = entry.snapshot.appendAllocationUpperBoundBytes(input.events);
      const reservation = this.reserveBuilder(bufferedEventBytes + appendAllocationUpperBoundBytes, entry);
      if (!reservation) {
        this.counters.writeThroughDeferred += 1;
        return;
      }
      try {
        const append = entry.snapshot.appendCommitted(input.events, this.options.maxSynchronousProjectionChunks);
        this.counters.canonicalizedEvents += append.canonicalizedEventCount;
        if (append.status === 'requires-rebuild') {
          this.counters.projectionRebuilds += 1;
          this.counters.writeThroughDeferred += 1;
          this.dropSnapshot(entry);
          return;
        }
        const desiredBuilderBytes = bufferedEventBytes + this.additionalSnapshotBytes(append.snapshot);
        if (desiredBuilderBytes > reservation.bytes) {
          throw new ContestEventCacheBuildError('append allocation exceeded its pre-reserved upper bound');
        }
        if (!this.resizeReservation(reservation, desiredBuilderBytes, entry)) {
          this.counters.writeThroughDeferred += 1;
          return;
        }
        this.releaseReservation(reservation);
        if (!this.publishSnapshot(entry, append.snapshot)) {
          this.counters.writeThroughDeferred += 1;
        }
      } finally {
        this.releaseReservation(reservation);
      }
    } catch {
      this.counters.writeThroughDeferred += 1;
    }
  }

  public observeWatermark(watermark: ContestCommittedWatermark): void {
    const entry = this.entriesByContestId.get(watermark.contestId);
    if (!entry || entry.tombstoned || this.globallyDisabled || this.disabledContestIds.has(watermark.contestId)) {
      return;
    }
    if (watermark.streamRevision < entry.streamRevision) {
      this.counters.watermarkRegressions += 1;
      return;
    }
    if (watermark.streamRevision > entry.streamRevision) {
      if (this.recordPendingWatermark(entry, watermark)) {
        this.failClosed(entry);
      }
      entry.authoritySnapshotStartedAtMono = Number.NEGATIVE_INFINITY;
      this.contestIdByUk.set(normalizeUk(watermark.canonicalUk), watermark.contestId);
      return;
    }
    this.advanceTarget(entry, watermark.latestEventId);
  }

  /**
   * Materializes a watermark only when this worker already owns a live cache
   * entry. The watermark itself never creates identity state or renews the
   * authority lease; a higher revision must first be confirmed by MySQL.
   */
  public async materializeObservedWatermark(watermark: ContestCommittedWatermark): Promise<boolean> {
    let entry = this.entriesByContestId.get(watermark.contestId);
    if (
      !entry ||
      entry.tombstoned ||
      this.stopping ||
      this.globallyDisabled ||
      this.disabledContestIds.has(watermark.contestId)
    ) {
      this.counters.eagerTailFillSkipped += 1;
      return false;
    }
    this.counters.eagerTailFillAttempts += 1;
    try {
      this.assertEntryLifecycleUsable(entry);
      entry.lastAccessAtMono = this.now();
      this.contestIdByUk.set(normalizeUk(watermark.canonicalUk), watermark.contestId);

      if (watermark.streamRevision < entry.streamRevision) {
        this.counters.eagerTailFillSkipped += 1;
        return false;
      }
      if (watermark.streamRevision > entry.streamRevision) {
        if (this.recordPendingWatermark(entry, watermark)) {
          this.failClosed(entry);
        }
        entry.authoritySnapshotStartedAtMono = Number.NEGATIVE_INFINITY;
      }
      if (entry.pendingWatermark) {
        entry = await this.refreshEntryAuthority(entry, watermark.canonicalUk);
        this.assertEntryUsable(entry);
        if (entry.streamRevision !== watermark.streamRevision || entry.targetLastEventId < watermark.latestEventId) {
          throw new ContestEventReadCacheUnavailableError('watermark revision was not confirmed by MySQL');
        }
      } else {
        this.advanceTarget(entry, watermark.latestEventId);
      }

      if (entry.oversize) {
        throw new ContestEventReadCacheUnavailableError('contest is oversize');
      }
      if (!entry.snapshot || entry.snapshot.lastEventId !== entry.targetLastEventId) {
        await this.ensureHydrated(entry, 'eager');
        this.assertEntryUsable(entry);
      }
      if (
        entry.oversize ||
        !entry.snapshot ||
        entry.snapshot.streamRevision !== watermark.streamRevision ||
        entry.snapshot.lastEventId !== entry.targetLastEventId ||
        entry.snapshot.lastEventId < watermark.latestEventId
      ) {
        throw new ContestEventReadCacheUnavailableError('eager tail-fill did not materialize the observed watermark');
      }
      this.counters.eagerTailFillCompleted += 1;
      return true;
    } catch (error) {
      this.counters.eagerTailFillFailed += 1;
      throw error;
    }
  }

  public invalidate(
    control: ContestEventCacheControl | { type: 'delete'; contestId: string; canonicalUk?: string },
  ): void {
    this.controlToken = {};
    if (control.type === 'delete') {
      this.tombstonedContestIds.add(control.contestId);
      if (control.canonicalUk) {
        this.tombstonedUks.add(normalizeUk(control.canonicalUk));
      }
    }
    const entry = this.entriesByContestId.get(control.contestId);
    if (!entry) {
      return;
    }
    entry.token = {};
    this.dropSnapshot(entry);
    entry.hydration = undefined;
    entry.retryNotBeforeMono = Number.NEGATIVE_INFINITY;
    if (control.type === 'delete') {
      entry.tombstoned = true;
    }
    if (control.canonicalUk) {
      this.contestIdByUk.set(normalizeUk(control.canonicalUk), control.contestId);
    }
    if (control.type === 'metadata') {
      entry.oversize = false;
      entry.visibilityFingerprint = control.visibilityFingerprint;
      entry.authoritySnapshotStartedAtMono = Number.NEGATIVE_INFINITY;
    }
  }

  public disableContest(contestId: string): void {
    if (!this.disabledContestIds.has(contestId)) {
      this.disabledContestIds.add(contestId);
      this.counters.disabledContests += 1;
    }
    const entry = this.entriesByContestId.get(contestId);
    if (!entry) {
      return;
    }
    try {
      this.failClosed(entry);
    } catch (_error) {
      // The deny-set check is installed before best-effort cleanup.
    }
  }

  public disable(): void {
    this.globallyDisabled = true;
    this.controlToken = {};
    for (const entry of this.entriesByContestId.values()) {
      try {
        this.failClosed(entry);
      } catch (_error) {
        // The global kill switch is already active.
      }
    }
  }

  public beginCalibration(contestIds: readonly string[]): object {
    const context = Object.freeze({});
    this.calibrationContexts.set(context, {
      startedAtMono: this.now(),
      targetVersionFence: this.targetVersionSequence,
      tokensByContestId: new Map(
        contestIds.flatMap((contestId) => {
          const entry = this.entriesByContestId.get(contestId);
          return entry ? [[contestId, entry.token] as const] : [];
        }),
      ),
    });
    return context;
  }

  public calibrate(states: readonly ContestEventAuthorityState[], opaqueContext?: object): void {
    const context = opaqueContext ? this.calibrationContexts.get(opaqueContext) : undefined;
    if (opaqueContext) {
      this.calibrationContexts.delete(opaqueContext);
    }
    const startedAt = context?.startedAtMono ?? this.now();
    const targetVersionFence = context?.targetVersionFence ?? this.targetVersionSequence;
    const statesByContestId = new Map(states.map((state) => [state.contestId, state]));
    const contestIds = context ? [...context.tokensByContestId.keys()] : states.map((state) => state.contestId);
    for (const contestId of contestIds) {
      const entry = this.entriesByContestId.get(contestId);
      if (!entry || entry.tombstoned) {
        continue;
      }
      if (context && context.tokensByContestId.get(contestId) !== entry.token) {
        this.counters.generationDiscards += 1;
        continue;
      }
      const state = statesByContestId.get(contestId);
      if (!state) {
        this.invalidate({ type: 'delete', contestId, canonicalUk: entry.canonicalUk });
        continue;
      }
      if (this.isAuthorityResultStaleByTargetAdvance(entry, state, targetVersionFence)) {
        this.counters.authorityResultsStaleByTargetAdvance += 1;
        continue;
      }
      this.applyAuthority(entry, state, startedAt);
    }
  }

  public snapshotCounters(): ContestEventReadCacheCounters {
    return { ...this.counters };
  }

  public start(): void {
    if (this.started || this.stopping) {
      return;
    }
    this.started = true;
    this.lastSummaryCounters = this.snapshotCounters();
    this.lastStoreCounters = contestEventReadMetrics.snapshot();
    this.lastMysqlPoolMetrics = mysqlPoolMetrics.snapshot();
    this.lastSummaryEpochMs = Date.now();
    this.eventLoopDelay.enable();
    this.logSummary(false);
    this.summaryTimer = setInterval(() => this.logSummary(false), this.options.summaryIntervalMs);
    this.summaryTimer.unref?.();
  }

  public getActiveContestIds(): string[] {
    return [...this.entriesByContestId.values()]
      .filter(
        (entry) =>
          !this.globallyDisabled &&
          !entry.tombstoned &&
          !this.disabledContestIds.has(entry.contestId) &&
          (entry.snapshot !== undefined || entry.hydration !== undefined),
      )
      .map((entry) => entry.contestId);
  }

  public recordComparison(uk: string, result: 'match' | 'mismatch' | 'inconclusive' | 'authority-changed'): void {
    this.counters.comparisons += 1;
    if (result === 'match') {
      return;
    }
    if (result === 'inconclusive' || result === 'authority-changed') {
      this.counters.comparisonInconclusive += 1;
      if (result === 'inconclusive') {
        return;
      }
    } else {
      this.counters.comparisonMismatches += 1;
    }
    const contestId = this.contestIdByUk.get(normalizeUk(uk));
    if (!contestId) {
      return;
    }
    const entry = this.entriesByContestId.get(contestId);
    if (entry) {
      this.failClosed(entry);
    }
  }

  public dispose(): void {
    if (this.stopping) {
      return;
    }
    this.stopping = true;
    this.controlToken = {};
    this.hydrationBulkhead.dispose();
    if (this.summaryTimer) {
      clearInterval(this.summaryTimer);
      this.summaryTimer = undefined;
    }
    if (this.started) {
      this.logSummary(true);
      this.eventLoopDelay.disable();
      this.started = false;
    }
    for (const entry of this.entriesByContestId.values()) {
      entry.token = {};
      this.dropSnapshot(entry);
      entry.hydration = undefined;
      entry.authorityRefresh = undefined;
    }
    this.entriesByContestId.clear();
    this.contestIdByUk.clear();
    this.tombstonedContestIds.clear();
    this.tombstonedUks.clear();
    this.identityFlights.clear();
    this.identityFailureCooldowns.clear();
  }

  private logSummary(final: boolean): void {
    const current = this.snapshotCounters();
    const store = contestEventReadMetrics.snapshot();
    const pool = mysqlPoolMetrics.snapshot();
    const endEpochMs = Date.now();
    const startEpochMs = this.lastSummaryEpochMs ?? endEpochMs;
    try {
      console.info('contest_event_read_cache.summary', {
        final,
        gauges: {
          residentContests: current.residentContests,
          residentEvents: current.residentEvents,
          residentBytes: current.residentBytes,
          builderReservedBytes: current.builderReservedBytes,
          retiredPinnedBytes: current.retiredPinnedBytes,
          totalAccountedBytes: current.totalAccountedBytes,
          highWaterAccountedBytes: current.highWaterAccountedBytes,
          hydrating: current.hydrating,
        },
        cacheDelta: numericDelta(current, this.lastSummaryCounters),
        storeDelta: numericDelta(store, this.lastStoreCounters),
        config: {
          maxBytes: this.options.maxBytes,
          maxEntryBytes: this.options.maxEntryBytes,
          chunkEventCount: this.options.chunkEventCount,
          hydrationConcurrency: this.options.hydrationConcurrency,
        },
      });
      console.info(
        'contest_event_read_runtime.summary',
        JSON.stringify({
          capturedAt: new Date(endEpochMs).toISOString(),
          interval: { startEpochMs, endEpochMs },
          final,
          mysqlPool: {
            gauges: {
              poolCount: pool.poolCount,
              totalConnections: pool.totalConnections,
              freeConnections: pool.freeConnections,
              inUseConnections: pool.inUseConnections,
              queuedAcquires: pool.queuedAcquires,
              highWaterInUseConnections: pool.highWaterInUseConnections,
              highWaterQueuedAcquires: pool.highWaterQueuedAcquires,
            },
            delta: mysqlPoolDelta(pool, this.lastMysqlPoolMetrics),
          },
          cache: {
            gauges: {
              residentContests: current.residentContests,
              residentEvents: current.residentEvents,
              residentBytes: current.residentBytes,
              builderReservedBytes: current.builderReservedBytes,
              retiredPinnedBytes: current.retiredPinnedBytes,
              totalAccountedBytes: current.totalAccountedBytes,
              highWaterAccountedBytes: current.highWaterAccountedBytes,
              hydrating: current.hydrating,
            },
            delta: cacheCounterDelta(current, this.lastSummaryCounters),
          },
          storeDelta: numericDelta(store, this.lastStoreCounters),
          databaseReadDelta: databaseReadDelta(store, this.lastStoreCounters),
          eventLoopLagMs: eventLoopLagSnapshot(this.eventLoopDelay),
          ...optionalNodeMemorySnapshot(),
        }),
      );
    } catch (_error) {
      // Aggregate logging cannot alter cache availability.
    }
    this.lastSummaryCounters = current;
    this.lastStoreCounters = store;
    this.lastMysqlPoolMetrics = pool;
    this.lastSummaryEpochMs = endEpochMs;
    this.eventLoopDelay.reset();
  }

  private async resolveEntry(uk: string): Promise<CacheEntry> {
    const aliasKey = normalizeUk(uk);
    if (this.tombstonedUks.has(aliasKey)) {
      throw contestNotFound(uk);
    }
    const knownContestId = this.contestIdByUk.get(aliasKey);
    if (knownContestId) {
      const known = this.entriesByContestId.get(knownContestId);
      if (known && !known.tombstoned) {
        return known;
      }
    }
    const existingFlight = this.identityFlights.get(aliasKey);
    if (existingFlight) {
      this.counters.singleflightJoins += 1;
      return existingFlight;
    }
    const cooldown = this.identityFailureCooldowns.get(aliasKey);
    if (cooldown?.token === this.controlToken && this.now() < cooldown.retryNotBeforeMono) {
      this.counters.failureCooldownRejects += 1;
      throw new ContestEventReadCacheUnavailableError('identity read is in failure cooldown');
    }
    const flight = this.loadIdentity(uk);
    this.identityFlights.set(aliasKey, flight);
    try {
      return await flight;
    } finally {
      if (this.identityFlights.get(aliasKey) === flight) {
        this.identityFlights.delete(aliasKey);
      }
    }
  }

  private async loadIdentity(uk: string): Promise<CacheEntry> {
    const lifecycleToken = this.controlToken;
    const targetVersionFence = this.targetVersionSequence;
    const aliasKey = normalizeUk(uk);
    const startedAt = this.now();
    let state: ContestEventAuthorityState;
    try {
      state = await this.loader.readAuthorityByUk(uk);
    } catch (error) {
      if (error instanceof LogicException) {
        throw error;
      }
      if (this.controlToken === lifecycleToken && !this.stopping) {
        this.identityFailureCooldowns.set(aliasKey, {
          token: lifecycleToken,
          retryNotBeforeMono: this.now() + this.options.failureCooldownMs,
        });
      }
      throw new ContestEventReadCacheUnavailableError('identity authority read failed');
    }
    if (this.tombstonedContestIds.has(state.contestId) || this.tombstonedUks.has(normalizeUk(uk))) {
      throw contestNotFound(uk);
    }
    if (this.stopping || this.controlToken !== lifecycleToken) {
      this.counters.generationDiscards += 1;
      throw new ContestEventReadCacheUnavailableError(
        this.stopping ? 'cache is draining' : 'control changed during identity authority read',
      );
    }
    if (this.globallyDisabled || this.disabledContestIds.has(state.contestId)) {
      throw new ContestEventReadCacheUnavailableError('contest cache is disabled');
    }
    let entry = this.entriesByContestId.get(state.contestId);
    if (!entry) {
      entry = {
        contestId: state.contestId,
        token: {},
        targetVersion: this.nextTargetVersion(),
        canonicalUk: state.canonicalUk,
        streamRevision: state.streamRevision,
        targetLastEventId: state.lastEventId,
        visibilityFingerprint: state.visibilityFingerprint,
        frozenStartNs: state.frozenStartNs ?? null,
        authoritySnapshotStartedAtMono: startedAt,
        lastAccessAtMono: this.now(),
        tombstoned: false,
        oversize: false,
        retryNotBeforeMono: Number.NEGATIVE_INFINITY,
      };
      this.entriesByContestId.set(state.contestId, entry);
    } else if (!entry.tombstoned) {
      if (this.isAuthorityResultStaleByTargetAdvance(entry, state, targetVersionFence)) {
        this.counters.authorityResultsStaleByTargetAdvance += 1;
      } else {
        if (!this.applyAuthority(entry, state, startedAt)) {
          throw new ContestEventReadCacheUnavailableError('pending watermark was not confirmed by MySQL');
        }
      }
    }
    this.contestIdByUk.set(normalizeUk(uk), state.contestId);
    this.contestIdByUk.set(normalizeUk(state.canonicalUk), state.contestId);
    this.identityFailureCooldowns.delete(aliasKey);
    return entry;
  }

  private async refreshEntryAuthority(entry: CacheEntry, requestUk: string): Promise<CacheEntry> {
    this.assertEntryRetryAllowed(entry, true);
    if (entry.authorityRefresh) {
      this.counters.singleflightJoins += 1;
      await entry.authorityRefresh;
      return entry;
    }
    const token = entry.token;
    const flight = (async () => {
      for (let pass = 0; pass < MAX_AUTHORITY_STABILIZATION_PASSES; pass += 1) {
        const startedAt = this.now();
        const targetVersionFence = this.targetVersionSequence;
        let state: ContestEventAuthorityState;
        try {
          state = await this.loader.readAuthorityByUk(requestUk);
        } catch (error) {
          if (error instanceof LogicException && error.code === ErrCode.ContestNotFound) {
            this.invalidate({ type: 'delete', contestId: entry.contestId, canonicalUk: entry.canonicalUk });
            throw error;
          }
          if (error instanceof LogicException) {
            throw error;
          }
          if (entry.token === token) {
            entry.retryNotBeforeMono = this.now() + this.options.failureCooldownMs;
          }
          throw new ContestEventReadCacheUnavailableError('authority refresh failed');
        }
        if (this.stopping) {
          throw new ContestEventReadCacheUnavailableError('cache is draining');
        }
        if (state.contestId !== entry.contestId) {
          throw new ContestEventReadCacheUnavailableError('contest identity changed during authority refresh');
        }
        if (entry.token !== token) {
          this.counters.generationDiscards += 1;
          throw new ContestEventReadCacheUnavailableError('generation changed during authority refresh');
        }
        if (this.isAuthorityResultStaleByTargetAdvance(entry, state, targetVersionFence)) {
          this.counters.authorityResultsStaleByTargetAdvance += 1;
          continue;
        }
        if (!this.applyAuthority(entry, state, startedAt)) {
          throw new ContestEventReadCacheUnavailableError('pending watermark was not confirmed by MySQL');
        }
        entry.retryNotBeforeMono = Number.NEGATIVE_INFINITY;
        return;
      }
      if (entry.token === token) {
        entry.retryNotBeforeMono = this.now() + this.options.failureCooldownMs;
      }
      throw new ContestEventReadCacheUnavailableError('authority did not stabilize after target advances');
    })();
    entry.authorityRefresh = flight;
    try {
      await flight;
      return entry;
    } finally {
      if (entry.authorityRefresh === flight) {
        entry.authorityRefresh = undefined;
      }
    }
  }

  private applyAuthority(entry: CacheEntry, state: ContestEventAuthorityState, startedAt: number): boolean {
    if (entry.tombstoned || state.contestId !== entry.contestId) {
      return false;
    }
    if (!this.authoritySatisfiesPendingWatermark(entry, state)) {
      this.counters.pendingWatermarkAuthorityRejects += 1;
      return false;
    }
    if (state.streamRevision < entry.streamRevision) {
      this.counters.watermarkRegressions += 1;
      return false;
    }
    if (state.streamRevision > entry.streamRevision) {
      this.supersedeEntry(entry, state.streamRevision, state.lastEventId, state.canonicalUk);
    } else if (state.lastEventId < entry.targetLastEventId) {
      this.failClosed(entry);
      return false;
    } else {
      this.advanceTarget(entry, state.lastEventId);
    }
    if (entry.visibilityFingerprint !== state.visibilityFingerprint) {
      entry.visibilityFingerprint = state.visibilityFingerprint;
      entry.frozenStartNs = state.frozenStartNs ?? null;
      this.failClosed(entry);
    }
    entry.canonicalUk = state.canonicalUk;
    entry.authoritySnapshotStartedAtMono = startedAt;
    this.contestIdByUk.set(normalizeUk(state.canonicalUk), state.contestId);
    entry.pendingWatermark = undefined;
    return true;
  }

  private async ensureHydrated(entry: CacheEntry, trigger: 'get' | 'eager'): Promise<void> {
    this.assertEntryRetryAllowed(entry);
    if (entry.hydration) {
      this.counters.singleflightJoins += 1;
      if (trigger === 'eager') {
        this.counters.eagerTailFillJoined += 1;
      }
      return entry.hydration;
    }
    if (trigger === 'eager') {
      this.counters.eagerTailFillStarted += 1;
    } else {
      this.counters.getHydrationStarted += 1;
    }
    const hydrationToken = entry.token;
    const flight = this.hydrationBulkhead
      .run(async () => {
        if (this.stopping || entry.token !== hydrationToken || entry.tombstoned) {
          throw new ContestEventReadCacheUnavailableError('generation changed before hydration started');
        }
        this.counters.hydrating += 1;
        try {
          await this.hydrate(entry);
        } finally {
          this.counters.hydrating = Math.max(0, this.counters.hydrating - 1);
        }
      })
      .catch((error) => {
        if (error instanceof ContestEventReadBulkheadError) {
          this.counters.bulkheadRejects += 1;
          if (error.reason === 'queue-timeout') {
            this.counters.queueTimeouts += 1;
          }
          throw new ContestEventReadCacheUnavailableError(error.reason);
        }
        if (error instanceof ContestEventReadCacheUnavailableError) {
          if (entry.token === hydrationToken && !entry.tombstoned) {
            entry.retryNotBeforeMono = this.now() + this.options.failureCooldownMs;
          }
          throw error;
        }
        if (error instanceof LogicException && error.code === ErrCode.ContestNotFound) {
          throw error;
        }
        this.failClosed(entry);
        if (!entry.tombstoned) {
          entry.retryNotBeforeMono = this.now() + this.options.failureCooldownMs;
        }
        throw new ContestEventReadCacheUnavailableError('hydration validation failed');
      });
    entry.hydration = flight;
    try {
      await flight;
      entry.retryNotBeforeMono = Number.NEGATIVE_INFINITY;
    } finally {
      if (entry.hydration === flight) {
        entry.hydration = undefined;
      }
    }
  }

  private async hydrate(entry: CacheEntry): Promise<void> {
    this.counters.hydrationStarted += 1;
    const token = entry.token;
    const revision = entry.streamRevision;
    const stabilizationBudget = { remainingAuthorityReads: MAX_AUTHORITY_STABILIZATION_PASSES };
    for (
      let attempt = 0;
      attempt < MAX_HYDRATION_ATTEMPTS && stabilizationBudget.remainingAuthorityReads > 0;
      attempt += 1
    ) {
      this.assertGenerationActive(entry, token, 'generation changed before hydration retry');
      if (await this.hydrateAttempt(entry, token, revision, stabilizationBudget)) {
        this.counters.hydrationCompleted += 1;
        return;
      }
    }
    this.counters.hydrationStabilizationFailures += 1;
    throw new ContestEventReadCacheUnavailableError('target did not stabilize during hydration');
  }

  private async hydrateAttempt(
    entry: CacheEntry,
    token: object,
    revision: number,
    stabilizationBudget: HydrationStabilizationBudget,
  ): Promise<boolean> {
    let baseSnapshot = entry.snapshot?.streamRevision === revision ? entry.snapshot : undefined;
    let target = entry.targetLastEventId;
    const events: ContestReadableEvent[] = [];
    let afterEventId = baseSnapshot?.lastEventId ?? 0;
    if (
      baseSnapshot &&
      this.getSnapshotPinCount(baseSnapshot) === 0 &&
      this.getContestAccountedBytes(entry.contestId) + baseSnapshot.appendAllocationLowerBoundBytes() >
        this.options.maxEntryBytes
    ) {
      this.dropSnapshot(entry);
      baseSnapshot = undefined;
      afterEventId = 0;
    }
    const reservation = this.reserveBuilder(0, entry);
    if (!reservation) {
      this.throwBuilderCapacityFailure(entry, 0);
    }
    let bufferedEventBytes = 0;
    const reserveBufferedPage = (estimate: ContestEventRangeMemoryEstimate) => {
      const estimatedBytes = estimateContestReadableEventBufferTotals(
        estimate.rowCount,
        estimate.payloadBytes,
        estimate.solutionSubmitTimeBytes,
      );
      this.ensureBuilderReservation(reservation, bufferedEventBytes + estimatedBytes, entry);
      return estimatedBytes;
    };
    const acceptBufferedRows = (rows: readonly ContestReadableEvent[], preReservedBytes: number) => {
      const actualBytes = estimateContestReadableEventsBufferedBytes(rows);
      if (actualBytes > preReservedBytes) {
        throw new ContestEventCacheBuildError('event range allocation exceeded its pre-reserved upper bound');
      }
      bufferedEventBytes += actualBytes;
      this.resizeReservation(reservation, bufferedEventBytes, entry);
    };
    try {
      await this.readHydrationRange(
        entry.contestId,
        revision,
        events,
        afterEventId,
        target,
        reserveBufferedPage,
        acceptBufferedRows,
        () => this.assertGenerationActive(entry, token, 'generation changed during hydration range read'),
      );
      if (events.length > 0) {
        afterEventId = events[events.length - 1].eventId;
      }

      let finalState: ContestEventAuthorityState | undefined;
      let finalStartedAt = Number.NEGATIVE_INFINITY;
      while (stabilizationBudget.remainingAuthorityReads > 0) {
        stabilizationBudget.remainingAuthorityReads -= 1;
        finalStartedAt = this.now();
        const targetVersionFence = this.targetVersionSequence;
        const finalStates = await this.loader.readAuthorityByContestIds([entry.contestId]);
        this.assertGenerationActive(entry, token, 'generation changed during final authority read');
        const observed = finalStates.find((state) => state.contestId === entry.contestId);
        if (!observed) {
          this.invalidate({ type: 'delete', contestId: entry.contestId, canonicalUk: entry.canonicalUk });
          throw contestNotFound(entry.canonicalUk);
        }
        if (entry.token !== token || entry.tombstoned || observed.streamRevision !== revision) {
          this.counters.generationDiscards += 1;
          throw new ContestEventReadCacheUnavailableError('generation changed during hydration');
        }
        if (observed.visibilityFingerprint !== entry.visibilityFingerprint) {
          this.applyAuthority(entry, observed, finalStartedAt);
          this.counters.generationDiscards += 1;
          throw new ContestEventReadCacheUnavailableError('authority changed during hydration');
        }
        const staleByTargetAdvance = this.isAuthorityResultStaleByTargetAdvance(entry, observed, targetVersionFence);
        if (staleByTargetAdvance) {
          this.counters.authorityResultsStaleByTargetAdvance += 1;
        }
        if (observed.lastEventId < target && !staleByTargetAdvance) {
          this.applyAuthority(entry, observed, finalStartedAt);
          this.counters.generationDiscards += 1;
          throw new ContestEventReadCacheUnavailableError('authority changed during hydration');
        }
        const observedTarget = Math.max(target, entry.targetLastEventId, observed.lastEventId);
        if (observedTarget > afterEventId) {
          target = observedTarget;
          this.advanceTarget(entry, target);
          await this.readHydrationRange(
            entry.contestId,
            revision,
            events,
            afterEventId,
            target,
            reserveBufferedPage,
            acceptBufferedRows,
            () => this.assertGenerationActive(entry, token, 'generation changed during hydration tail read'),
          );
          afterEventId = events[events.length - 1]?.eventId ?? afterEventId;
          continue;
        }
        finalState = observed;
        target = observedTarget;
        break;
      }
      if (!finalState) {
        return false;
      }

      let snapshot: ContestEventCacheSnapshot;
      if (baseSnapshot) {
        const appendAllocationUpperBoundBytes = baseSnapshot.appendAllocationUpperBoundBytes(events);
        if (!this.resizeReservation(reservation, bufferedEventBytes + appendAllocationUpperBoundBytes, entry)) {
          if (this.getSnapshotPinCount(baseSnapshot) === 0) {
            this.dropSnapshot(entry);
            return false;
          }
          this.throwBuilderCapacityFailure(entry, appendAllocationUpperBoundBytes);
        }
        const append = baseSnapshot.appendCommitted(events, this.options.maxSynchronousProjectionChunks);
        this.counters.canonicalizedEvents += append.canonicalizedEventCount;
        if (append.status === 'appended') {
          snapshot = append.snapshot;
        } else {
          this.counters.projectionRebuilds += 1;
          const fullEvents: ContestReadableEvent[] = [];
          await this.readHydrationRange(
            entry.contestId,
            revision,
            fullEvents,
            0,
            target,
            reserveBufferedPage,
            acceptBufferedRows,
            () => this.assertGenerationActive(entry, token, 'generation changed during projection rebuild'),
          );
          this.ensureBuilderReservation(
            reservation,
            bufferedEventBytes +
              estimateContestEventSnapshotBuildUpperBoundBytes(
                entry.contestId,
                fullEvents,
                this.options.chunkEventCount,
              ),
            entry,
          );
          snapshot = buildContestEventCacheSnapshot({
            contestId: entry.contestId,
            streamRevision: revision,
            targetLastEventId: target,
            frozenStartNs: finalState.frozenStartNs,
            chunkEventCount: this.options.chunkEventCount,
            events: fullEvents,
          });
          this.counters.canonicalizedEvents += fullEvents.length;
        }
      } else {
        this.ensureBuilderReservation(
          reservation,
          bufferedEventBytes +
            estimateContestEventSnapshotBuildUpperBoundBytes(entry.contestId, events, this.options.chunkEventCount),
          entry,
        );
        snapshot = buildContestEventCacheSnapshot({
          contestId: entry.contestId,
          streamRevision: revision,
          targetLastEventId: target,
          frozenStartNs: finalState.frozenStartNs,
          chunkEventCount: this.options.chunkEventCount,
          events,
        });
        this.counters.canonicalizedEvents += events.length;
      }
      const desiredBuilderBytes = bufferedEventBytes + this.additionalSnapshotBytes(snapshot);
      if (desiredBuilderBytes > reservation.bytes) {
        throw new ContestEventCacheBuildError('snapshot allocation exceeded its pre-reserved upper bound');
      }
      this.resizeReservation(reservation, desiredBuilderBytes, entry);
      if (entry.token !== token || entry.tombstoned) {
        this.counters.generationDiscards += 1;
        throw new ContestEventReadCacheUnavailableError('generation changed before publish');
      }
      if (entry.targetLastEventId !== target) {
        return false;
      }
      this.releaseReservation(reservation);
      if (!this.publishSnapshot(entry, snapshot)) {
        throw new ContestEventReadCacheUnavailableError(
          entry.oversize ? 'contest is oversize' : 'cache budget is exhausted',
        );
      }
      this.advanceTarget(entry, target);
      entry.authoritySnapshotStartedAtMono = finalStartedAt;
      return true;
    } finally {
      this.releaseReservation(reservation);
    }
  }

  private async readHydrationRange(
    contestId: string,
    streamRevision: number,
    destination: ContestReadableEvent[],
    initialAfterEventId: number,
    throughEventId: number,
    reservePage: (estimate: ContestEventRangeMemoryEstimate) => number,
    acceptRows: (rows: readonly ContestReadableEvent[], preReservedBytes: number) => void,
    assertActive?: () => void,
  ): Promise<void> {
    let afterEventId = initialAfterEventId;
    while (afterEventId < throughEventId) {
      const request = {
        contestId,
        streamRevision,
        afterEventId,
        throughEventId,
        limit: this.options.hydrationPageSize,
      };
      const estimate = await this.loader.estimateEventRangeMemory(request);
      assertActive?.();
      const preReservedBytes = reservePage(estimate);
      const rows = await this.loader.readEventRange(request);
      assertActive?.();
      if (rows.length === 0 || rows[0].eventId !== afterEventId + 1) {
        throw new ContestEventReadCacheUnavailableError('hydration did not return a continuous range');
      }
      if (rows.length !== estimate.rowCount) {
        throw new ContestEventReadCacheUnavailableError('hydration range changed after memory preflight');
      }
      acceptRows(rows, preReservedBytes);
      destination.push(...rows);
      const nextAfterEventId = rows[rows.length - 1].eventId;
      if (nextAfterEventId <= afterEventId || nextAfterEventId > throughEventId) {
        throw new ContestEventReadCacheUnavailableError('hydration range made invalid progress');
      }
      afterEventId = nextAfterEventId;
    }
  }

  private ensureBuilderReservation(reservation: BuilderReservation, desiredBytes: number, entry: CacheEntry): void {
    if (desiredBytes <= reservation.bytes) {
      return;
    }
    if (!this.resizeReservation(reservation, desiredBytes, entry)) {
      this.throwBuilderCapacityFailure(entry, desiredBytes);
    }
  }

  private throwBuilderCapacityFailure(entry: CacheEntry, desiredBytes: number): never {
    entry.oversize = desiredBytes > this.options.maxEntryBytes;
    if (entry.oversize) {
      this.counters.oversizeMarkers += 1;
    }
    throw new ContestEventReadCacheUnavailableError(
      entry.oversize ? 'contest is oversize' : 'cache budget is exhausted',
    );
  }

  private publishSnapshot(entry: CacheEntry, snapshot: ContestEventCacheSnapshot): boolean {
    if (snapshot.estimatedBytes > this.options.maxEntryBytes) {
      entry.oversize = true;
      this.counters.oversizeMarkers += 1;
      return false;
    }
    this.dropSnapshot(entry);
    const additionalBytes = this.additionalSnapshotBytes(snapshot);
    if (this.getContestAccountedBytes(entry.contestId) + additionalBytes > this.options.maxEntryBytes) {
      return false;
    }
    this.evictUntilFits(additionalBytes, entry.contestId);
    if (this.counters.totalAccountedBytes + additionalBytes > this.options.maxBytes) {
      return false;
    }
    entry.snapshot = snapshot;
    entry.oversize = false;
    this.counters.residentContests += 1;
    this.counters.residentEvents += snapshot.eventCount;
    this.addSnapshotMemory(snapshot, 'resident');
    return true;
  }

  private reserveBuilder(bytes: number, entry: CacheEntry): BuilderReservation | undefined {
    if (
      bytes > this.options.maxEntryBytes ||
      this.getContestAccountedBytes(entry.contestId) + bytes > this.options.maxEntryBytes
    ) {
      return undefined;
    }
    this.evictUntilFits(bytes, entry.contestId);
    if (this.counters.totalAccountedBytes + bytes > this.options.maxBytes) {
      return undefined;
    }
    const reservation = { contestId: entry.contestId, bytes, released: false };
    this.counters.builderReservedBytes += bytes;
    this.counters.totalAccountedBytes += bytes;
    this.addContestAccountedBytes(entry.contestId, bytes);
    this.updateAccountedHighWater();
    return reservation;
  }

  private resizeReservation(reservation: BuilderReservation, desiredBytes: number, entry: CacheEntry): boolean {
    if (reservation.released || desiredBytes > this.options.maxEntryBytes) {
      return false;
    }
    const delta = desiredBytes - reservation.bytes;
    if (delta > 0) {
      if (this.getContestAccountedBytes(entry.contestId) + delta > this.options.maxEntryBytes) {
        return false;
      }
      this.evictUntilFits(delta, entry.contestId);
      if (this.counters.totalAccountedBytes + delta > this.options.maxBytes) {
        return false;
      }
    }
    reservation.bytes = desiredBytes;
    this.counters.builderReservedBytes = Math.max(0, this.counters.builderReservedBytes + delta);
    this.counters.totalAccountedBytes = Math.max(0, this.counters.totalAccountedBytes + delta);
    this.addContestAccountedBytes(reservation.contestId, delta);
    this.updateAccountedHighWater();
    return true;
  }

  private releaseReservation(reservation: BuilderReservation): void {
    if (reservation.released) {
      return;
    }
    reservation.released = true;
    this.counters.builderReservedBytes = Math.max(0, this.counters.builderReservedBytes - reservation.bytes);
    this.counters.totalAccountedBytes = Math.max(0, this.counters.totalAccountedBytes - reservation.bytes);
    this.addContestAccountedBytes(reservation.contestId, -reservation.bytes);
  }

  private updateAccountedHighWater(): void {
    this.counters.highWaterAccountedBytes = Math.max(
      this.counters.highWaterAccountedBytes,
      this.counters.totalAccountedBytes,
    );
  }

  private evictUntilFits(requiredBytes: number, protectedContestId: string): void {
    this.evictExpired();
    while (this.counters.totalAccountedBytes + requiredBytes > this.options.maxBytes) {
      let victim: CacheEntry | undefined;
      for (const candidate of this.entriesByContestId.values()) {
        if (
          candidate.contestId === protectedContestId ||
          !candidate.snapshot ||
          candidate.hydration ||
          this.getSnapshotPinCount(candidate.snapshot) > 0
        ) {
          continue;
        }
        if (!victim || candidate.lastAccessAtMono < victim.lastAccessAtMono) {
          victim = candidate;
        }
      }
      if (!victim) {
        return;
      }
      this.evictSnapshot(victim);
      this.counters.lruEvictions += 1;
    }
  }

  private evictExpired(): void {
    const cutoff = this.now() - this.options.idleTtlMs;
    for (const entry of this.entriesByContestId.values()) {
      if (
        !entry.snapshot ||
        entry.hydration ||
        this.getSnapshotPinCount(entry.snapshot) > 0 ||
        entry.lastAccessAtMono > cutoff
      ) {
        continue;
      }
      this.evictSnapshot(entry);
      this.counters.ttlEvictions += 1;
    }
  }

  private nextTargetVersion(): number {
    this.targetVersionSequence += 1;
    return this.targetVersionSequence;
  }

  private advanceTarget(entry: CacheEntry, target: number): boolean {
    if (target <= entry.targetLastEventId) {
      return false;
    }
    entry.targetLastEventId = target;
    entry.targetVersion = this.nextTargetVersion();
    if (entry.hydration) {
      this.counters.targetAdvancesDuringHydration += 1;
    }
    return true;
  }

  private isAuthorityResultStaleByTargetAdvance(
    entry: CacheEntry,
    state: ContestEventAuthorityState,
    targetVersionFence: number,
  ): boolean {
    return (
      state.streamRevision === entry.streamRevision &&
      state.visibilityFingerprint === entry.visibilityFingerprint &&
      state.lastEventId < entry.targetLastEventId &&
      entry.targetVersion > targetVersionFence
    );
  }

  private recordPendingWatermark(entry: CacheEntry, watermark: ContestCommittedWatermark): boolean {
    const current = entry.pendingWatermark;
    if (
      current &&
      (watermark.streamRevision < current.streamRevision ||
        (watermark.streamRevision === current.streamRevision && watermark.latestEventId <= current.latestEventId))
    ) {
      return false;
    }
    const requiresNewGeneration = !current || watermark.streamRevision > current.streamRevision;
    entry.pendingWatermark = { ...watermark };
    return requiresNewGeneration;
  }

  private authoritySatisfiesPendingWatermark(entry: CacheEntry, state: ContestEventAuthorityState): boolean {
    const pending = entry.pendingWatermark;
    if (!pending) {
      return true;
    }
    return (
      state.streamRevision > pending.streamRevision ||
      (state.streamRevision === pending.streamRevision && state.lastEventId >= pending.latestEventId)
    );
  }

  private supersedeEntry(entry: CacheEntry, revision: number, target: number, canonicalUk: string): void {
    entry.token = {};
    this.dropSnapshot(entry);
    entry.hydration = undefined;
    entry.authorityRefresh = undefined;
    entry.streamRevision = revision;
    entry.targetLastEventId = target;
    entry.targetVersion = this.nextTargetVersion();
    entry.canonicalUk = canonicalUk;
    entry.authoritySnapshotStartedAtMono = Number.NEGATIVE_INFINITY;
    entry.oversize = false;
    entry.retryNotBeforeMono = Number.NEGATIVE_INFINITY;
    entry.pendingWatermark = undefined;
  }

  private failClosed(entry: CacheEntry): void {
    entry.token = {};
    this.dropSnapshot(entry);
    entry.hydration = undefined;
    entry.authorityRefresh = undefined;
    entry.retryNotBeforeMono = Number.NEGATIVE_INFINITY;
  }

  private dropSnapshot(entry: CacheEntry): void {
    const snapshot = entry.snapshot;
    if (!snapshot) {
      return;
    }
    entry.snapshot = undefined;
    this.counters.residentContests = Math.max(0, this.counters.residentContests - 1);
    this.counters.residentEvents = Math.max(0, this.counters.residentEvents - snapshot.eventCount);
    if (this.getSnapshotPinCount(snapshot) > 0) {
      if (!this.retiredSnapshots.has(snapshot)) {
        this.retiredSnapshots.add(snapshot);
        this.addSnapshotMemory(snapshot, 'retired');
      }
      this.removeSnapshotMemory(snapshot, 'resident');
      return;
    }
    this.removeSnapshotMemory(snapshot, 'resident');
  }

  private evictSnapshot(entry: CacheEntry): void {
    entry.token = {};
    entry.authorityRefresh = undefined;
    this.dropSnapshot(entry);
  }

  private pinSnapshot(snapshot: ContestEventCacheSnapshot): void {
    this.pinsBySnapshot.set(snapshot, this.getSnapshotPinCount(snapshot) + 1);
  }

  private releaseSnapshot(snapshot: ContestEventCacheSnapshot): void {
    const current = this.getSnapshotPinCount(snapshot);
    if (current <= 1) {
      this.pinsBySnapshot.delete(snapshot);
      if (this.retiredSnapshots.delete(snapshot)) {
        this.removeSnapshotMemory(snapshot, 'retired');
      }
      return;
    }
    this.pinsBySnapshot.set(snapshot, current - 1);
  }

  private getSnapshotPinCount(snapshot: ContestEventCacheSnapshot): number {
    return this.pinsBySnapshot.get(snapshot) ?? 0;
  }

  private additionalSnapshotBytes(snapshot: ContestEventCacheSnapshot): number {
    let additionalBytes = 0;
    for (const [identity, estimatedBytes] of this.snapshotMemoryPartsOf(snapshot)) {
      const current = this.snapshotMemoryParts.get(identity);
      if (!current) {
        additionalBytes += estimatedBytes;
        continue;
      }
      this.assertSnapshotMemoryPart(current, snapshot.contestId, estimatedBytes);
    }
    return additionalBytes;
  }

  private addSnapshotMemory(snapshot: ContestEventCacheSnapshot, kind: SnapshotMemoryKind): void {
    this.updateSnapshotMemory(snapshot, kind, 1);
  }

  private removeSnapshotMemory(snapshot: ContestEventCacheSnapshot, kind: SnapshotMemoryKind): void {
    this.updateSnapshotMemory(snapshot, kind, -1);
  }

  private updateSnapshotMemory(
    snapshot: ContestEventCacheSnapshot,
    kind: SnapshotMemoryKind,
    referenceDelta: 1 | -1,
  ): void {
    for (const [identity, estimatedBytes] of this.snapshotMemoryPartsOf(snapshot)) {
      let current = this.snapshotMemoryParts.get(identity);
      if (!current) {
        if (referenceDelta < 0) {
          throw new Error('snapshot memory accounting underflow');
        }
        current = {
          contestId: snapshot.contestId,
          estimatedBytes,
          residentReferences: 0,
          retiredReferences: 0,
        };
        this.snapshotMemoryParts.set(identity, current);
      } else {
        this.assertSnapshotMemoryPart(current, snapshot.contestId, estimatedBytes);
      }

      const beforeResident = current.residentReferences > 0;
      const beforeRetiredOnly = !beforeResident && current.retiredReferences > 0;
      const beforeAccounted = beforeResident || current.retiredReferences > 0;
      if (kind === 'resident') {
        current.residentReferences += referenceDelta;
      } else {
        current.retiredReferences += referenceDelta;
      }
      if (current.residentReferences < 0 || current.retiredReferences < 0) {
        throw new Error('snapshot memory reference count underflow');
      }
      const afterResident = current.residentReferences > 0;
      const afterRetiredOnly = !afterResident && current.retiredReferences > 0;
      const afterAccounted = afterResident || current.retiredReferences > 0;

      this.counters.residentBytes = Math.max(
        0,
        this.counters.residentBytes + (Number(afterResident) - Number(beforeResident)) * estimatedBytes,
      );
      this.counters.retiredPinnedBytes = Math.max(
        0,
        this.counters.retiredPinnedBytes + (Number(afterRetiredOnly) - Number(beforeRetiredOnly)) * estimatedBytes,
      );
      const accountedDelta = (Number(afterAccounted) - Number(beforeAccounted)) * estimatedBytes;
      if (accountedDelta !== 0) {
        this.counters.totalAccountedBytes = Math.max(0, this.counters.totalAccountedBytes + accountedDelta);
        this.addContestAccountedBytes(snapshot.contestId, accountedDelta);
      }
      if (!afterAccounted) {
        this.snapshotMemoryParts.delete(identity);
      }
    }
    this.updateAccountedHighWater();
  }

  private snapshotMemoryPartsOf(snapshot: ContestEventCacheSnapshot): Map<object, number> {
    const unique = new Map<object, number>();
    let total = 0;
    for (const part of snapshot.memoryParts()) {
      if (!Number.isSafeInteger(part.estimatedBytes) || part.estimatedBytes < 0) {
        throw new Error('snapshot memory part has an invalid byte estimate');
      }
      if (part.estimatedBytes === 0) {
        continue;
      }
      const existing = unique.get(part.identity);
      if (existing !== undefined) {
        if (existing !== part.estimatedBytes) {
          throw new Error('snapshot memory part has conflicting byte estimates');
        }
        continue;
      }
      unique.set(part.identity, part.estimatedBytes);
      total += part.estimatedBytes;
    }
    if (total !== snapshot.estimatedBytes) {
      throw new Error('snapshot memory parts do not match the snapshot byte estimate');
    }
    return unique;
  }

  private assertSnapshotMemoryPart(
    current: SnapshotMemoryPartAccounting,
    contestId: string,
    estimatedBytes: number,
  ): void {
    if (current.contestId !== contestId || current.estimatedBytes !== estimatedBytes) {
      throw new Error('shared snapshot memory part ownership changed');
    }
  }

  private getContestAccountedBytes(contestId: string): number {
    return this.accountedBytesByContestId.get(contestId) ?? 0;
  }

  private addContestAccountedBytes(contestId: string, delta: number): void {
    const next = Math.max(0, this.getContestAccountedBytes(contestId) + delta);
    if (next === 0) {
      this.accountedBytesByContestId.delete(contestId);
      return;
    }
    this.accountedBytesByContestId.set(contestId, next);
  }

  private assertEntryLifecycleUsable(entry: CacheEntry): void {
    if (entry.tombstoned || this.tombstonedContestIds.has(entry.contestId)) {
      throw contestNotFound(entry.canonicalUk);
    }
    if (this.stopping) {
      throw new ContestEventReadCacheUnavailableError('cache is draining');
    }
    if (this.globallyDisabled || this.disabledContestIds.has(entry.contestId)) {
      throw new ContestEventReadCacheUnavailableError('contest cache is disabled');
    }
  }

  private assertEntryUsable(entry: CacheEntry): void {
    this.assertEntryLifecycleUsable(entry);
    if (entry.pendingWatermark) {
      throw new ContestEventReadCacheUnavailableError('pending watermark is not confirmed by MySQL');
    }
  }

  private assertEntryRetryAllowed(entry: CacheEntry, allowPendingWatermark = false): void {
    this.assertEntryLifecycleUsable(entry);
    if (!allowPendingWatermark && entry.pendingWatermark) {
      throw new ContestEventReadCacheUnavailableError('pending watermark is not confirmed by MySQL');
    }
    if (this.now() < entry.retryNotBeforeMono) {
      this.counters.failureCooldownRejects += 1;
      throw new ContestEventReadCacheUnavailableError('contest read is in failure cooldown');
    }
  }

  private assertGenerationActive(entry: CacheEntry, token: object, reason: string): void {
    if (this.stopping || entry.token !== token || entry.tombstoned || this.disabledContestIds.has(entry.contestId)) {
      this.counters.generationDiscards += 1;
      throw new ContestEventReadCacheUnavailableError(this.stopping ? 'cache is draining' : reason);
    }
  }

  private createResetResult(
    uk: string,
    entry: CacheEntry,
    resetReason: string,
    format: ContestEventReadFormat,
  ): ContestEventReadCacheResult {
    const response: ContestEventJsonResponse = Object.freeze({
      uk,
      fromEventId: null,
      toEventId: null,
      checkpointEventId: 0,
      latestEventId: entry.targetLastEventId,
      streamRevision: entry.streamRevision,
      hasMore: false,
      resetRequired: true,
      resetReason,
      events: Object.freeze([]),
    });
    if (format === 'json') {
      return { format, data: response, release: noop };
    }
    return {
      format,
      body: Buffer.from(
        rankland_live_contest_client.GetContestEventsResponse.encode(
          rankland_live_contest_client.GetContestEventsResponse.fromObject({
            uk,
            checkpointEventId: 0,
            latestEventId: entry.targetLastEventId,
            streamRevision: entry.streamRevision,
            hasMore: false,
            resetRequired: true,
            resetReason,
            events: [],
          }),
        ).finish(),
      ),
      release: noop,
    };
  }
}

function optionalNodeMemorySnapshot(): { nodeMemory: Record<string, number> } | Record<string, never> {
  try {
    const memory = process.memoryUsage();
    const heap = getHeapStatistics();
    const spaces = getHeapSpaceStatistics();
    const usedBySpace = new Map(spaces.map((space) => [space.space_name, space.space_used_size]));
    const largeObjectSpaceUsedBytes = spaces
      .filter((space) => space.space_name.includes('large_object_space'))
      .reduce((sum, space) => sum + space.space_used_size, 0);
    return {
      nodeMemory: {
        rssBytes: memory.rss,
        heapTotalBytes: memory.heapTotal,
        heapUsedBytes: memory.heapUsed,
        externalBytes: memory.external,
        arrayBuffersBytes: memory.arrayBuffers,
        v8TotalHeapSizeBytes: heap.total_heap_size,
        v8UsedHeapSizeBytes: heap.used_heap_size,
        v8TotalPhysicalSizeBytes: heap.total_physical_size,
        v8HeapSizeLimitBytes: heap.heap_size_limit,
        v8MallocedMemoryBytes: heap.malloced_memory,
        v8PeakMallocedMemoryBytes: heap.peak_malloced_memory,
        v8NativeContexts: heap.number_of_native_contexts,
        v8DetachedContexts: heap.number_of_detached_contexts,
        newSpaceUsedBytes: usedBySpace.get('new_space') ?? 0,
        oldSpaceUsedBytes: usedBySpace.get('old_space') ?? 0,
        largeObjectSpaceUsedBytes,
      },
    };
  } catch (_error) {
    return {};
  }
}

function normalizeRequest(input: ContestEventReadRequest): Required<ContestEventReadRequest> {
  if (!Number.isInteger(input.streamRevision) || input.streamRevision < 1) {
    throw new RangeError('streamRevision must be a positive integer');
  }
  return {
    uk: input.uk,
    afterEventId: Math.max(0, Math.trunc(input.afterEventId ?? 0)),
    limit: Math.max(1, Math.min(Math.trunc(input.limit ?? 1000), 1000)),
    streamRevision: input.streamRevision,
    compactProgress: input.compactProgress !== false,
  };
}

function emptyCounters(): ContestEventReadCacheCounters {
  return {
    residentContests: 0,
    residentEvents: 0,
    residentBytes: 0,
    retiredPinnedBytes: 0,
    builderReservedBytes: 0,
    totalAccountedBytes: 0,
    highWaterAccountedBytes: 0,
    readyHits: 0,
    coldMisses: 0,
    hydrationStarted: 0,
    hydrationCompleted: 0,
    getHydrationStarted: 0,
    eagerTailFillAttempts: 0,
    eagerTailFillStarted: 0,
    eagerTailFillJoined: 0,
    eagerTailFillCompleted: 0,
    eagerTailFillFailed: 0,
    eagerTailFillSkipped: 0,
    hydrating: 0,
    canonicalizedEvents: 0,
    singleflightJoins: 0,
    generationDiscards: 0,
    targetAdvancesDuringHydration: 0,
    writeThroughDeferred: 0,
    authorityResultsStaleByTargetAdvance: 0,
    hydrationStabilizationFailures: 0,
    watermarkRegressions: 0,
    pendingWatermarkAuthorityRejects: 0,
    lruEvictions: 0,
    ttlEvictions: 0,
    oversizeMarkers: 0,
    bulkheadRejects: 0,
    queueTimeouts: 0,
    comparisons: 0,
    comparisonMismatches: 0,
    comparisonInconclusive: 0,
    projectionRebuilds: 0,
    failureCooldownRejects: 0,
    disabledContests: 0,
  };
}

function positiveInteger(value: number | undefined, fallback: number, name: string): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved < 1) {
    throw new RangeError(`${name} must be a positive integer`);
  }
  return resolved;
}

function normalizeUk(uk: string): string {
  return uk.normalize('NFC').toLocaleLowerCase('en-US');
}

function monotonicNow(): number {
  return Number(process.hrtime.bigint() / 1_000_000n);
}

function noop(): void {}

function contestNotFound(uk: string): LogicException {
  return new LogicException(ErrCode.ContestNotFound, `contest ${uk} not found`);
}

function numericDelta<T extends object>(current: T, previous: T): Record<string, number> {
  const result: Record<string, number> = {};
  for (const key of Object.keys(current) as Array<keyof T>) {
    const currentValue = current[key];
    const previousValue = previous[key];
    if (typeof currentValue === 'number' && typeof previousValue === 'number') {
      result[String(key)] = currentValue - previousValue;
    }
  }
  return result;
}

function cacheCounterDelta(
  current: ContestEventReadCacheCounters,
  previous: ContestEventReadCacheCounters,
): Record<string, number> {
  const result = numericDelta(current, previous);
  for (const gauge of [
    'residentContests',
    'residentEvents',
    'residentBytes',
    'retiredPinnedBytes',
    'builderReservedBytes',
    'totalAccountedBytes',
    'highWaterAccountedBytes',
    'hydrating',
  ] satisfies Array<keyof ContestEventReadCacheCounters>) {
    delete result[gauge];
  }
  return result;
}

function mysqlPoolDelta(
  current: MysqlPoolMetricsSnapshot,
  previous: MysqlPoolMetricsSnapshot,
): Pick<MysqlPoolMetricsSnapshot, 'acquireStarted' | 'acquireSucceeded' | 'acquireFailed'> & {
  acquireFailuresByCode: Record<string, number>;
} {
  const codes = new Set([
    ...Object.keys(current.acquireFailuresByCode),
    ...Object.keys(previous.acquireFailuresByCode),
  ]);
  return {
    acquireStarted: current.acquireStarted - previous.acquireStarted,
    acquireSucceeded: current.acquireSucceeded - previous.acquireSucceeded,
    acquireFailed: current.acquireFailed - previous.acquireFailed,
    acquireFailuresByCode: Object.fromEntries(
      [...codes]
        .sort()
        .map((code) => [code, (current.acquireFailuresByCode[code] ?? 0) - (previous.acquireFailuresByCode[code] ?? 0)])
        .filter(([, value]) => value !== 0),
    ),
  };
}

function databaseReadDelta(
  current: ContestEventReadStoreCounters,
  previous: ContestEventReadStoreCounters,
): Pick<
  ContestEventReadStoreCounters,
  | 'databaseReadUnavailable'
  | 'databaseReadDeadlines'
  | 'databaseReadDeadlineAcquire'
  | 'databaseReadDeadlineTransaction'
  | 'databaseReadDeadlineQuery'
  | 'databaseReadDeadlineRelease'
  | 'databaseReadAcquireRetries'
  | 'databaseReadAcquireRetrySuccesses'
  | 'databaseReadAcquireRetryExhausted'
  | 'streamAuthoritySingleflightJoins'
  | 'attachmentAuthorityBatchCalls'
  | 'attachmentAuthorityBatchRegistrations'
  | 'eagerTailFillWaitCompleted'
  | 'eagerTailFillWaitFailures'
  | 'eagerTailFillWaitTimeouts'
  | 'eagerTailFillNoActiveSkips'
> {
  return {
    databaseReadUnavailable: current.databaseReadUnavailable - previous.databaseReadUnavailable,
    databaseReadDeadlines: current.databaseReadDeadlines - previous.databaseReadDeadlines,
    databaseReadDeadlineAcquire: current.databaseReadDeadlineAcquire - previous.databaseReadDeadlineAcquire,
    databaseReadDeadlineTransaction: current.databaseReadDeadlineTransaction - previous.databaseReadDeadlineTransaction,
    databaseReadDeadlineQuery: current.databaseReadDeadlineQuery - previous.databaseReadDeadlineQuery,
    databaseReadDeadlineRelease: current.databaseReadDeadlineRelease - previous.databaseReadDeadlineRelease,
    databaseReadAcquireRetries: current.databaseReadAcquireRetries - previous.databaseReadAcquireRetries,
    databaseReadAcquireRetrySuccesses:
      current.databaseReadAcquireRetrySuccesses - previous.databaseReadAcquireRetrySuccesses,
    databaseReadAcquireRetryExhausted:
      current.databaseReadAcquireRetryExhausted - previous.databaseReadAcquireRetryExhausted,
    streamAuthoritySingleflightJoins:
      current.streamAuthoritySingleflightJoins - previous.streamAuthoritySingleflightJoins,
    attachmentAuthorityBatchCalls: current.attachmentAuthorityBatchCalls - previous.attachmentAuthorityBatchCalls,
    attachmentAuthorityBatchRegistrations:
      current.attachmentAuthorityBatchRegistrations - previous.attachmentAuthorityBatchRegistrations,
    eagerTailFillWaitCompleted: current.eagerTailFillWaitCompleted - previous.eagerTailFillWaitCompleted,
    eagerTailFillWaitFailures: current.eagerTailFillWaitFailures - previous.eagerTailFillWaitFailures,
    eagerTailFillWaitTimeouts: current.eagerTailFillWaitTimeouts - previous.eagerTailFillWaitTimeouts,
    eagerTailFillNoActiveSkips: current.eagerTailFillNoActiveSkips - previous.eagerTailFillNoActiveSkips,
  };
}

function eventLoopLagSnapshot(histogram: ReturnType<typeof monitorEventLoopDelay>): {
  min: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
} {
  if (histogram.count === 0) {
    return { min: 0, mean: 0, p50: 0, p95: 0, p99: 0, max: 0 };
  }
  const milliseconds = (nanoseconds: number) =>
    Number.isFinite(nanoseconds) && nanoseconds >= 0 ? Number((nanoseconds / 1_000_000).toFixed(3)) : 0;
  return {
    min: milliseconds(histogram.min),
    mean: milliseconds(histogram.mean),
    p50: milliseconds(histogram.percentile(50)),
    p95: milliseconds(histogram.percentile(95)),
    p99: milliseconds(histogram.percentile(99)),
    max: milliseconds(histogram.max),
  };
}
