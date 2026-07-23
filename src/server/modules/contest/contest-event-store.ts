import { rankland_live_contest_common } from '@common/proto/rankland_live_contest';

export interface ContestStreamState {
  contestId: string;
  uk: string;
  lastEventId: number;
  streamRevision: number;
  producerId?: string | null;
}

export interface ContestStoredEvent {
  contestId: string;
  eventId: number;
  streamRevision: number;
  type: rankland_live_contest_common.EventType;
  producerId: string;
  solutionId?: number | null;
  userId?: string | null;
  problemAlias?: string | null;
  percentageProgress?: number | null;
  previousResult?: number | null;
  result?: number | null;
  timeNs?: string | null;
  solutionSubmitTimeNs?: string | null;
  payloadHash: string;
  payloadBytes: Buffer;
}

export type ContestReadableEvent = Pick<
  ContestStoredEvent,
  'contestId' | 'eventId' | 'streamRevision' | 'type' | 'solutionId' | 'solutionSubmitTimeNs' | 'payloadBytes'
>;

export interface ContestEventInsertInput extends Omit<ContestStoredEvent, 'contestId' | 'streamRevision'> {}

export interface ContestEventsSnapshot {
  stream: ContestStreamState;
  events: ContestReadableEvent[];
  settledEventIdsBySolutionId: Map<number, number>;
  frozenStartNs?: string | null;
}

export interface ContestEventsSnapshotReadRequest {
  uk: string;
  afterEventId: number;
  limit: number;
  requestStreamRevision: number;
  compactProgress: boolean;
  /** Internal comparison fence used to reconstruct an append-only stream prefix. */
  throughEventId?: number;
}

export interface ContestEventAuthorityState {
  contestId: string;
  canonicalUk: string;
  streamRevision: number;
  lastEventId: number;
  frozenStartNs?: string | null;
  visibilityFingerprint: string;
}

export interface ContestEventRangeRead {
  contestId: string;
  streamRevision: number;
  afterEventId: number;
  throughEventId: number;
  limit: number;
}

/** Exact lightweight metadata for the rows selected by one range page. */
export interface ContestEventRangeMemoryEstimate {
  rowCount: number;
  payloadBytes: number;
  solutionSubmitTimeBytes: number;
}

export interface ContestEventTransaction {
  stream: ContestStreamState;
  findEvents: (eventIds: number[]) => Promise<ContestStoredEvent[]>;
  findNewSolutionSubmitTimes: (solutionIds: number[]) => Promise<Map<number, string>>;
  insertEvents: (inputs: ContestEventInsertInput[]) => Promise<void>;
  setProducerLock: (producerId: string) => Promise<void>;
  advanceLastEventId: (lastEventId: number) => Promise<void>;
}

export interface ContestEventStore {
  runInStreamTransaction: <T>(uk: string, runner: (transaction: ContestEventTransaction) => Promise<T>) => Promise<T>;
  releaseProducerLock: (uk: string) => Promise<ContestStreamState>;
  getStreamState: (uk: string) => Promise<ContestStreamState>;
  getStreamStates: (contestIds: readonly string[]) => Promise<ContestStreamState[]>;
  readEventsSnapshot: (request: ContestEventsSnapshotReadRequest) => Promise<ContestEventsSnapshot>;
  readAuthorityByUk: (uk: string) => Promise<ContestEventAuthorityState>;
  readAuthorityByContestIds: (contestIds: readonly string[]) => Promise<ContestEventAuthorityState[]>;
  estimateEventRangeMemory: (request: ContestEventRangeRead) => Promise<ContestEventRangeMemoryEstimate>;
  readEventRange: (request: ContestEventRangeRead) => Promise<ContestReadableEvent[]>;
}
