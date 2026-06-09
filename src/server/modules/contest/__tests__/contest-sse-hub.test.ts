import ContestSseHub from '../contest-sse-hub';

function createResponse() {
  const writes: string[] = [];
  const listeners = new Map<string, () => void>();
  return {
    writes,
    response: {
      write(chunk: string) {
        writes.push(chunk);
        return true;
      },
      end() {},
      on(event: string, listener: () => void) {
        listeners.set(event, listener);
      },
    },
  };
}

describe('ContestSseHub', () => {
  it('does not duplicate the retry frame emitted by generic SSE middleware', () => {
    const hub = new ContestSseHub();
    const { response, writes } = createResponse();

    hub.addClient('contest-a', response, {
      uk: 'contest-a',
      latestEventId: 7,
      streamRevision: 2,
    });

    expect(writes).toEqual([
      'event: events-available\n',
      'data: {"uk":"contest-a","latestEventId":7,"streamRevision":2}\n\n',
    ]);
  });
});
