import type { Newable } from 'bwcx-common';
import { ResponseContentType } from './content-type';
import { getProtobufContract } from '@server/decorators/protobuf-contract.decorator';
import { getSseContract } from '@server/decorators/sse.decorator';

export interface SupportedResponseTypes {
  /** Response content types the route can produce, in declaration order. */
  supported: ResponseContentType[];
  /**
   * When `true`, a request that accepts none of the supported types must be
   * rejected with 406. Lenient routes (plain JSON endpoints) always fall back
   * to JSON instead, so unusual `Accept` headers don't break them.
   */
  strict: boolean;
}

/**
 * Derive the response content types a route supports from its capability
 * decorators (`@Sse`, `@ProtobufContract`). Business-agnostic.
 */
export function resolveSupportedResponseTypes(
  controller: Newable | Function,
  route: string,
): SupportedResponseTypes {
  if (getSseContract(controller, route)) {
    return { supported: [ResponseContentType.EventStream], strict: true };
  }
  const protobuf = getProtobufContract(controller, route);
  if (protobuf?.resp) {
    return { supported: [ResponseContentType.Json, ResponseContentType.Protobuf], strict: true };
  }
  return { supported: [ResponseContentType.Json], strict: false };
}
