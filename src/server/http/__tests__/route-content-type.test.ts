import 'reflect-metadata';
import { resolveSupportedResponseTypes } from '../route-content-type';
import { ResponseContentType } from '../content-type';
import { ProtobufContract } from '@server/decorators/protobuf-contract.decorator';
import { Sse } from '@server/decorators/sse.decorator';

class ReqMsg {}
class RespMsg {}

function applyDecorator(decorator: MethodDecorator, target: any, key: string) {
  decorator(target.prototype, key, Object.getOwnPropertyDescriptor(target.prototype, key)!);
}

describe('resolveSupportedResponseTypes', () => {
  it('restricts SSE routes to event-stream and marks them strict', () => {
    class C {
      stream() {}
    }
    applyDecorator(Sse(), C, 'stream');
    expect(resolveSupportedResponseTypes(C, 'stream')).toEqual({
      supported: [ResponseContentType.EventStream],
      strict: true,
    });
  });

  it('allows protobuf and json for routes with a protobuf response and marks them strict', () => {
    class C {
      get() {}
    }
    applyDecorator(ProtobufContract(null, RespMsg), C, 'get');
    expect(resolveSupportedResponseTypes(C, 'get')).toEqual({
      supported: [ResponseContentType.Json, ResponseContentType.Protobuf],
      strict: true,
    });
  });

  it('treats protobuf-request-only routes as lenient json responders', () => {
    class C {
      append() {}
    }
    applyDecorator(ProtobufContract(ReqMsg, null), C, 'append');
    expect(resolveSupportedResponseTypes(C, 'append')).toEqual({
      supported: [ResponseContentType.Json],
      strict: false,
    });
  });

  it('treats undecorated routes as lenient json responders', () => {
    class C {
      plain() {}
    }
    expect(resolveSupportedResponseTypes(C, 'plain')).toEqual({
      supported: [ResponseContentType.Json],
      strict: false,
    });
  });
});
