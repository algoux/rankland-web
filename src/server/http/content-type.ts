/**
 * Generic HTTP content-type negotiation, business-agnostic.
 *
 * The set of content types an endpoint supports is decided by the caller
 * (derived from route metadata). This module only resolves which supported
 * type best matches the client's `Accept` header.
 *
 * Negotiation rule: parse `Accept` q-values, pick the supported type with the
 * highest quality. When no priority is expressed, or several supported types
 * tie at the same quality, prefer JSON.
 */

export enum ResponseContentType {
  Json = 'json',
  Protobuf = 'protobuf',
  EventStream = 'event-stream',
}

export const MEDIA_TYPE = {
  json: 'application/json',
  protobuf: 'application/protobuf',
  xProtobuf: 'application/x-protobuf',
  eventStream: 'text/event-stream',
  octetStream: 'application/octet-stream',
} as const;

const HEADER_VALUE: Record<ResponseContentType, string> = {
  [ResponseContentType.Json]: MEDIA_TYPE.json,
  [ResponseContentType.Protobuf]: MEDIA_TYPE.protobuf,
  [ResponseContentType.EventStream]: 'text/event-stream; charset=utf-8',
};

/** The concrete media types each response content type can satisfy. */
const CONCRETE_TYPES: Record<ResponseContentType, string[]> = {
  [ResponseContentType.Json]: [MEDIA_TYPE.json],
  [ResponseContentType.Protobuf]: [MEDIA_TYPE.protobuf, MEDIA_TYPE.xProtobuf],
  [ResponseContentType.EventStream]: [MEDIA_TYPE.eventStream],
};

export function contentTypeHeaderValue(type: ResponseContentType): string {
  return HEADER_VALUE[type];
}

interface AcceptEntry {
  type: string;
  q: number;
  order: number;
}

/**
 * Resolve the best supported response content type for the given `Accept`
 * header. Returns `null` when none of the requested types are supported
 * (caller should respond 406).
 */
export function negotiateResponseContentType(
  acceptHeader: string | string[] | undefined,
  supported: ResponseContentType[],
): ResponseContentType | null {
  if (supported.length === 0) {
    return null;
  }
  const accepted = parseAcceptHeader(acceptHeader);

  let best: { type: ResponseContentType; q: number } | null = null;
  for (const type of supported) {
    const q = bestQualityFor(accepted, CONCRETE_TYPES[type]);
    if (q <= 0) {
      continue;
    }
    if (!best || q > best.q) {
      best = { type, q };
    }
  }
  if (!best) {
    return null;
  }

  // Tie-break: prefer JSON when it ties at the best quality, else keep the
  // first supported type that reached the best quality (already in `best`).
  if (best.type !== ResponseContentType.Json && supported.includes(ResponseContentType.Json)) {
    const jsonQuality = bestQualityFor(accepted, CONCRETE_TYPES[ResponseContentType.Json]);
    if (jsonQuality >= best.q) {
      return ResponseContentType.Json;
    }
  }
  return best.type;
}

function parseAcceptHeader(header: string | string[] | undefined): AcceptEntry[] {
  if (Array.isArray(header)) {
    return parseAcceptHeader(header.join(','));
  }
  if (!header?.trim()) {
    return [{ type: '*/*', q: 1, order: 0 }];
  }
  const entries = header
    .split(',')
    .map((part, order) => {
      const [rawType, ...rawParams] = part.split(';');
      const type = rawType.trim().toLowerCase();
      let q = 1;
      for (const rawParam of rawParams) {
        const [name, value] = rawParam.split('=').map((item) => item.trim());
        if (name?.toLowerCase() === 'q') {
          const parsed = Number(value);
          q = Number.isFinite(parsed) ? parsed : 0;
        }
      }
      return { type, q, order };
    })
    .filter((item) => item.type && item.q > 0);
  return entries.length > 0 ? entries : [{ type: '*/*', q: 1, order: 0 }];
}

function bestQualityFor(accepted: AcceptEntry[], concreteTypes: string[]): number {
  let best = 0;
  for (const item of accepted) {
    if (matches(item.type, concreteTypes)) {
      best = Math.max(best, item.q);
    }
  }
  return best;
}

function matches(acceptType: string, concreteTypes: string[]): boolean {
  if (acceptType === '*/*') {
    return true;
  }
  for (const concrete of concreteTypes) {
    if (acceptType === concrete) {
      return true;
    }
    const [group] = concrete.split('/');
    if (acceptType === `${group}/*`) {
      return true;
    }
  }
  return false;
}
