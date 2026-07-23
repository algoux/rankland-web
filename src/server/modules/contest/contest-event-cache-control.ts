export type ContestEventCacheControl =
  | { type: 'delete'; contestId: string; canonicalUk: string }
  | {
      type: 'metadata';
      contestId: string;
      canonicalUk: string;
      visibilityFingerprint: string;
    };
