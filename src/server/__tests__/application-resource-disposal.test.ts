import { disposeApplicationResources } from '../application-resource-disposal';

describe('application resource disposal', () => {
  it('drains notifications before HTTP and closes remaining resources in dependency order', async () => {
    const order: string[] = [];

    await disposeApplicationResources({
      stopNotifications: async () => {
        order.push('notifications');
      },
      disconnectSubscriber: () => {
        order.push('subscriber-fallback');
      },
      stopHttp: async () => {
        order.push('http');
      },
      closePageRenderer: async () => {
        order.push('renderer');
      },
      closeIdGenerator: async () => {
        order.push('id-generator');
      },
      closeTypeOrm: async () => {
        order.push('typeorm');
      },
      closeRedisCommand: async () => {
        order.push('redis-command');
      },
      onError: vi.fn(),
    });

    expect(order).toEqual(['notifications', 'http', 'renderer', 'id-generator', 'typeorm', 'redis-command']);
  });

  it('disconnects a bootstrap-created subscriber when coordinator stop is unavailable or fails', async () => {
    const unavailableOrder: string[] = [];
    await disposeApplicationResources({
      disconnectSubscriber: () => {
        unavailableOrder.push('subscriber');
      },
      stopHttp: async () => {
        unavailableOrder.push('http');
      },
      onError: vi.fn(),
    });
    expect(unavailableOrder).toEqual(['subscriber', 'http']);

    const failureOrder: string[] = [];
    const onError = vi.fn();
    await disposeApplicationResources({
      stopNotifications: async () => {
        failureOrder.push('notifications');
        throw new Error('stop failed');
      },
      disconnectSubscriber: () => {
        failureOrder.push('subscriber');
      },
      stopHttp: async () => {
        failureOrder.push('http');
      },
      onError,
    });
    expect(failureOrder).toEqual(['notifications', 'subscriber', 'http']);
    expect(onError).toHaveBeenCalledWith('notification coordinator', expect.any(Error));
  });

  it('continues closing later resources after an earlier cleanup error', async () => {
    const order: string[] = [];
    const onError = vi.fn();
    await disposeApplicationResources({
      stopNotifications: async () => undefined,
      disconnectSubscriber: vi.fn(),
      closePageRenderer: async () => {
        order.push('renderer');
        throw new Error('renderer failed');
      },
      closeIdGenerator: async () => {
        order.push('id-generator');
      },
      closeTypeOrm: async () => {
        order.push('typeorm');
      },
      closeRedisCommand: async () => {
        order.push('redis-command');
      },
      onError,
    });

    expect(order).toEqual(['renderer', 'id-generator', 'typeorm', 'redis-command']);
    expect(onError).toHaveBeenCalledWith('page renderer', expect.any(Error));
  });
});
