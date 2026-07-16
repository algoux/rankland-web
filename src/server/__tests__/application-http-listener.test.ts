import http from 'http';
import { listenHttpServer } from '../application-http-listener';

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
});

function closeServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
