import 'reflect-metadata';
import { ProtobufContract, getProtobufContract } from '../protobuf-contract.decorator';

class ReqMsg {}
class RespMsg {}

function applyDecorator(decorator: MethodDecorator, target: any, key: string) {
  decorator(target.prototype, key, Object.getOwnPropertyDescriptor(target.prototype, key)!);
}

describe('@ProtobufContract', () => {
  it('stores req and resp message types as route metadata', () => {
    class Sample {
      handler() {}
    }
    applyDecorator(ProtobufContract(ReqMsg, RespMsg), Sample, 'handler');
    expect(getProtobufContract(Sample, 'handler')).toEqual({ req: ReqMsg, resp: RespMsg });
  });

  it('supports a request-only contract', () => {
    class Sample {
      handler() {}
    }
    applyDecorator(ProtobufContract(ReqMsg), Sample, 'handler');
    expect(getProtobufContract(Sample, 'handler')).toEqual({ req: ReqMsg, resp: null });
  });

  it('supports a response-only contract', () => {
    class Sample {
      handler() {}
    }
    applyDecorator(ProtobufContract(null, RespMsg), Sample, 'handler');
    expect(getProtobufContract(Sample, 'handler')).toEqual({ req: null, resp: RespMsg });
  });

  it('returns undefined for routes without the decorator', () => {
    class Sample {
      handler() {}
    }
    expect(getProtobufContract(Sample, 'handler')).toBeUndefined();
  });
});
