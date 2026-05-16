import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const distDir = path.resolve(__dirname, '..', '..', 'dist');
const serverEntryCandidates = [
  path.join(distDir, 'server', 'index.js'),
  path.join(distDir, 'server', 'entry-server.js'),
];
const serverEntryPath = serverEntryCandidates.find((entryPath) => fs.existsSync(entryPath)) || serverEntryCandidates[0];
const clientIndexPath = path.join(distDir, 'client', 'index.html');

const hasBuild = fs.existsSync(serverEntryPath) && fs.existsSync(clientIndexPath);
const suite = hasBuild ? describe : describe.skip;

class SmokeXMLHttpRequest {
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

  public open() {
    this.readyState = 1;
  }

  public setRequestHeader() {}

  public send() {
    const responseBody = {
      success: true,
      data: {
        page: 9,
        list: [],
        ip: '127.0.0.1',
        ua: 'BwcxServerRequest/0',
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

suite('SSR smoke harness', () => {
  it('renders the existing home route from the built vite-ssr server bundle', async () => {
    globalThis.XMLHttpRequest = SmokeXMLHttpRequest as any;

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
  });
});
