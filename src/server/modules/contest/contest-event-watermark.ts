export interface ContestEventWatermark {
  latestEventId: number;
  streamRevision: number;
}

export interface ContestCommittedWatermark extends ContestEventWatermark {
  contestId: string;
  canonicalUk: string;
}

export function compareContestEventWatermarks(left: ContestEventWatermark, right: ContestEventWatermark): number {
  if (left.streamRevision !== right.streamRevision) {
    return left.streamRevision - right.streamRevision;
  }
  return left.latestEventId - right.latestEventId;
}

export function latestContestEventWatermark<T extends ContestEventWatermark>(left: T, right: T): T {
  return compareContestEventWatermarks(right, left) > 0 ? right : left;
}

export function isContestEventWatermark(value: unknown): value is ContestEventWatermark {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const watermark = value as Partial<ContestEventWatermark>;
  return (
    Number.isSafeInteger(watermark.streamRevision) &&
    (watermark.streamRevision as number) > 0 &&
    Number.isSafeInteger(watermark.latestEventId) &&
    (watermark.latestEventId as number) >= 0
  );
}
