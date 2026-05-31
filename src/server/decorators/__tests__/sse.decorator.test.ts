import 'reflect-metadata';
import { Sse, getSseContract } from '../sse.decorator';

function applyDecorator(decorator: MethodDecorator, target: any, key: string) {
  decorator(target.prototype, key, Object.getOwnPropertyDescriptor(target.prototype, key)!);
}

describe('@Sse', () => {
  it('marks a route as an SSE endpoint with default options', () => {
    class Sample {
      stream() {}
    }
    applyDecorator(Sse(), Sample, 'stream');
    expect(getSseContract(Sample, 'stream')).toEqual({ retry: 1000 });
  });

  it('allows overriding the retry hint', () => {
    class Sample {
      stream() {}
    }
    applyDecorator(Sse({ retry: 3000 }), Sample, 'stream');
    expect(getSseContract(Sample, 'stream')).toEqual({ retry: 3000 });
  });

  it('returns undefined for non-SSE routes', () => {
    class Sample {
      stream() {}
    }
    expect(getSseContract(Sample, 'stream')).toBeUndefined();
  });
});
