import type { Page, Route } from '@playwright/test';
import collection from '../../fixtures/collection.json';
import listall from '../../fixtures/listall.json';
import liveInfo from '../../fixtures/live-info.json';
import ranklistInfo from '../../fixtures/ranklist-info.json';
import srk from '../../fixtures/ranklist.srk.json';
import statistics from '../../fixtures/statistics.json';

function ok(data: unknown) {
  return { code: 0, message: 'success', data };
}

async function fulfillJson(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
}

export async function installApiMocks(page: Page) {
  await page.route(/\/api\/rank\/[^/?]+(?:\?.*)?$/, (route) => fulfillJson(route, ok(ranklistInfo)));
  await page.route(/\/api\/ranking\/[^/?]+(?:\?.*)?$/, (route) => fulfillJson(route, ok(srk)));
  await page.route(/\/api\/ranking\/config\/[^/?]+(?:\?.*)?$/, (route) => fulfillJson(route, ok(liveInfo)));
  await page.route(/\/api\/file\/download(?:\?.*)?$/, (route) => fulfillJson(route, srk));
  await page.route(/\/api\/rank\/group\/[^/?]+(?:\?.*)?$/, (route) =>
    fulfillJson(route, ok({ content: JSON.stringify(collection) })),
  );
  await page.route(/\/api\/statistics(?:\?.*)?$/, (route) => fulfillJson(route, ok(statistics)));
  await page.route(/\/api\/rank\/search(?:\?.*)?$/, (route) => fulfillJson(route, ok(listall)));
  await page.route(/\/api\/rank\/listall(?:\?.*)?$/, (route) => fulfillJson(route, ok(listall)));
  await page.route(/\/api\/demoGet\/[^/?]+(?:\?.*)?$/, (route) =>
    fulfillJson(route, {
      success: true,
      data: {
        page: 9,
        list: [
          { id: 42, name: 'demo1' },
          { id: 999, name: 'demo2' },
        ],
        ip: '127.0.0.1',
        ua: 'Playwright',
      },
    }),
  );
}

export async function denyExternalCalls(page: Page) {
  await page.route(/^https?:\/\/(?!(127\.0\.0\.1|localhost)(:\d+)?\/).*/, (route) =>
    route.abort('blockedbyclient'),
  );
}

export async function stubWebSocket(page: Page) {
  await page.addInitScript(() => {
    const sockets = new Map<string, EventTarget>();
    const win = window as unknown as {
      __ranklandWsUrls?: string[];
      __ranklandEmitWsMessage?: (url: string, bytes: number[]) => void;
    };
    win.__ranklandWsUrls = [];
    win.__ranklandEmitWsMessage = (url: string, bytes: number[]) => {
      const socket = sockets.get(url);
      if (!socket) {
        return;
      }
      socket.dispatchEvent(new MessageEvent('message', { data: new Uint8Array(bytes).buffer }));
    };

    class StubWebSocket extends EventTarget {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      binaryType = 'arraybuffer';
      readyState = StubWebSocket.OPEN;
      url: string;

      constructor(url: string) {
        super();
        this.url = url;
        win.__ranklandWsUrls?.push(url);
        sockets.set(url, this);
        setTimeout(() => this.dispatchEvent(new Event('open')), 0);
      }

      close() {
        this.readyState = StubWebSocket.CLOSED;
        sockets.delete(this.url);
        this.dispatchEvent(new Event('close'));
      }

      send() {}
    }

    window.WebSocket = StubWebSocket as unknown as typeof WebSocket;
  });
}
