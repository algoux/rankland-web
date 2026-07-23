import Long from 'long';
import { rankland_live_contest_client, rankland_live_contest_common } from '@common/proto/rankland_live_contest';
import { storedEventToClientEvent } from './contest-event-codec';
import { ContestReadableEvent } from './contest-event-store';

export const DEFAULT_CONTEST_EVENT_CACHE_CHUNK_SIZE = 512;

// Calibrated on Node 20 as conservative logical ownership estimates. Exact
// Buffer/TypedArray/string bytes are added separately; these constants cover
// object headers, references, Map slots, and allocator rounding. Runtime cache
// decisions never inspect heap/RSS.
const EVENT_OBJECT_OVERHEAD_BYTES = 192;
const JSON_VIEW_OVERHEAD_BYTES = 160;
const CHUNK_OBJECT_OVERHEAD_BYTES = 384;
const SOLUTION_INDEX_OVERHEAD_BYTES = 96;
const PENDING_PROGRESS_EVENT_ID_BYTES = 8;
// Type-specific fixed record/index/key/enum ownership produced by protobufjs.
// Dynamic strings and the canonical PB fragment are covered by 2x source PB
// bytes. These schema-calibrated bounds deliberately remain tight enough for
// reservation-time LRU decisions to match the final logical allocation.
const EVENT_CANONICAL_FIXED_UPPER_BOUND_BYTES: Readonly<Record<number, number>> = Object.freeze({
  [rankland_live_contest_common.EventType.NEW_SOLUTION]: 448,
  [rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS]: 448,
  [rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE]: 448,
  [rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE]: 480,
  [rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE]: 428,
});

export interface ClientEventJsonWireView {
  readonly eventId: number;
  readonly type: string;
  readonly [key: string]: unknown;
}

export interface ContestEventJsonResponse {
  readonly uk: string;
  readonly fromEventId: number | null;
  readonly toEventId: number | null;
  readonly checkpointEventId: number;
  readonly latestEventId: number;
  readonly streamRevision: number;
  readonly hasMore: boolean;
  readonly resetRequired: boolean;
  readonly resetReason?: string;
  readonly events: readonly ClientEventJsonWireView[];
}

export interface ContestEventCachePageRequest {
  uk: string;
  afterEventId: number;
  limit: number;
  compactProgress: boolean;
}

export interface BuildContestEventCacheSnapshotInput {
  contestId: string;
  streamRevision: number;
  targetLastEventId: number;
  frozenStartNs?: string | null;
  chunkEventCount?: number;
  events: readonly ContestReadableEvent[];
}

interface CanonicalEventRecord {
  readonly eventId: number;
  readonly type: rankland_live_contest_common.EventType;
  readonly solutionId?: number | null;
  readonly solutionSubmitTimeNs?: string | null;
  readonly jsonWireView: ClientEventJsonWireView;
  readonly pbFragmentOffset: number;
  readonly pbFragmentLength: number;
}

interface MutableCanonicalEventRecord extends Omit<CanonicalEventRecord, 'pbFragmentOffset' | 'pbFragmentLength'> {
  readonly pbFragment: Buffer;
}

interface ContestEventCacheChunk {
  readonly firstEventId: number;
  readonly records: readonly CanonicalEventRecord[];
  readonly canonicalPbFragments: Buffer;
  readonly fragmentOffsets: Uint32Array;
  readonly fragmentLengths: Uint32Array;
  readonly fullVisibleIndices: Uint16Array;
  readonly compactVisibleIndices: Uint16Array;
  readonly estimatedBytes: number;
}

interface SelectedRecord {
  readonly chunk: ContestEventCacheChunk;
  readonly record: CanonicalEventRecord;
}

interface PendingProgressState {
  readonly eventIds: readonly number[];
  readonly lastChunkIndex: number;
  readonly touchedChunkCount: number;
}

export type ContestEventCacheAppendResult =
  | { status: 'appended'; snapshot: ContestEventCacheSnapshot; canonicalizedEventCount: number }
  | { status: 'requires-rebuild'; canonicalizedEventCount: number };

export interface ContestEventCacheMemoryPart {
  readonly identity: object;
  readonly estimatedBytes: number;
}

export class ContestEventCacheBuildError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ContestEventCacheBuildError';
  }
}

export class ContestEventCacheSnapshot {
  public readonly eventCount: number;
  public readonly estimatedBytes: number;
  public readonly pendingSolutionCount: number;

  public constructor(
    public readonly contestId: string,
    public readonly streamRevision: number,
    public readonly lastEventId: number,
    public readonly frozenStartNs: string | null,
    public readonly chunkEventCount: number,
    private readonly chunks: readonly ContestEventCacheChunk[],
    private readonly pendingProgressBySolution: ReadonlyMap<number, PendingProgressState>,
    estimatedBytes: number,
  ) {
    this.eventCount = lastEventId;
    this.pendingSolutionCount = pendingProgressBySolution.size;
    this.estimatedBytes = estimatedBytes;
  }

  public getJsonResponse(request: ContestEventCachePageRequest): ContestEventJsonResponse {
    const page = this.selectPage(request);
    const events = Object.freeze(page.selected.map(({ record }) => record.jsonWireView));
    return Object.freeze({
      ...page.envelope,
      events,
    });
  }

  public getProtobufResponse(request: ContestEventCachePageRequest): Buffer {
    const page = this.selectPage(request);
    const envelopeBytes = Buffer.from(
      rankland_live_contest_client.GetContestEventsResponse.encode(
        rankland_live_contest_client.GetContestEventsResponse.fromObject({
          ...page.envelope,
          ...(page.envelope.fromEventId === null ? {} : { fromEventId: page.envelope.fromEventId }),
          ...(page.envelope.toEventId === null ? {} : { toEventId: page.envelope.toEventId }),
          events: [],
        } as any),
      ).finish(),
    );
    const fragments = page.selected.map(({ chunk, record }) =>
      chunk.canonicalPbFragments.subarray(record.pbFragmentOffset, record.pbFragmentOffset + record.pbFragmentLength),
    );
    return Buffer.concat([envelopeBytes, ...fragments]);
  }

  /**
   * Returns the immutable allocations owned by this snapshot. Appended
   * generations structurally share most of these objects, so callers that
   * retain more than one generation must account by identity rather than by
   * summing `estimatedBytes` for every snapshot.
   */
  public memoryParts(): readonly ContestEventCacheMemoryPart[] {
    const parts: ContestEventCacheMemoryPart[] = [
      {
        identity: this,
        estimatedBytes: this.snapshotMetadataBytes(),
      },
    ];
    for (const chunk of this.chunks) {
      const indexedBytes =
        chunk.canonicalPbFragments.byteLength +
        chunk.fragmentOffsets.byteLength +
        chunk.fragmentLengths.byteLength +
        chunk.fullVisibleIndices.byteLength +
        chunk.compactVisibleIndices.byteLength;
      parts.push(
        { identity: chunk, estimatedBytes: CHUNK_OBJECT_OVERHEAD_BYTES },
        {
          identity: chunk.records,
          estimatedBytes: chunk.estimatedBytes - indexedBytes - CHUNK_OBJECT_OVERHEAD_BYTES,
        },
        { identity: chunk.canonicalPbFragments, estimatedBytes: chunk.canonicalPbFragments.byteLength },
        { identity: chunk.fragmentOffsets, estimatedBytes: chunk.fragmentOffsets.byteLength },
        { identity: chunk.fragmentLengths, estimatedBytes: chunk.fragmentLengths.byteLength },
        { identity: chunk.fullVisibleIndices, estimatedBytes: chunk.fullVisibleIndices.byteLength },
        { identity: chunk.compactVisibleIndices, estimatedBytes: chunk.compactVisibleIndices.byteLength },
      );
    }
    return parts;
  }

  /** Minimum unique allocation needed by a non-empty append generation. */
  public appendAllocationLowerBoundBytes(): number {
    const partialTail = this.lastEventId % this.chunkEventCount === 0 ? undefined : this.chunks[this.chunks.length - 1];
    return this.snapshotMetadataBytes() + (partialTail?.estimatedBytes ?? 0);
  }

  /**
   * Conservative unique-allocation bound for materializing an appended
   * generation. The cache reserves this amount before `appendCommitted` so a
   * pinned partial tail or compact-projection rewrite cannot allocate outside
   * the configured contest/global budgets.
   */
  public appendAllocationUpperBoundBytes(events: readonly ContestReadableEvent[]): number {
    if (events.length === 0) {
      return 0;
    }
    const hasPartialTail = this.lastEventId > 0 && this.lastEventId % this.chunkEventCount !== 0;
    const rebuildChunkIndex = hasPartialTail ? this.chunks.length - 1 : this.chunks.length;
    const partialTailSlots = hasPartialTail ? this.lastEventId % this.chunkEventCount : 0;
    const appendedChunkShells = hasPartialTail
      ? Math.max(0, Math.ceil((partialTailSlots + events.length) / this.chunkEventCount) - 1)
      : Math.ceil(events.length / this.chunkEventCount);
    let bytes =
      this.snapshotMetadataBytes() +
      estimateCanonicalEventsAllocationUpperBoundBytes(events) +
      appendedChunkShells * CHUNK_OBJECT_OVERHEAD_BYTES +
      countProgressEvents(events) * (SOLUTION_INDEX_OVERHEAD_BYTES + PENDING_PROGRESS_EVENT_ID_BYTES);
    if (hasPartialTail) {
      bytes += this.chunks[rebuildChunkIndex].estimatedBytes;
    }

    const rewrittenProjectionChunks = new Set<number>();
    for (const event of events) {
      if (!isSettlingEvent(event.type) || event.solutionId === undefined || event.solutionId === null) {
        continue;
      }
      const pending = this.pendingProgressBySolution.get(event.solutionId);
      if (!pending) {
        continue;
      }
      for (const eventId of pending.eventIds) {
        const chunkIndex = Math.floor((eventId - 1) / this.chunkEventCount);
        if (chunkIndex < rebuildChunkIndex) {
          rewrittenProjectionChunks.add(chunkIndex);
        }
      }
    }
    for (const chunkIndex of rewrittenProjectionChunks) {
      const chunk = this.chunks[chunkIndex];
      // filterChunkCompactProjection shares all other immutable parts. A new
      // chunk shell and an index no larger than the old compact index are the
      // only additional allocations.
      bytes += CHUNK_OBJECT_OVERHEAD_BYTES + chunk.compactVisibleIndices.byteLength;
    }
    return bytes;
  }

  public appendCommitted(
    events: readonly ContestReadableEvent[],
    maxSynchronousProjectionChunks: number,
  ): ContestEventCacheAppendResult {
    if (events.length === 0) {
      return { status: 'appended', snapshot: this, canonicalizedEventCount: 0 };
    }
    const mutableRecords: MutableCanonicalEventRecord[] = [];
    const fullVisible: boolean[] = [];
    const compactVisible: boolean[] = [];
    const pending = clonePendingProgress(this.pendingProgressBySolution);
    const removedCompactEventIds = new Set<number>();
    const touchedProjectionChunks = new Set<number>();

    for (let index = 0; index < events.length; index += 1) {
      const stored = events[index];
      const expectedEventId = this.lastEventId + index + 1;
      if (stored.eventId !== expectedEventId) {
        throw new ContestEventCacheBuildError(
          `append gap: expected event ${expectedEventId} but received ${stored.eventId}`,
        );
      }
      if (stored.contestId !== this.contestId || stored.streamRevision !== this.streamRevision) {
        throw new ContestEventCacheBuildError(`event ${stored.eventId} belongs to a different generation`);
      }
      const record = canonicalizeStoredEvent(stored);
      const visible = isVisibleForFreeze(stored, this.frozenStartNs);
      mutableRecords.push(record);
      fullVisible.push(visible);
      compactVisible.push(visible);

      if (!visible || stored.solutionId === undefined || stored.solutionId === null) {
        continue;
      }
      if (stored.type === rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS) {
        const chunkIndex = Math.floor((stored.eventId - 1) / this.chunkEventCount);
        const previous = pending.get(stored.solutionId);
        pending.set(stored.solutionId, appendPendingProgress(previous, stored.eventId, chunkIndex));
        continue;
      }
      if (!isSettlingEvent(stored.type)) {
        continue;
      }
      const previous = pending.get(stored.solutionId);
      if (!previous) {
        continue;
      }
      if (previous.touchedChunkCount > maxSynchronousProjectionChunks) {
        return { status: 'requires-rebuild', canonicalizedEventCount: mutableRecords.length };
      }
      for (const eventId of previous.eventIds) {
        touchedProjectionChunks.add(Math.floor((eventId - 1) / this.chunkEventCount));
        if (touchedProjectionChunks.size > maxSynchronousProjectionChunks) {
          return { status: 'requires-rebuild', canonicalizedEventCount: mutableRecords.length };
        }
        removedCompactEventIds.add(eventId);
        const appendedIndex = eventId - this.lastEventId - 1;
        if (appendedIndex >= 0 && appendedIndex < compactVisible.length) {
          compactVisible[appendedIndex] = false;
        }
      }
      pending.delete(stored.solutionId);
    }

    const newChunks = this.rebuildAppendedChunks(mutableRecords, fullVisible, compactVisible, removedCompactEventIds);
    const estimatedBytes = estimateSnapshotBytes(this.contestId, newChunks, pending);
    return {
      status: 'appended',
      snapshot: new ContestEventCacheSnapshot(
        this.contestId,
        this.streamRevision,
        this.lastEventId + events.length,
        this.frozenStartNs,
        this.chunkEventCount,
        Object.freeze(newChunks),
        pending,
        estimatedBytes,
      ),
      canonicalizedEventCount: mutableRecords.length,
    };
  }

  private selectPage(request: ContestEventCachePageRequest): {
    envelope: Omit<ContestEventJsonResponse, 'events'>;
    selected: SelectedRecord[];
  } {
    const afterEventId = Math.max(0, Math.trunc(request.afterEventId));
    const limit = Math.max(1, Math.min(Math.trunc(request.limit), 1000));
    const checkpointEventId = Math.min(afterEventId + limit, this.lastEventId);
    const selected =
      checkpointEventId > afterEventId
        ? this.selectVisibleRecords(afterEventId + 1, checkpointEventId, request.compactProgress)
        : [];
    const fromEventId = selected.length > 0 ? selected[0].record.eventId : null;
    const toEventId = selected.length > 0 ? selected[selected.length - 1].record.eventId : null;
    return {
      envelope: {
        uk: request.uk,
        fromEventId,
        toEventId,
        checkpointEventId,
        latestEventId: this.lastEventId,
        streamRevision: this.streamRevision,
        hasMore: checkpointEventId < this.lastEventId,
        resetRequired: false,
      },
      selected,
    };
  }

  private snapshotMetadataBytes(): number {
    return Buffer.byteLength(this.contestId, 'utf8') + estimatePendingProgressBytes(this.pendingProgressBySolution);
  }

  private selectVisibleRecords(rawStart: number, rawEnd: number, compactProgress: boolean): SelectedRecord[] {
    const selected: SelectedRecord[] = [];
    const firstChunkIndex = Math.floor((rawStart - 1) / this.chunkEventCount);
    const lastChunkIndex = Math.floor((rawEnd - 1) / this.chunkEventCount);
    for (let chunkIndex = firstChunkIndex; chunkIndex <= lastChunkIndex; chunkIndex += 1) {
      const chunk = this.chunks[chunkIndex];
      if (!chunk) {
        throw new ContestEventCacheBuildError(`missing materialized chunk ${chunkIndex}`);
      }
      const visibleIndices = compactProgress ? chunk.compactVisibleIndices : chunk.fullVisibleIndices;
      const localStart = Math.max(0, rawStart - chunk.firstEventId);
      const localEnd = Math.min(chunk.records.length - 1, rawEnd - chunk.firstEventId);
      let index = lowerBound(visibleIndices, localStart);
      while (index < visibleIndices.length && visibleIndices[index] <= localEnd) {
        const record = chunk.records[visibleIndices[index]];
        selected.push({ chunk, record });
        index += 1;
      }
    }
    return selected;
  }

  private rebuildAppendedChunks(
    newRecords: readonly MutableCanonicalEventRecord[],
    newFullVisible: readonly boolean[],
    newCompactVisible: readonly boolean[],
    removedCompactEventIds: ReadonlySet<number>,
  ): ContestEventCacheChunk[] {
    const hasPartialTail = this.lastEventId > 0 && this.lastEventId % this.chunkEventCount !== 0;
    const rebuildChunkIndex = hasPartialTail ? this.chunks.length - 1 : this.chunks.length;
    const result: ContestEventCacheChunk[] = [];
    for (let index = 0; index < rebuildChunkIndex; index += 1) {
      const chunk = this.chunks[index];
      result.push(
        removedCompactEventIds.size > 0 ? filterChunkCompactProjection(chunk, removedCompactEventIds) : chunk,
      );
    }

    const records: MutableCanonicalEventRecord[] = [];
    const fullVisible: boolean[] = [];
    const compactVisible: boolean[] = [];
    if (hasPartialTail) {
      const tail = this.chunks[rebuildChunkIndex];
      const fullSlots = new Set(tail.fullVisibleIndices);
      const compactSlots = new Set(tail.compactVisibleIndices);
      for (let slot = 0; slot < tail.records.length; slot += 1) {
        const record = tail.records[slot];
        records.push(canonicalRecordToMutable(tail, record));
        fullVisible.push(fullSlots.has(slot));
        compactVisible.push(compactSlots.has(slot) && !removedCompactEventIds.has(record.eventId));
      }
    }
    records.push(...newRecords);
    fullVisible.push(...newFullVisible);
    compactVisible.push(...newCompactVisible);

    const firstEventId = rebuildChunkIndex * this.chunkEventCount + 1;
    for (let start = 0; start < records.length; start += this.chunkEventCount) {
      result.push(
        buildChunk(
          records,
          fullVisible,
          compactVisible,
          start,
          Math.min(start + this.chunkEventCount, records.length),
          firstEventId,
        ),
      );
    }
    return result;
  }
}

export function buildContestEventCacheSnapshot(input: BuildContestEventCacheSnapshotInput): ContestEventCacheSnapshot {
  validateBuildInput(input);
  const fullVisible: boolean[] = [];
  const compactVisible: boolean[] = [];
  const pendingProgressBySolution = new Map<number, PendingProgressState>();
  const mutableRecords: MutableCanonicalEventRecord[] = [];

  for (let index = 0; index < input.events.length; index += 1) {
    const stored = input.events[index];
    const expectedEventId = index + 1;
    if (stored.eventId !== expectedEventId) {
      throw new ContestEventCacheBuildError(
        `event prefix gap: expected event ${expectedEventId} but received ${stored.eventId}`,
      );
    }
    if (stored.contestId !== input.contestId || stored.streamRevision !== input.streamRevision) {
      throw new ContestEventCacheBuildError(`event ${stored.eventId} belongs to a different generation`);
    }

    const record = canonicalizeStoredEvent(stored);
    const visible = isVisibleForFreeze(stored, input.frozenStartNs);
    mutableRecords.push(record);
    fullVisible.push(visible);
    compactVisible.push(visible);

    if (!visible || stored.solutionId === undefined || stored.solutionId === null) {
      continue;
    }
    if (stored.type === rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS) {
      const chunkIndex = Math.floor(index / (input.chunkEventCount ?? DEFAULT_CONTEST_EVENT_CACHE_CHUNK_SIZE));
      pendingProgressBySolution.set(
        stored.solutionId,
        appendPendingProgress(pendingProgressBySolution.get(stored.solutionId), stored.eventId, chunkIndex),
      );
      continue;
    }
    if (isSettlingEvent(stored.type)) {
      const pending = pendingProgressBySolution.get(stored.solutionId);
      if (pending) {
        for (const progressEventId of pending.eventIds) {
          compactVisible[progressEventId - 1] = false;
        }
        pendingProgressBySolution.delete(stored.solutionId);
      }
    }
  }

  const chunks: ContestEventCacheChunk[] = [];
  let totalBytes = Buffer.byteLength(input.contestId, 'utf8');
  for (
    let start = 0;
    start < mutableRecords.length;
    start += input.chunkEventCount ?? DEFAULT_CONTEST_EVENT_CACHE_CHUNK_SIZE
  ) {
    const end = Math.min(
      start + (input.chunkEventCount ?? DEFAULT_CONTEST_EVENT_CACHE_CHUNK_SIZE),
      mutableRecords.length,
    );
    const chunk = buildChunk(mutableRecords, fullVisible, compactVisible, start, end, 1);
    chunks.push(chunk);
    totalBytes += chunk.estimatedBytes;
  }
  totalBytes += estimatePendingProgressBytes(pendingProgressBySolution);

  return new ContestEventCacheSnapshot(
    input.contestId,
    input.streamRevision,
    input.targetLastEventId,
    input.frozenStartNs ?? null,
    input.chunkEventCount ?? DEFAULT_CONTEST_EVENT_CACHE_CHUNK_SIZE,
    Object.freeze(chunks),
    pendingProgressBySolution,
    totalBytes,
  );
}

function buildChunk(
  source: readonly MutableCanonicalEventRecord[],
  fullVisible: readonly boolean[],
  compactVisible: readonly boolean[],
  start: number,
  end: number,
  firstEventId: number,
): ContestEventCacheChunk {
  const sourceRecords = source.slice(start, end);
  const fragmentOffsets = new Uint32Array(sourceRecords.length);
  const fragmentLengths = new Uint32Array(sourceRecords.length);
  const fragments: Buffer[] = [];
  const records: CanonicalEventRecord[] = [];
  let fragmentOffset = 0;
  let ownedStringBytes = 0;
  for (let index = 0; index < sourceRecords.length; index += 1) {
    const sourceRecord = sourceRecords[index];
    fragmentOffsets[index] = fragmentOffset;
    fragmentLengths[index] = sourceRecord.pbFragment.length;
    fragments.push(sourceRecord.pbFragment);
    records.push(
      Object.freeze({
        eventId: sourceRecord.eventId,
        type: sourceRecord.type,
        solutionId: sourceRecord.solutionId,
        solutionSubmitTimeNs: sourceRecord.solutionSubmitTimeNs,
        jsonWireView: sourceRecord.jsonWireView,
        pbFragmentOffset: fragmentOffset,
        pbFragmentLength: sourceRecord.pbFragment.length,
      }),
    );
    fragmentOffset += sourceRecord.pbFragment.length;
    ownedStringBytes += estimateOwnedStringBytes(sourceRecord.jsonWireView);
    if (sourceRecord.solutionSubmitTimeNs) {
      ownedStringBytes += Buffer.byteLength(sourceRecord.solutionSubmitTimeNs, 'utf8');
    }
  }
  const canonicalPbFragments = Buffer.concat(fragments);
  const fullVisibleIndices = createVisibleIndices(fullVisible, start, end);
  const compactVisibleIndices = createVisibleIndices(compactVisible, start, end);
  const estimatedBytes =
    canonicalPbFragments.byteLength +
    fragmentOffsets.byteLength +
    fragmentLengths.byteLength +
    fullVisibleIndices.byteLength +
    compactVisibleIndices.byteLength +
    ownedStringBytes +
    records.length * (EVENT_OBJECT_OVERHEAD_BYTES + JSON_VIEW_OVERHEAD_BYTES) +
    CHUNK_OBJECT_OVERHEAD_BYTES;
  return Object.freeze({
    firstEventId: firstEventId + start,
    records: Object.freeze(records),
    canonicalPbFragments,
    fragmentOffsets,
    fragmentLengths,
    fullVisibleIndices,
    compactVisibleIndices,
    estimatedBytes,
  });
}

function canonicalizeStoredEvent(stored: ContestReadableEvent): MutableCanonicalEventRecord {
  const clientEvent = storedEventToClientEvent(stored);
  if (clientEvent.eventId !== stored.eventId || clientEvent.type !== stored.type) {
    throw new ContestEventCacheBuildError(`stored payload metadata does not match event ${stored.eventId}`);
  }
  const payloadSolutionId = getPayloadSolutionId(clientEvent);
  const storedSolutionId = stored.solutionId ?? null;
  if (
    (payloadSolutionId ?? null) !== storedSolutionId ||
    (stored.type !== rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE && payloadSolutionId === undefined)
  ) {
    throw new ContestEventCacheBuildError(`stored solution metadata does not match event ${stored.eventId}`);
  }
  const message = rankland_live_contest_client.ClientEvent.fromObject(clientEvent as any);
  const messageBytes = Buffer.from(rankland_live_contest_client.ClientEvent.encode(message).finish());
  const jsonWireView = deepFreeze(
    rankland_live_contest_client.ClientEvent.toObject(message, {
      longs: String,
      enums: String,
      arrays: true,
    }) as ClientEventJsonWireView,
  );
  return {
    eventId: stored.eventId,
    type: stored.type,
    solutionId: stored.solutionId,
    solutionSubmitTimeNs: stored.solutionSubmitTimeNs,
    jsonWireView,
    pbFragment: Buffer.concat([Buffer.from([0x52]), encodeVarint32(messageBytes.byteLength), messageBytes]),
  };
}

function getPayloadSolutionId(event: ReturnType<typeof storedEventToClientEvent>): number | undefined {
  switch (event.type) {
    case rankland_live_contest_common.EventType.NEW_SOLUTION:
      return event.newSolutionData?.solutionId;
    case rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS:
      return event.solutionOnProgressData?.solutionId;
    case rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE:
      return event.solutionOnResultSettleData?.solutionId;
    case rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE:
      return event.solutionOnResultChangeData?.solutionId;
    case rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE:
      if (!event.contestConfigChangeData) {
        throw new ContestEventCacheBuildError(`event ${event.eventId} is missing config-change payload`);
      }
      return undefined;
  }
}

function appendPendingProgress(
  previous: PendingProgressState | undefined,
  eventId: number,
  chunkIndex: number,
): PendingProgressState {
  if (!previous) {
    return {
      eventIds: Object.freeze([eventId]),
      lastChunkIndex: chunkIndex,
      touchedChunkCount: 1,
    };
  }
  return {
    eventIds: Object.freeze([...previous.eventIds, eventId]),
    lastChunkIndex: chunkIndex,
    touchedChunkCount: previous.touchedChunkCount + (previous.lastChunkIndex === chunkIndex ? 0 : 1),
  };
}

function clonePendingProgress(source: ReadonlyMap<number, PendingProgressState>): Map<number, PendingProgressState> {
  const clone = new Map<number, PendingProgressState>();
  for (const [solutionId, state] of source) {
    clone.set(solutionId, {
      eventIds: Object.freeze([...state.eventIds]),
      lastChunkIndex: state.lastChunkIndex,
      touchedChunkCount: state.touchedChunkCount,
    });
  }
  return clone;
}

function canonicalRecordToMutable(
  chunk: ContestEventCacheChunk,
  record: CanonicalEventRecord,
): MutableCanonicalEventRecord {
  return {
    eventId: record.eventId,
    type: record.type,
    solutionId: record.solutionId,
    solutionSubmitTimeNs: record.solutionSubmitTimeNs,
    jsonWireView: record.jsonWireView,
    pbFragment: chunk.canonicalPbFragments.subarray(
      record.pbFragmentOffset,
      record.pbFragmentOffset + record.pbFragmentLength,
    ),
  };
}

function filterChunkCompactProjection(
  chunk: ContestEventCacheChunk,
  removedEventIds: ReadonlySet<number>,
): ContestEventCacheChunk {
  const visibleIndices = Array.from(chunk.compactVisibleIndices).filter(
    (slot) => !removedEventIds.has(chunk.records[slot].eventId),
  );
  if (visibleIndices.length === chunk.compactVisibleIndices.length) {
    return chunk;
  }
  const compactVisibleIndices = Uint16Array.from(visibleIndices);
  return Object.freeze({
    ...chunk,
    compactVisibleIndices,
    estimatedBytes: chunk.estimatedBytes - chunk.compactVisibleIndices.byteLength + compactVisibleIndices.byteLength,
  });
}

function estimateSnapshotBytes(
  contestId: string,
  chunks: readonly ContestEventCacheChunk[],
  pendingProgressBySolution: ReadonlyMap<number, PendingProgressState>,
): number {
  return (
    Buffer.byteLength(contestId, 'utf8') +
    chunks.reduce((total, chunk) => total + chunk.estimatedBytes, 0) +
    estimatePendingProgressBytes(pendingProgressBySolution)
  );
}

function estimatePendingProgressBytes(pendingProgressBySolution: ReadonlyMap<number, PendingProgressState>): number {
  let bytes = pendingProgressBySolution.size * SOLUTION_INDEX_OVERHEAD_BYTES;
  for (const state of pendingProgressBySolution.values()) {
    bytes += state.eventIds.length * PENDING_PROGRESS_EVENT_ID_BYTES;
  }
  return bytes;
}

function createVisibleIndices(visible: readonly boolean[], start: number, end: number): Uint16Array {
  const indices: number[] = [];
  for (let index = start; index < end; index += 1) {
    if (visible[index]) {
      indices.push(index - start);
    }
  }
  return Uint16Array.from(indices);
}

function validateBuildInput(input: BuildContestEventCacheSnapshotInput): void {
  if (!input.contestId) {
    throw new ContestEventCacheBuildError('contestId is required');
  }
  if (!Number.isInteger(input.streamRevision) || input.streamRevision < 1) {
    throw new ContestEventCacheBuildError('streamRevision must be a positive integer');
  }
  if (!Number.isInteger(input.targetLastEventId) || input.targetLastEventId < 0) {
    throw new ContestEventCacheBuildError('targetLastEventId must be a non-negative integer');
  }
  if (input.events.length !== input.targetLastEventId) {
    throw new ContestEventCacheBuildError(
      `event prefix length ${input.events.length} does not match target ${input.targetLastEventId}`,
    );
  }
  const chunkSize = input.chunkEventCount ?? DEFAULT_CONTEST_EVENT_CACHE_CHUNK_SIZE;
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 65_535) {
    throw new ContestEventCacheBuildError('chunkEventCount must be an integer between 1 and 65535');
  }
}

function isVisibleForFreeze(event: ContestReadableEvent, frozenStartNs?: string | null): boolean {
  if (!frozenStartNs || event.type === rankland_live_contest_common.EventType.NEW_SOLUTION) {
    return true;
  }
  if (!isSolutionLifecycleEvent(event.type) || !event.solutionSubmitTimeNs) {
    return true;
  }
  return Long.fromString(event.solutionSubmitTimeNs).lt(Long.fromString(frozenStartNs));
}

function isSolutionLifecycleEvent(type: rankland_live_contest_common.EventType): boolean {
  return (
    type === rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS ||
    type === rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE ||
    type === rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE
  );
}

function isSettlingEvent(type: rankland_live_contest_common.EventType): boolean {
  return (
    type === rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE ||
    type === rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE
  );
}

function encodeVarint32(value: number): Buffer {
  const bytes: number[] = [];
  let remaining = value >>> 0;
  while (remaining >= 0x80) {
    bytes.push((remaining & 0x7f) | 0x80);
    remaining >>>= 7;
  }
  bytes.push(remaining);
  return Buffer.from(bytes);
}

function lowerBound(values: Uint16Array, target: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    if (values[middle] < target) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low;
}

function estimateOwnedStringBytes(value: unknown): number {
  if (typeof value === 'string') {
    return Buffer.byteLength(value, 'utf8');
  }
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + estimateOwnedStringBytes(item), 0);
  }
  if (value && typeof value === 'object') {
    let total = 0;
    for (const [key, item] of Object.entries(value)) {
      total += Buffer.byteLength(key, 'utf8') + estimateOwnedStringBytes(item);
    }
    return total;
  }
  return 0;
}

/** Logical ownership estimate for source rows retained during a build. */
export function estimateContestReadableEventsBufferedBytes(events: readonly ContestReadableEvent[]): number {
  return estimateContestReadableEventBufferTotals(
    events.length,
    events.reduce((total, event) => total + event.payloadBytes.byteLength, 0),
    events.reduce((total, event) => total + Buffer.byteLength(event.solutionSubmitTimeNs ?? '', 'utf8'), 0),
  );
}

/** Converts a range preflight result into the same logical row-buffer bound. */
export function estimateContestReadableEventBufferTotals(
  rowCount: number,
  payloadBytes: number,
  solutionSubmitTimeBytes: number,
): number {
  return payloadBytes * 2 + solutionSubmitTimeBytes + rowCount * 512;
}

/** Conservative pre-materialization bound for a complete snapshot build. */
export function estimateContestEventSnapshotBuildUpperBoundBytes(
  contestId: string,
  events: readonly ContestReadableEvent[],
  chunkEventCount: number,
): number {
  return (
    Buffer.byteLength(contestId, 'utf8') +
    estimateCanonicalEventsAllocationUpperBoundBytes(events) +
    Math.ceil(events.length / chunkEventCount) * CHUNK_OBJECT_OVERHEAD_BYTES +
    countProgressEvents(events) * (SOLUTION_INDEX_OVERHEAD_BYTES + PENDING_PROGRESS_EVENT_ID_BYTES)
  );
}

function estimateCanonicalEventsAllocationUpperBoundBytes(events: readonly ContestReadableEvent[]): number {
  return events.reduce(
    (total, event) =>
      total +
      event.payloadBytes.byteLength * 2 +
      Buffer.byteLength(event.solutionSubmitTimeNs ?? '', 'utf8') +
      (EVENT_CANONICAL_FIXED_UPPER_BOUND_BYTES[event.type] ?? 480),
    0,
  );
}

function countProgressEvents(events: readonly ContestReadableEvent[]): number {
  return events.reduce(
    (total, event) => total + Number(event.type === rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS),
    0,
  );
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }
  return Object.freeze(value);
}
