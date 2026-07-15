import { describe, expect, it, vi } from 'vitest';
import { RanklistViewReporter } from './view-reporter';

describe('RanklistViewReporter', () => {
  it('reports only matching loaded routes and counts A to B to A as three visits', async () => {
    const reporter = new RanklistViewReporter();
    const report = vi.fn(async (_uk: string) => undefined);
    const onSuccess = vi.fn((_uk: string) => undefined);

    await expect(reporter.report({ routeUK: 'a', loadedUK: undefined, report, onSuccess })).resolves.toBe(false);
    await expect(reporter.report({ routeUK: 'a', loadedUK: 'stale', report, onSuccess })).resolves.toBe(false);
    await expect(reporter.report({ routeUK: 'a', loadedUK: 'a', report, onSuccess })).resolves.toBe(true);
    await expect(reporter.report({ routeUK: 'a', loadedUK: 'a', report, onSuccess })).resolves.toBe(false);
    await expect(reporter.report({ routeUK: 'b', loadedUK: 'b', report, onSuccess })).resolves.toBe(true);
    await expect(reporter.report({ routeUK: 'a', loadedUK: 'a', report, onSuccess })).resolves.toBe(true);

    expect(report.mock.calls.map(([uk]) => uk)).toEqual(['a', 'b', 'a']);
    expect(onSuccess.mock.calls.map(([uk]) => uk)).toEqual(['a', 'b', 'a']);
  });

  it('marks a failed attempt before sending and never blocks or retries the same rendered visit', async () => {
    const reporter = new RanklistViewReporter();
    const error = new Error('offline');
    const report = vi.fn().mockRejectedValue(error);
    const onError = vi.fn();

    await expect(reporter.report({ routeUK: 'a', loadedUK: 'a', report, onError })).resolves.toBe(false);
    await expect(reporter.report({ routeUK: 'a', loadedUK: 'a', report, onError })).resolves.toBe(false);

    expect(report).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error, 'a');
  });
});
