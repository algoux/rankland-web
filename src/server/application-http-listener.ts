import type http from 'http';

export const DEFAULT_SERVER_LISTEN_BACKLOG = 4096;

export function listenHttpServer(server: http.Server, port: number, hostname: string, backlog?: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      server.removeListener('error', onError);
      server.removeListener('listening', onListening);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onListening = () => {
      cleanup();
      resolve();
    };

    server.once('error', onError);
    server.once('listening', onListening);
    try {
      if (backlog === undefined) server.listen(port, hostname);
      else server.listen(port, hostname, backlog);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

export function parseServerListenBacklog(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_SERVER_LISTEN_BACKLOG;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1 || value > 65_535) {
    throw new Error('SERVER_LISTEN_BACKLOG must be an integer between 1 and 65535');
  }
  return value;
}
