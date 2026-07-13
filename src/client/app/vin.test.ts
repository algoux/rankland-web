import { describe, expect, it, vi } from 'vitest';
import { loadVinNotice, parseVinNotice } from './vin';

describe('VIN notices', () => {
  it('parses a valid VIN notice after trimming the file boundaries', () => {
    expect(parseVinNotice('\n  VIN:1:Our service is scheduled for maintenance  \n')).toEqual({
      id: '1',
      message: 'Our service is scheduled for maintenance',
    });
  });

  it('allows colons and multiple lines in the message', () => {
    expect(parseVinNotice('VIN:notice-x:\nLine one: details\nLine two')).toEqual({
      id: 'notice-x',
      message: 'Line one: details\nLine two',
    });
  });

  it.each([
    '',
    '   \n',
    'VIN:',
    'VIN::message',
    'VIN:x:',
    'VIN:x:   ',
    'vin:x:message',
    'prefix VIN:x:message',
    'VIN:line\nbreak:message',
  ])('ignores invalid VIN content %j', (content) => {
    expect(parseVinNotice(content)).toBeUndefined();
  });

  it('shows an unread notice until dismissed, then persists its ID', async () => {
    const storage = createStorage();
    const showWarning = vi.fn();

    await loadVinNotice({
      url: 'https://cdn.example/vin.txt',
      fetchImpl: vi.fn(async () => createResponse(200, 'VIN:maintenance-1:Planned maintenance')),
      storage,
      showWarning,
      logError: vi.fn(),
    });

    expect(showWarning).toHaveBeenCalledOnce();
    expect(showWarning).toHaveBeenCalledWith('Planned maintenance', {
      id: 'rankland-vin:maintenance-1',
      duration: Infinity,
      closeButton: true,
      onDismiss: expect.any(Function),
    });
    expect(storage.setItem).not.toHaveBeenCalled();

    showWarning.mock.calls[0][1].onDismiss();

    expect(storage.setItem).toHaveBeenCalledWith('RanklandVinReadIds', '["maintenance-1"]');
  });

  it('treats HTTP 404 as an expected missing notice', async () => {
    const response = createResponse(404, 'VIN:ignored:Should not be shown', 'Not Found');
    const showWarning = vi.fn();
    const logError = vi.fn();

    await loadVinNotice({
      url: 'https://cdn.example/vin.txt',
      fetchImpl: vi.fn(async () => response),
      storage: createStorage(),
      showWarning,
      logError,
    });

    expect(response.text).not.toHaveBeenCalled();
    expect(showWarning).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });

  it.each([
    [400, 'Bad Request'],
    [500, 'Internal Server Error'],
  ])('logs HTTP %s without showing a notice', async (status, statusText) => {
    const response = createResponse(status, 'VIN:ignored:Should not be shown', statusText);
    const showWarning = vi.fn();
    const logError = vi.fn();

    await loadVinNotice({
      url: 'https://cdn.example/vin.txt',
      fetchImpl: vi.fn(async () => response),
      storage: createStorage(),
      showWarning,
      logError,
    });

    expect(response.text).not.toHaveBeenCalled();
    expect(showWarning).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledOnce();
    expect(logError).toHaveBeenCalledWith(
      `[VIN] https://cdn.example/vin.txt responded with HTTP ${status} ${statusText}`,
    );
  });

  it('silently ignores network failures', async () => {
    const showWarning = vi.fn();
    const logError = vi.fn();

    await expect(loadVinNotice({
      url: 'https://cdn.example/vin.txt',
      fetchImpl: vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
      storage: createStorage(),
      showWarning,
      logError,
    })).resolves.toBeUndefined();

    expect(showWarning).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });

  it('silently ignores response body read failures', async () => {
    const showWarning = vi.fn();
    const logError = vi.fn();

    await expect(loadVinNotice({
      url: 'https://cdn.example/vin.txt',
      fetchImpl: vi.fn(async () => ({
        status: 200,
        statusText: 'OK',
        text: vi.fn(async () => {
          throw new Error('body stream failed');
        }),
      })),
      storage: createStorage(),
      showWarning,
      logError,
    })).resolves.toBeUndefined();

    expect(showWarning).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });

  it('suppresses a notice whose stable ID has already been read', async () => {
    const showWarning = vi.fn();

    await loadVinNotice({
      url: 'https://cdn.example/vin.txt',
      fetchImpl: vi.fn(async () => createResponse(200, 'VIN:maintenance-1:Updated message')),
      storage: createStorage('["maintenance-1"]'),
      showWarning,
      logError: vi.fn(),
    });

    expect(showWarning).not.toHaveBeenCalled();
  });

  it('treats malformed storage as empty and replaces it after dismissal', async () => {
    const storage = createStorage('{not-json');
    const showWarning = vi.fn();

    await loadVinNotice({
      url: 'https://cdn.example/vin.txt',
      fetchImpl: vi.fn(async () => createResponse(200, 'VIN:new-id:New notice')),
      storage,
      showWarning,
      logError: vi.fn(),
    });

    showWarning.mock.calls[0][1].onDismiss();

    expect(storage.setItem).toHaveBeenCalledWith('RanklandVinReadIds', '["new-id"]');
  });

  it('keeps unavailable storage failures silent', async () => {
    const showWarning = vi.fn();
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('storage blocked');
      }),
      setItem: vi.fn(() => {
        throw new Error('storage blocked');
      }),
    };

    await loadVinNotice({
      url: 'https://cdn.example/vin.txt',
      fetchImpl: vi.fn(async () => createResponse(200, 'VIN:new-id:New notice')),
      storage,
      showWarning,
      logError: vi.fn(),
    });

    expect(() => showWarning.mock.calls[0][1].onDismiss()).not.toThrow();
  });
});

function createResponse(status: number, content: string, statusText = '') {
  return {
    status,
    statusText,
    text: vi.fn(async () => content),
  };
}

function createStorage(initialValue: string | null = null) {
  let value = initialValue;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, nextValue: string) => {
      value = nextValue;
    }),
  };
}
