import http from 'http';
import { createRequire } from 'module';
import { brotliCompressSync } from 'zlib';
import { createApplicationHttpHandler } from '../application-http-handler';
import { listenHttpServer } from '../application-http-listener';

// Exercise the exact parser dependencies used by bwcx, without booting databases.
const frameworkRequire = createRequire(createRequire(import.meta.url).resolve('bwcx-ljsm'));
const Koa = frameworkRequire('koa');
const bodyParser = frameworkRequire('koa-bodyparser');

describe('application HTTP request encoding boundary', () => {
  let server: http.Server;
  let port: number;
  let application: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    const app = new Koa();
    app.use(bodyParser({ jsonLimit: '5mb', formLimit: '5mb' }));
    app.use(async (ctx: any) => {
      const chunks: Buffer[] = [];
      for await (const chunk of ctx.req) chunks.push(Buffer.from(chunk));
      ctx.body = {
        parsed: ctx.request.body,
        raw: Buffer.concat(chunks).toString('base64'),
        acceptEncoding: ctx.get('accept-encoding'),
      };
    });
    application = vi.fn(app.callback());
    server = http.createServer(createApplicationHttpHandler(application));
    await listenHttpServer(server, 0, '127.0.0.1');
    port = (server.address() as { port: number }).port;
  });

  beforeEach(() => {
    application.mockClear();
  });
  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections();
    });
  });

  it.each([
    'br',
    'BR',
    'gzip',
    'deflate',
    'unknown',
    '',
    'identity, br',
    'br, identity',
    'identity, identity',
    'identity;q=1',
  ])('rejects Content-Encoding %j before invoking Koa or any parser', async (encoding) => {
    const response = await request({ 'Content-Encoding': encoding }, brotliCompressSync(Buffer.from('{}')));
    expect(response.status).toBe(415);
    expect(response.headers.connection).toBe('close');
    expect(application).not.toHaveBeenCalled();
  });

  it.each([
    ['identity', 'br'],
    ['br', 'identity'],
    ['identity', 'identity'],
    ['', 'identity'],
  ])('rejects duplicate coding fields %j / %j', async (first, second) => {
    const response = await request([
      'Host',
      '127.0.0.1',
      'Content-Encoding',
      first,
      'cOnTeNt-EnCoDiNg',
      second,
      'Content-Type',
      'application/json',
      'Content-Length',
      '2',
    ]);
    expect(response.status).toBe(415);
    expect(application).not.toHaveBeenCalled();
  });

  it.each([
    ['GET', '/api/checkHealth'],
    ['POST', '/missing'],
    ['OPTIONS', '/api/v2/contests'],
    ['HEAD', '/dist/file.js'],
  ])('enforces the boundary for %s %s', async (method, path) => {
    const response = await request({ 'Content-Encoding': 'br' }, Buffer.from('{}'), method, path);
    expect(response.status).toBe(415);
    expect(application).not.toHaveBeenCalled();
  });

  it('rejects based on headers without waiting for the advertised body', async () => {
    const response = await request({ 'Content-Encoding': 'br', 'Content-Length': '100000' }, Buffer.alloc(0));
    expect(response.status).toBe(415);
    expect(application).not.toHaveBeenCalled();
  });

  it.each([undefined, 'identity', 'IDENTITY', ' Identity '])('preserves JSON with encoding %j', async (encoding) => {
    const response = await request(encoding === undefined ? {} : { 'Content-Encoding': encoding });
    expect(response.status).toBe(200);
    expect(JSON.parse(response.body).parsed).toEqual({});
    expect(application).toHaveBeenCalledTimes(1);
  });

  it('preserves form parsing and response encoding negotiation', async () => {
    const response = await request(
      {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Encoding': 'IDENTITY',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      Buffer.from('name=rankland&value=1'),
    );
    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      parsed: { name: 'rankland', value: '1' },
      acceptEncoding: 'gzip, deflate, br',
    });
  });

  it.each(['application/x-protobuf', 'multipart/form-data; boundary=rankland-test'])(
    'passes uncompressed %s bytes through unchanged',
    async (contentType) => {
      const bytes = Buffer.from([0, 10, 13, 128, 255]);
      const response = await request({ 'Content-Type': contentType }, bytes);
      expect(response.status).toBe(200);
      expect(JSON.parse(response.body).raw).toBe(bytes.toString('base64'));
    },
  );

  it('preserves keep-alive for ordinary requests', async () => {
    const agent = new http.Agent({ keepAlive: true });
    try {
      const first = await request({}, Buffer.from('{}'), 'POST', '/', agent);
      const second = await request({}, Buffer.from('{}'), 'POST', '/', agent);
      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(first.headers.connection).toBe('keep-alive');
      expect(second.reusedSocket).toBe(true);
    } finally {
      agent.destroy();
    }
  });

  function request(
    headers: http.OutgoingHttpHeaders | string[],
    body = Buffer.from('{}'),
    method = 'POST',
    path = '/',
    agent?: http.Agent,
  ): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string; reusedSocket: boolean }> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          agent: agent ?? false,
          headers: Array.isArray(headers)
            ? headers
            : {
                'Content-Type': 'application/json',
                'Content-Length': body.length,
                ...headers,
              },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          res.on('error', reject);
          res.on('end', () =>
            resolve({
              status: res.statusCode!,
              headers: res.headers,
              body: Buffer.concat(chunks).toString(),
              reusedSocket: req.reusedSocket,
            }),
          );
        },
      );
      req.on('error', reject);
      req.setTimeout(2_000, () => req.destroy(new Error('HTTP encoding probe timed out')));
      req.end(body);
    });
  }
});
