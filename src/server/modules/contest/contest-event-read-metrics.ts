export interface ContestEventReadStoreCounters {
  eventsReadTransactionStarted: number;
  eventsReadTransactionCommitted: number;
  eventsReadTransactionRolledBack: number;
  legacySnapshotCalls: number;
  legacySnapshotRows: number;
  authorityByUkCalls: number;
  authorityByUkRows: number;
  authorityBatchCalls: number;
  authorityBatchRows: number;
  eventRangeCalls: number;
  eventRangeRows: number;
  fallbackReads: number;
  fallbackRejects: number;
  databaseReadUnavailable: number;
  databaseReadDeadlines: number;
  databaseReadDeadlineAcquire: number;
  databaseReadDeadlineTransaction: number;
  databaseReadDeadlineQuery: number;
  databaseReadDeadlineRelease: number;
  databaseReadAcquireRetries: number;
  databaseReadAcquireRetrySuccesses: number;
  databaseReadAcquireRetryExhausted: number;
  streamAuthoritySingleflightJoins: number;
  attachmentAuthorityBatchCalls: number;
  attachmentAuthorityBatchRegistrations: number;
  eagerTailFillWaitCompleted: number;
  eagerTailFillWaitFailures: number;
  eagerTailFillWaitTimeouts: number;
  eagerTailFillNoActiveSkips: number;
}

class ContestEventReadMetrics {
  private counters: ContestEventReadStoreCounters = emptyStoreCounters();

  public add(name: keyof ContestEventReadStoreCounters, value = 1): void {
    this.counters[name] += value;
  }

  public snapshot(): ContestEventReadStoreCounters {
    return { ...this.counters };
  }
}

export const contestEventReadMetrics = new ContestEventReadMetrics();

function emptyStoreCounters(): ContestEventReadStoreCounters {
  return {
    eventsReadTransactionStarted: 0,
    eventsReadTransactionCommitted: 0,
    eventsReadTransactionRolledBack: 0,
    legacySnapshotCalls: 0,
    legacySnapshotRows: 0,
    authorityByUkCalls: 0,
    authorityByUkRows: 0,
    authorityBatchCalls: 0,
    authorityBatchRows: 0,
    eventRangeCalls: 0,
    eventRangeRows: 0,
    fallbackReads: 0,
    fallbackRejects: 0,
    databaseReadUnavailable: 0,
    databaseReadDeadlines: 0,
    databaseReadDeadlineAcquire: 0,
    databaseReadDeadlineTransaction: 0,
    databaseReadDeadlineQuery: 0,
    databaseReadDeadlineRelease: 0,
    databaseReadAcquireRetries: 0,
    databaseReadAcquireRetrySuccesses: 0,
    databaseReadAcquireRetryExhausted: 0,
    streamAuthoritySingleflightJoins: 0,
    attachmentAuthorityBatchCalls: 0,
    attachmentAuthorityBatchRegistrations: 0,
    eagerTailFillWaitCompleted: 0,
    eagerTailFillWaitFailures: 0,
    eagerTailFillWaitTimeouts: 0,
    eagerTailFillNoActiveSkips: 0,
  };
}
