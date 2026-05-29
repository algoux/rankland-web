export class ContestEventError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
    public readonly metadata: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ContestEventError';
  }
}

export const ContestEventErrorCode = {
  InvalidEventBatch: 'INVALID_EVENT_BATCH',
  ProducerLocked: 'PRODUCER_LOCKED',
  EventIdGap: 'EVENT_ID_GAP',
  EventIdConflict: 'EVENT_ID_CONFLICT',
  ContestNotFound: 'CONTEST_NOT_FOUND',
  StreamRevisionMismatch: 'STREAM_REVISION_MISMATCH',
} as const;

export function contestEventErrorStatus(code: string): number {
  switch (code) {
    case ContestEventErrorCode.InvalidEventBatch:
      return 422;
    case ContestEventErrorCode.ProducerLocked:
      return 409;
    case ContestEventErrorCode.EventIdGap:
      return 409;
    case ContestEventErrorCode.EventIdConflict:
      return 409;
    case ContestEventErrorCode.ContestNotFound:
      return 404;
    case ContestEventErrorCode.StreamRevisionMismatch:
      return 409;
    default:
      return 400;
  }
}
