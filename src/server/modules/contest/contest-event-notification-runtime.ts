export type ContestEventNotificationSource = 'local' | 'redis' | 'reconcile' | 'direct';

export interface ContestEventNotificationRuntimeSnapshot {
  counters: Record<string, number>;
  maxima: Record<string, number>;
}

class ContestEventNotificationRuntimeMetrics {
  private readonly counters: Record<string, number> = {};
  private readonly maxima: Record<string, number> = {};
  private intervalMaxima: Record<string, number> = {};

  public add(name: string, value = 1): void {
    if (!Number.isFinite(value) || value < 0) {
      return;
    }
    this.counters[name] = (this.counters[name] ?? 0) + value;
  }

  public observeDuration(name: string, durationMs: number): void {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      return;
    }
    this.add(`${name}.samples`);
    this.add(`${name}.durationMsTotal`, durationMs);
    this.observeMaximum(`${name}.durationMsMax`, durationMs);
  }

  public observeMaximum(name: string, value: number): void {
    if (!Number.isFinite(value) || value < 0) {
      return;
    }
    this.maxima[name] = Math.max(this.maxima[name] ?? 0, value);
    this.intervalMaxima[name] = Math.max(this.intervalMaxima[name] ?? 0, value);
  }

  public snapshot(): ContestEventNotificationRuntimeSnapshot {
    return {
      counters: sortedNumbers(this.counters),
      maxima: sortedNumbers(this.maxima),
    };
  }

  public takeIntervalMaxima(): Record<string, number> {
    const result = sortedNumbers(this.intervalMaxima);
    this.intervalMaxima = {};
    return result;
  }
}

export const contestEventNotificationRuntimeMetrics = new ContestEventNotificationRuntimeMetrics();

function sortedNumbers(values: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(values).sort(([left], [right]) => left.localeCompare(right)));
}
