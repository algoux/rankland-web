import 'reflect-metadata';
import type { Newable } from 'bwcx-common';

export interface SseContractMeta {
  /** SSE `retry:` hint (ms) sent to clients when the stream opens. */
  retry: number;
}

export interface SseOptions {
  retry?: number;
}

const SSE_CONTRACT_KEY = Symbol.for('rl:sseContract');

const DEFAULT_RETRY = 1000;

/**
 * Mark a controller route as a Server-Sent Events endpoint. Purely metadata —
 * the generic SSE middleware reads it to set up the event-stream response, and
 * the content negotiator uses it to restrict the supported response types.
 */
export function Sse(options: SseOptions = {}): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    const ctor = (target as any).constructor;
    const meta: SseContractMeta = { retry: options.retry ?? DEFAULT_RETRY };
    Reflect.defineMetadata(SSE_CONTRACT_KEY, meta, ctor, propertyKey as string);
  };
}

export function getSseContract(
  controller: Newable | Function,
  route: string,
): SseContractMeta | undefined {
  return Reflect.getMetadata(SSE_CONTRACT_KEY, controller, route);
}
