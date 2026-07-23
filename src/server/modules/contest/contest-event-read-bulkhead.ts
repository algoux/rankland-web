export type ContestEventReadBulkheadRejectReason = 'queue-full' | 'queue-timeout' | 'disposed';

export class ContestEventReadBulkheadError extends Error {
  public constructor(public readonly reason: ContestEventReadBulkheadRejectReason) {
    super(`contest event read bulkhead rejected work: ${reason}`);
    this.name = 'ContestEventReadBulkheadError';
  }
}

interface QueuedWork<T> {
  readonly task: () => Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (error: unknown) => void;
  timer?: NodeJS.Timeout;
}

export default class ContestEventReadBulkhead {
  private active = 0;
  private readonly queue: Array<QueuedWork<unknown>> = [];
  private disposed = false;

  public constructor(
    private readonly concurrency: number,
    private readonly maxQueueSize: number,
    private readonly queueTimeoutMs: number,
  ) {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new RangeError('bulkhead concurrency must be a positive integer');
    }
    if (!Number.isInteger(maxQueueSize) || maxQueueSize < 0) {
      throw new RangeError('bulkhead maxQueueSize must be a non-negative integer');
    }
    if (!Number.isInteger(queueTimeoutMs) || queueTimeoutMs < 1) {
      throw new RangeError('bulkhead queueTimeoutMs must be a positive integer');
    }
  }

  public run<T>(task: () => Promise<T>): Promise<T> {
    if (this.disposed) {
      return Promise.reject(new ContestEventReadBulkheadError('disposed'));
    }
    if (this.active < this.concurrency) {
      return this.start(task);
    }
    if (this.queue.length >= this.maxQueueSize) {
      return Promise.reject(new ContestEventReadBulkheadError('queue-full'));
    }
    return new Promise<T>((resolve, reject) => {
      const work: QueuedWork<T> = { task, resolve, reject };
      work.timer = setTimeout(() => {
        const index = this.queue.indexOf(work as QueuedWork<unknown>);
        if (index < 0) {
          return;
        }
        this.queue.splice(index, 1);
        reject(new ContestEventReadBulkheadError('queue-timeout'));
      }, this.queueTimeoutMs);
      work.timer.unref?.();
      this.queue.push(work as QueuedWork<unknown>);
    });
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    for (const work of this.queue.splice(0)) {
      if (work.timer) {
        clearTimeout(work.timer);
      }
      work.reject(new ContestEventReadBulkheadError('disposed'));
    }
  }

  private start<T>(task: () => Promise<T>): Promise<T> {
    this.active += 1;
    return Promise.resolve()
      .then(task)
      .finally(() => {
        this.active -= 1;
        this.drain();
      });
  }

  private drain(): void {
    if (this.disposed) {
      return;
    }
    while (this.active < this.concurrency && this.queue.length > 0) {
      const work = this.queue.shift()!;
      if (work.timer) {
        clearTimeout(work.timer);
      }
      this.start(work.task).then(work.resolve, work.reject);
    }
  }
}
