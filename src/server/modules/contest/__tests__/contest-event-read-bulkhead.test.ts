import ContestEventReadBulkhead from '../contest-event-read-bulkhead';

describe('ContestEventReadBulkhead', () => {
  it('rejects queued work terminally when its owner is disposed', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const bulkhead = new ContestEventReadBulkhead(1, 1, 10_000);
    const active = bulkhead.run(async () => gate);
    const queued = bulkhead.run(async () => 'queued');

    bulkhead.dispose();

    await expect(queued).rejects.toMatchObject({ reason: 'disposed' });
    release();
    await expect(active).resolves.toBeUndefined();
    await expect(bulkhead.run(async () => undefined)).rejects.toMatchObject({ reason: 'disposed' });
  });
});
