import type { RequestListener } from 'http';

/** Reject encoded bodies before Koa's global body parser can decompress them. */
export function createApplicationHttpHandler(handler: RequestListener): RequestListener {
  return (request, response) => {
    let encodingHeaderCount = 0;
    for (let index = 0; index < request.rawHeaders.length; index += 2) {
      if (request.rawHeaders[index].toLowerCase() === 'content-encoding') {
        encodingHeaderCount += 1;
      }
    }

    const encoding = request.headers['content-encoding'];
    if (
      encodingHeaderCount > 1 ||
      (encoding !== undefined && (typeof encoding !== 'string' || encoding.trim().toLowerCase() !== 'identity'))
    ) {
      const message = 'Unsupported Content-Encoding';
      response.writeHead(415, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': Buffer.byteLength(message),
        Connection: 'close',
      });
      response.end(message);
      return;
    }

    if (encoding !== undefined) {
      // HTTP coding tokens are case-insensitive; inflation's switch is not.
      request.headers['content-encoding'] = 'identity';
    }
    return handler(request, response);
  };
}
