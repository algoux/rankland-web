import http from 'http';
import { listenHttpServer, parseServerListenBacklog } from '../application-http-listener';

describe('application HTTP listener', () => {
  it('rejects a startup listen error and removes temporary listeners', async () => {
    const occupied = http.createServer();
    await listenHttpServer(occupied, 0, '127.0.0.1');
    const address = occupied.address();
    expect(address && typeof address === 'object').toBe(true);

    const server = http.createServer();
    await expect(listenHttpServer(server, (address as { port: number }).port, '127.0.0.1')).rejects.toMatchObject({
      code: 'EADDRINUSE',
    });
    expect(server.listenerCount('error')).toBe(0);

    await closeServer(occupied);
  });

  it('resolves on listening and removes the startup error listener', async () => {
    const server = http.createServer();

    await listenHttpServer(server, 0, '127.0.0.1');

    expect(server.listening).toBe(true);
    expect(server.listenerCount('error')).toBe(0);
    await closeServer(server);
  });

  it('defaults to the load-tested listen backlog and rejects unsafe values', () => {
    expect(parseServerListenBacklog(undefined)).toBe(4096);
    expect(parseServerListenBacklog('511')).toBe(511);
    expect(parseServerListenBacklog('4096')).toBe(4096);
    for (const invalid of ['', '0', '-1', '1.5', '65536', 'not-a-number']) {
      expect(() => parseServerListenBacklog(invalid)).toThrow(/SERVER_LISTEN_BACKLOG/);
    }
  });

  it('listens with an explicit backlog without changing startup cleanup', async () => {
    const server = http.createServer();
    await listenHttpServer(server, 0, '127.0.0.1', 128);
    expect(server.listening).toBe(true);
    expect(server.listenerCount('error')).toBe(0);
    await closeServer(server);
  });
});

function closeServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
