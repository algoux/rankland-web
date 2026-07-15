interface RanklistViewReportOptions {
  routeUK: string;
  loadedUK?: string;
  report: (uk: string) => Promise<unknown>;
  onSuccess?: (uk: string) => void;
  onError?: (error: unknown, uk: string) => void;
}

export class RanklistViewReporter {
  private lastAttemptedUK = '';

  public async report(options: RanklistViewReportOptions): Promise<boolean> {
    const { routeUK, loadedUK } = options;
    if (!routeUK || !loadedUK || routeUK !== loadedUK || this.lastAttemptedUK === loadedUK) {
      return false;
    }

    this.lastAttemptedUK = loadedUK;
    try {
      await options.report(loadedUK);
      options.onSuccess?.(loadedUK);
      return true;
    } catch (error) {
      options.onError?.(error, loadedUK);
      return false;
    }
  }
}
