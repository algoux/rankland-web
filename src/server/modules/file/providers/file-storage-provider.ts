export interface FileStorageUploadInput {
  path: string;
  body: Buffer;
  contentType: string;
  size: number;
}

export interface FileStorageProvider {
  upload: (input: FileStorageUploadInput) => Promise<void>;
}

export type FileStorageProviderErrorKind = 'access_denied' | 'unavailable' | 'unknown';

export class FileStorageProviderError extends Error {
  public constructor(public readonly kind: FileStorageProviderErrorKind, public readonly cause?: unknown) {
    super(`File storage provider failed: ${kind}`);
    this.name = 'FileStorageProviderError';
  }
}
