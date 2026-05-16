import type { AxiosInstance } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: mocks.create,
  },
}));

import { createRanklandApiService } from '@client/rankland-api';

function setEnv(env: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe('createRanklandApiService', () => {
  afterEach(() => {
    mocks.create.mockReset();
    setEnv({
      RANKLAND_API_BASE_SERVER: undefined,
      RANKLAND_CDN_API_BASE_SERVER: undefined,
      RANKLAND_API_BASE_CLIENT: undefined,
      RANKLAND_CDN_API_BASE_CLIENT: undefined,
    });
  });

  it('server mode uses server base URLs, timeout, and forwards SSR headers', () => {
    setEnv({
      RANKLAND_API_BASE_SERVER: 'http://server.internal/api',
      RANKLAND_CDN_API_BASE_SERVER: 'http://cdn.internal/api',
    });
    mocks.create
      .mockReturnValueOnce({ request: vi.fn() } as unknown as AxiosInstance)
      .mockReturnValueOnce({ request: vi.fn() } as unknown as AxiosInstance);

    createRanklandApiService({
      isClient: false,
      requestHeaders: {
        cookie: ['sid=abc', 'sid=def'],
        'user-agent': ['Vitest UA', 'Other UA'],
        server_render_ip: ['203.0.113.1', '198.51.100.2'],
        ignored: 'no',
      },
    });

    expect(mocks.create).toHaveBeenNthCalledWith(1, {
      baseURL: 'http://server.internal/api',
      timeout: 30000,
      headers: {
        Cookie: 'sid=abc',
        'user-agent': 'Vitest UA',
        server_render_ip: '203.0.113.1',
      },
    });
    expect(mocks.create).toHaveBeenNthCalledWith(2, {
      baseURL: 'http://cdn.internal/api',
      timeout: 30000,
      headers: {
        Cookie: 'sid=abc',
        'user-agent': 'Vitest UA',
        server_render_ip: '203.0.113.1',
      },
    });
  });

  it('client mode uses client base URLs, timeout, and no SSR headers', () => {
    setEnv({
      RANKLAND_API_BASE_CLIENT: 'https://client.example/api',
      RANKLAND_CDN_API_BASE_CLIENT: 'https://cdn.example/api',
    });
    mocks.create
      .mockReturnValueOnce({ request: vi.fn() } as unknown as AxiosInstance)
      .mockReturnValueOnce({ request: vi.fn() } as unknown as AxiosInstance);

    createRanklandApiService({ isClient: true });

    expect(mocks.create).toHaveBeenNthCalledWith(1, {
      baseURL: 'https://client.example/api',
      timeout: 30000,
      headers: {},
    });
    expect(mocks.create).toHaveBeenNthCalledWith(2, {
      baseURL: 'https://cdn.example/api',
      timeout: 30000,
      headers: {},
    });
  });

  it('unset client base URLs fall back to /api for both normal and CDN APIs', () => {
    mocks.create
      .mockReturnValueOnce({ request: vi.fn() } as unknown as AxiosInstance)
      .mockReturnValueOnce({ request: vi.fn() } as unknown as AxiosInstance);

    createRanklandApiService({ isClient: true });

    expect(mocks.create).toHaveBeenNthCalledWith(1, { baseURL: '/api', timeout: 30000, headers: {} });
    expect(mocks.create).toHaveBeenNthCalledWith(2, { baseURL: '/api', timeout: 30000, headers: {} });
  });
});
