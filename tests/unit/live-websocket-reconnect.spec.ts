import { describe, expect, it } from 'vitest';
import {
  getLiveWebSocketReconnectDelay,
  getNextLiveWebSocketReconnectAttempt,
} from '../../src/client/modules/live/live-websocket-reconnect';

describe('live websocket reconnect helpers', () => {
  it('uses bounded exponential backoff delays', () => {
    expect(getLiveWebSocketReconnectDelay(0)).toBe(1000);
    expect(getLiveWebSocketReconnectDelay(1)).toBe(2000);
    expect(getLiveWebSocketReconnectDelay(2)).toBe(4000);
    expect(getLiveWebSocketReconnectDelay(3)).toBe(8000);
    expect(getLiveWebSocketReconnectDelay(4)).toBe(10000);
    expect(getLiveWebSocketReconnectDelay(20)).toBe(10000);
  });

  it('normalizes invalid attempts to the first retry delay', () => {
    expect(getLiveWebSocketReconnectDelay(-1)).toBe(1000);
    expect(getLiveWebSocketReconnectDelay(Number.NaN)).toBe(1000);
  });

  it('increments reconnect attempts monotonically', () => {
    expect(getNextLiveWebSocketReconnectAttempt(0)).toBe(1);
    expect(getNextLiveWebSocketReconnectAttempt(4)).toBe(5);
    expect(getNextLiveWebSocketReconnectAttempt(Number.NaN)).toBe(1);
  });
});
