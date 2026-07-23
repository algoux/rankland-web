const TRUSTED_RESPONSE = Symbol('rankland.trusted-response');

interface TrustedResponseBase {
  readonly [TRUSTED_RESPONSE]: true;
  readonly release: () => void;
}

export interface TrustedPreNormalizedJsonResponse extends TrustedResponseBase {
  readonly kind: 'pre-normalized-json';
  readonly data: unknown;
}

export interface TrustedPreEncodedProtobufResponse extends TrustedResponseBase {
  readonly kind: 'pre-encoded-protobuf';
  readonly body: Buffer;
}

export type TrustedResponse = TrustedPreNormalizedJsonResponse | TrustedPreEncodedProtobufResponse;

export function trustedPreNormalizedJson(data: unknown, release: () => void): TrustedPreNormalizedJsonResponse {
  return Object.freeze({
    [TRUSTED_RESPONSE]: true as const,
    kind: 'pre-normalized-json' as const,
    data,
    release: once(release),
  });
}

export function trustedPreEncodedProtobuf(body: Buffer, release: () => void): TrustedPreEncodedProtobufResponse {
  return Object.freeze({
    [TRUSTED_RESPONSE]: true as const,
    kind: 'pre-encoded-protobuf' as const,
    body,
    release: once(release),
  });
}

export function isTrustedResponse(value: unknown): value is TrustedResponse {
  return Boolean(value && typeof value === 'object' && (value as TrustedResponse)[TRUSTED_RESPONSE] === true);
}

function once(callback: () => void): () => void {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    callback();
  };
}
