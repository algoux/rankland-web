import 'reflect-metadata';
import { Readable } from 'stream';
import ProtobufMiddleware from '../protobuf.middleware';
import { ProtobufContract } from '@server/decorators/protobuf-contract.decorator';
import {
  rankland_live_contest_common,
  rankland_live_contest_producer,
} from '@common/proto/rankland_live_contest';

function decorate(decorator: MethodDecorator, target: any, key: string) {
  decorator(target.prototype, key, Object.getOwnPropertyDescriptor(target.prototype, key)!);
}

class AppendController {
  append() {}
}
decorate(ProtobufContract(rankland_live_contest_producer.BatchProducerEvent, null), AppendController, 'append');

class GetController {
  get() {}
}
decorate(ProtobufContract(null, {} as any), GetController, 'get');

function createBatchBytes() {
  return Buffer.from(
    rankland_live_contest_producer.BatchProducerEvent.encode({
      streamRevision: 1,
      events: [
        {
          eventId: 1,
          type: rankland_live_contest_common.EventType.NEW_SOLUTION,
          newSolutionData: {
            solutionId: 11,
            userId: 'team-a',
            problemAlias: 'A',
            time: { value: '9007199254740993', unit: rankland_live_contest_common.TimeUnit.NS },
          },
        },
      ],
    }).finish(),
  );
}

function createCtx(controller: any, route: string, headers: Record<string, string>, bytes?: Buffer) {
  return {
    headers,
    request: {} as any,
    req: bytes ? Readable.from([bytes]) : undefined,
    __bwcx__: { controller, route },
  } as any;
}

describe('ProtobufMiddleware', () => {
  const mw = new ProtobufMiddleware();

  it('decodes protobuf request bodies into ctx.request.body before validation', async () => {
    const bytes = createBatchBytes();
    const ctx = createCtx(
      AppendController,
      'append',
      { 'content-type': 'application/protobuf', 'content-length': String(bytes.length) },
      bytes,
    );
    let called = false;
    await mw.use(ctx, async () => {
      called = true;
    });
    expect(called).toBe(true);
    expect(ctx.request.body.events[0].type).toBe('NEW_SOLUTION');
    expect(ctx.request.body.events[0].newSolutionData.time.value).toBe('9007199254740993');
  });

  it('rejects octet-stream request bodies with 415', async () => {
    const ctx = createCtx(AppendController, 'append', { 'content-type': 'application/octet-stream' }, createBatchBytes());
    await expect(mw.use(ctx, async () => {})).rejects.toMatchObject({ code: 415 });
  });

  it('passes json request bodies through untouched', async () => {
    const ctx = createCtx(AppendController, 'append', { 'content-type': 'application/json' });
    ctx.request.body = { events: [{ eventId: 1 }] };
    let called = false;
    await mw.use(ctx, async () => {
      called = true;
    });
    expect(called).toBe(true);
    expect(ctx.request.body).toEqual({ events: [{ eventId: 1 }] });
  });

  it('rejects oversize protobuf bodies with 413 by content-length', async () => {
    const ctx = createCtx(
      AppendController,
      'append',
      { 'content-type': 'application/protobuf', 'content-length': String(6 * 1024 * 1024) },
      createBatchBytes(),
    );
    await expect(mw.use(ctx, async () => {})).rejects.toMatchObject({ code: 413 });
  });

  it('rejects undecodable protobuf bytes with 400', async () => {
    const ctx = createCtx(
      AppendController,
      'append',
      { 'content-type': 'application/protobuf' },
      Buffer.from([0x0a, 0xff]),
    );
    await expect(mw.use(ctx, async () => {})).rejects.toMatchObject({ code: 400 });
  });

  it('skips routes without a protobuf request contract', async () => {
    const ctx = createCtx(GetController, 'get', { 'content-type': 'application/protobuf' }, createBatchBytes());
    let called = false;
    await mw.use(ctx, async () => {
      called = true;
    });
    expect(called).toBe(true);
    expect(ctx.request.body).toBeUndefined();
  });
});
