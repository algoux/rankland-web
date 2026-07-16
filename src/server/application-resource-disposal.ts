export interface ApplicationResourceDisposalOptions {
  stopNotifications?: () => void | Promise<void>;
  disconnectSubscriber?: () => void;
  stopHttp?: () => void | Promise<void>;
  closePageRenderer?: () => void | Promise<void>;
  closeIdGenerator?: () => void | Promise<void>;
  closeTypeOrm?: () => void | Promise<void>;
  closeRedisCommand?: () => void | Promise<void>;
  onError: (resource: string, error: unknown) => void;
  resourceTimeoutMs?: number;
}

export async function disposeApplicationResources(options: ApplicationResourceDisposalOptions): Promise<void> {
  const timeoutMs = options.resourceTimeoutMs ?? 1_000;
  let notificationsStopped = false;
  if (options.stopNotifications) {
    notificationsStopped = await runCleanup(
      'notification coordinator',
      options.stopNotifications,
      timeoutMs,
      options.onError,
    );
  }
  if (!notificationsStopped && options.disconnectSubscriber) {
    try {
      options.disconnectSubscriber();
    } catch (error) {
      options.onError('Redis subscriber', error);
    }
  }

  await runCleanup('HTTP server', options.stopHttp, timeoutMs, options.onError);
  await runCleanup('page renderer', options.closePageRenderer, timeoutMs, options.onError);
  await runCleanup('ID generator', options.closeIdGenerator, timeoutMs, options.onError);
  await runCleanup('TypeORM', options.closeTypeOrm, timeoutMs, options.onError);
  await runCleanup('Redis command client', options.closeRedisCommand, timeoutMs, options.onError);
}

async function runCleanup(
  resource: string,
  cleanup: (() => void | Promise<void>) | undefined,
  timeoutMs: number,
  onError: (resource: string, error: unknown) => void,
): Promise<boolean> {
  if (!cleanup) {
    return true;
  }
  try {
    await withTimeout(Promise.resolve().then(cleanup), resource, timeoutMs);
    return true;
  } catch (error) {
    onError(resource, error);
    return false;
  }
}

async function withTimeout<T>(promise: Promise<T>, resource: string, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`${resource} cleanup timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
