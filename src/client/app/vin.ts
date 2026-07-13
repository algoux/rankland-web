import { LocalStorageKey } from './local-storage-key.config';

export interface VinNotice {
  id: string;
  message: string;
}

export interface VinFetchResponse {
  status: number;
  statusText: string;
  text: () => Promise<string>;
}

export interface VinStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export interface VinToastOptions {
  id: string;
  duration: number;
  closeButton: true;
  onDismiss: () => void;
}

export interface LoadVinNoticeOptions {
  url: string;
  fetchImpl: (url: string) => Promise<VinFetchResponse>;
  storage?: VinStorage;
  showWarning: (message: string, options: VinToastOptions) => unknown;
  logError: (message: string) => void;
}

const VIN_PATTERN = /^VIN:([^:\r\n]+):([\s\S]+)$/;

export function parseVinNotice(content: string): VinNotice | undefined {
  const match = VIN_PATTERN.exec(content.trim());
  if (!match) {
    return undefined;
  }

  const id = match[1].trim();
  const message = match[2].trim();
  if (!id || !message) {
    return undefined;
  }

  return { id, message };
}

export async function loadVinNotice(options: LoadVinNoticeOptions): Promise<void> {
  let response: VinFetchResponse;
  try {
    response = await options.fetchImpl(options.url);
  } catch {
    return;
  }
  if (response.status === 404) {
    return;
  }
  if (response.status >= 400) {
    const statusText = response.statusText.trim();
    options.logError(
      `[VIN] ${options.url} responded with HTTP ${response.status}${statusText ? ` ${statusText}` : ''}`,
    );
    return;
  }
  let content: string;
  try {
    content = await response.text();
  } catch {
    return;
  }
  const notice = parseVinNotice(content);
  if (!notice || readVinIds(options.storage).includes(notice.id)) {
    return;
  }

  options.showWarning(notice.message, {
    id: `rankland-vin:${notice.id}`,
    duration: Infinity,
    closeButton: true,
    onDismiss: () => markVinAsRead(notice.id, options.storage),
  });
}

function readVinIds(storage?: VinStorage): string[] {
  if (!storage) {
    return [];
  }

  try {
    const value = storage.getItem(LocalStorageKey.VinReadIds);
    if (!value) {
      return [];
    }
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return [...new Set(parsed.filter((item): item is string => typeof item === 'string'))];
  } catch {
    return [];
  }
}

function markVinAsRead(id: string, storage?: VinStorage) {
  if (!storage) {
    return;
  }

  try {
    const readIds = readVinIds(storage);
    storage.setItem(LocalStorageKey.VinReadIds, JSON.stringify([...new Set([...readIds, id])]));
  } catch {
    // Ignore unavailable or blocked localStorage.
  }
}
