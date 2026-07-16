import type http from 'http';

export function listenHttpServer(server: http.Server, port: number, hostname: string): Promise<void> {
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
      server.listen(port, hostname);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}
