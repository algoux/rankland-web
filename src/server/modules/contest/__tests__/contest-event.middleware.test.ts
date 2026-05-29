import { Readable } from 'stream';
import {
  rankland_live_contest_common,
  rankland_live_contest_producer,
} from '@common/proto/rankland_live_contest';
import ContestEventMiddleware from '../contest-event.middleware';

function createBatchBytes() {
  return Buffer.from(
    rankland_live_contest_producer.BatchProducerEvent.encode({
      events: [
        {
          eventId: 1,
          type: rankland_live_contest_common.EventType.NEW_SOLUTION,
          newSolutionData: {
            solutionId: 11,
            userId: 'team-a',
            problemAlias: 'A',
            time: {
              value: '9007199254740993',
              unit: rankland_live_contest_common.TimeUnit.NS,
            },
          },
        },
      ],
    }).finish(),
  );
}

describe('contest event middleware', () => {
  it('decodes protobuf append bodies and continues to bwcx route handling', async () => {
    const bytes = createBatchBytes();
    const middleware = new ContestEventMiddleware({} as any, {} as any).getMiddleware();
    const ctx: any = {
      method: 'POST',
      path: '/api/v2/contests/contest-a/events',
      headers: {
        'content-type': 'application/protobuf',
        'content-length': String(bytes.length),
      },
      req: Readable.from([bytes]),
      request: {},
    };
    let calledNext = false;

    await middleware(ctx, async () => {
      calledNext = true;
      expect(ctx.request.body.events[0].type).toBe('NEW_SOLUTION');
      expect(ctx.request.body.events[0].newSolutionData.time.value).toBe('9007199254740993');
    });

    expect(calledNext).toBe(true);
    expect(ctx.status).toBeUndefined();
  });

  it('rejects octet-stream append bodies before route handling', async () => {
    const middleware = new ContestEventMiddleware({} as any, {} as any).getMiddleware();
    const ctx: any = {
      method: 'POST',
      path: '/api/v2/contests/contest-a/events',
      headers: {
        'content-type': 'application/octet-stream',
      },
      req: Readable.from([createBatchBytes()]),
      request: {},
    };

    await middleware(ctx, async () => {
      throw new Error('next should not be called');
    });

    expect(ctx.status).toBe(415);
    expect(ctx.body).toMatchObject({
      success: false,
      code: 'UNSUPPORTED_MEDIA_TYPE',
    });
  });
});
