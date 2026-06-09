import {
  ResponseContentType,
  negotiateResponseContentType,
  contentTypeHeaderValue,
} from '../content-type';

const protobufRoute = [ResponseContentType.Json, ResponseContentType.Protobuf];
const jsonRoute = [ResponseContentType.Json];
const sseRoute = [ResponseContentType.EventStream];

describe('negotiateResponseContentType', () => {
  it('prefers json when Accept is absent (no declared priority)', () => {
    expect(negotiateResponseContentType(undefined, protobufRoute)).toBe(ResponseContentType.Json);
    expect(negotiateResponseContentType('', protobufRoute)).toBe(ResponseContentType.Json);
  });

  it('prefers json on wildcard-only Accept', () => {
    expect(negotiateResponseContentType('*/*', protobufRoute)).toBe(ResponseContentType.Json);
    expect(negotiateResponseContentType('application/*', protobufRoute)).toBe(ResponseContentType.Json);
  });

  it('selects protobuf when only protobuf is requested', () => {
    expect(negotiateResponseContentType('application/protobuf', protobufRoute)).toBe(ResponseContentType.Protobuf);
    expect(negotiateResponseContentType('application/x-protobuf', protobufRoute)).toBe(ResponseContentType.Protobuf);
  });

  it('selects json when json outranks protobuf by q', () => {
    expect(
      negotiateResponseContentType('application/json;q=0.9, application/protobuf;q=0.5', protobufRoute),
    ).toBe(ResponseContentType.Json);
  });

  it('selects protobuf when protobuf outranks json by q', () => {
    expect(
      negotiateResponseContentType('application/protobuf;q=0.9, application/json;q=0.5', protobufRoute),
    ).toBe(ResponseContentType.Protobuf);
  });

  it('prefers json on equal-priority tie', () => {
    expect(
      negotiateResponseContentType('application/json;q=0.8, application/x-protobuf;q=0.8', protobufRoute),
    ).toBe(ResponseContentType.Json);
  });

  it('returns null when no requested type is supported', () => {
    expect(negotiateResponseContentType('application/octet-stream', jsonRoute)).toBeNull();
    expect(negotiateResponseContentType('application/protobuf', jsonRoute)).toBeNull();
  });

  it('negotiates event-stream routes', () => {
    expect(negotiateResponseContentType(undefined, sseRoute)).toBe(ResponseContentType.EventStream);
    expect(negotiateResponseContentType('text/event-stream', sseRoute)).toBe(ResponseContentType.EventStream);
    expect(negotiateResponseContentType('text/*', sseRoute)).toBe(ResponseContentType.EventStream);
    expect(negotiateResponseContentType('application/json', sseRoute)).toBeNull();
  });

  it('ignores zero-quality entries', () => {
    expect(
      negotiateResponseContentType('application/json;q=0, application/protobuf;q=0.7', protobufRoute),
    ).toBe(ResponseContentType.Protobuf);
  });
});

describe('contentTypeHeaderValue', () => {
  it('maps response content types to media type strings', () => {
    expect(contentTypeHeaderValue(ResponseContentType.Json)).toBe('application/json');
    expect(contentTypeHeaderValue(ResponseContentType.Protobuf)).toBe('application/protobuf');
    expect(contentTypeHeaderValue(ResponseContentType.EventStream)).toBe('text/event-stream; charset=utf-8');
  });
});
