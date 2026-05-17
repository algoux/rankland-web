import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const distDir = path.resolve(__dirname, '..', '..', 'dist');
const serverEntryCandidates = [
  path.join(distDir, 'server', 'index.js'),
  path.join(distDir, 'server', 'entry-server.js'),
];
const clientIndexPath = path.join(distDir, 'client', 'index.html');

function getServerEntryPath() {
  return serverEntryCandidates.find((entryPath) => fs.existsSync(entryPath));
}

function requireBuildArtifacts() {
  const serverEntryPath = getServerEntryPath();
  const missingArtifacts = [
    serverEntryPath ? null : `one of ${serverEntryCandidates.join(', ')}`,
    fs.existsSync(clientIndexPath) ? null : clientIndexPath,
  ].filter(Boolean);

  if (missingArtifacts.length > 0) {
    throw new Error(`SSR smoke requires built artifacts. Run "pnpm run build" first. Missing: ${missingArtifacts.join('; ')}`);
  }

  return serverEntryPath as string;
}

class SmokeXMLHttpRequest {
  private method = '';
  private url = '';

  public readyState = 0;
  public responseText = '';
  public response = '';
  public responseURL = '';
  public status = 0;
  public statusText = '';
  public timeout = 0;
  public withCredentials = false;
  public onloadend: (() => void) | null = null;
  public onreadystatechange: (() => void) | null = null;
  public onabort: (() => void) | null = null;
  public onerror: (() => void) | null = null;
  public ontimeout: (() => void) | null = null;

  public open(method: string, url: string) {
    this.method = method;
    this.url = url;
    this.readyState = 1;
  }

  public setRequestHeader() {}

  public send() {
    const requestUrl = new URL(this.url, 'http://127.0.0.1:3000');
    const isExpectedStatisticsRequest =
      this.method.toUpperCase() === 'GET' &&
      requestUrl.origin === 'http://127.0.0.1:3000' &&
      requestUrl.pathname === '/api/statistics';

    if (!isExpectedStatisticsRequest) {
      throw new Error(`Unexpected SSR smoke XHR request: ${this.method} ${this.url}`);
    }

    const responseBody = {
      code: 0,
      message: 'success',
      data: {
        totalSrkCount: 1234,
        totalViewCount: 56789,
      },
    };

    this.status = 200;
    this.statusText = 'OK';
    this.readyState = 4;
    this.responseText = JSON.stringify(responseBody);
    this.response = this.responseText;
    this.onloadend?.();
    this.onreadystatechange?.();
  }

  public abort() {
    this.onabort?.();
  }

  public getAllResponseHeaders() {
    return 'content-type: application/json\r\n';
  }
}

describe('SSR smoke harness', () => {
  it('renders the existing home route from the built vite-ssr server bundle', async () => {
    const serverEntryPath = requireBuildArtifacts();
    const previousXMLHttpRequest = globalThis.XMLHttpRequest;
    globalThis.XMLHttpRequest = SmokeXMLHttpRequest as any;

    try {
      const renderModule = await import(serverEntryPath);
      const render = renderModule.default || renderModule;
      const htmlTemplate = fs.readFileSync(clientIndexPath, 'utf-8');

      const result = await render('http://localhost:3000/', {
        request: {
          headers: {
            host: 'localhost:3000',
          },
          socket: {
            remoteAddress: '127.0.0.1',
          },
        },
        response: {},
        template: htmlTemplate,
        manifest: {},
        preload: false,
      });

      expect(result).toBeTruthy();
      expect(typeof result.html).toBe('string');
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('欢迎来到 RankLand');
      expect(result.html).toContain('1234');
      expect(result.html).toContain('56789');
    } finally {
      globalThis.XMLHttpRequest = previousXMLHttpRequest;
    }
  });
});
