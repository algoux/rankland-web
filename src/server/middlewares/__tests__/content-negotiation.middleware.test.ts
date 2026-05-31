import 'reflect-metadata';
import ContentNegotiationMiddleware from '../content-negotiation.middleware';
import { ResponseContentType } from '@server/http/content-type';
import { ProtobufContract } from '@server/decorators/protobuf-contract.decorator';
import { Sse } from '@server/decorators/sse.decorator';

class RespMsg {}

function decorate(decorator: MethodDecorator, target: any, key: string) {
  decorator(target.prototype, key, Object.getOwnPropertyDescriptor(target.prototype, key)!);
}

function createCtx(controller: any, route: string, accept?: string) {
  return {
    headers: accept === undefined ? {} : { accept },
    state: {},
    __bwcx__: { controller, route },
  } as any;
}

class ProtobufRouteController {
  get() {}
}
decorate(ProtobufContract(null, RespMsg), ProtobufRouteController, 'get');

class SseRouteController {
  stream() {}
}
decorate(Sse(), SseRouteController, 'stream');

class PlainController {
  plain() {}
}

describe('ContentNegotiationMiddleware', () => {
  const mw = new ContentNegotiationMiddleware();

  it('resolves json for a protobuf-capable route when json is accepted', async () => {
    const ctx = createCtx(ProtobufRouteController, 'get', 'application/json');
    let called = false;
    await mw.use(ctx, async () => {
      called = true;
    });
    expect(ctx.state.respContentType).toBe(ResponseContentType.Json);
    expect(called).toBe(true);
  });

  it('resolves protobuf when protobuf is explicitly requested', async () => {
    const ctx = createCtx(ProtobufRouteController, 'get', 'application/protobuf');
    await mw.use(ctx, async () => {});
    expect(ctx.state.respContentType).toBe(ResponseContentType.Protobuf);
  });

  it('prefers json for a protobuf-capable route when Accept is absent', async () => {
    const ctx = createCtx(ProtobufRouteController, 'get');
    await mw.use(ctx, async () => {});
    expect(ctx.state.respContentType).toBe(ResponseContentType.Json);
  });

  it('throws 406 for a strict route when nothing acceptable matches', async () => {
    const ctx = createCtx(ProtobufRouteController, 'get', 'application/octet-stream');
    await expect(mw.use(ctx, async () => {})).rejects.toMatchObject({ code: 406 });
    expect(ctx.state.respContentType).toBeUndefined();
  });

  it('resolves event-stream for SSE routes', async () => {
    const ctx = createCtx(SseRouteController, 'stream', 'text/event-stream');
    await mw.use(ctx, async () => {});
    expect(ctx.state.respContentType).toBe(ResponseContentType.EventStream);
  });

  it('falls back to json (no 406) for lenient plain routes', async () => {
    const ctx = createCtx(PlainController, 'plain', 'application/octet-stream');
    let called = false;
    await mw.use(ctx, async () => {
      called = true;
    });
    expect(ctx.state.respContentType).toBe(ResponseContentType.Json);
    expect(called).toBe(true);
  });
});
