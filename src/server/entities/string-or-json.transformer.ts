import type { ValueTransformer } from 'typeorm';

export const stringOrJsonTransformer: ValueTransformer = {
  to(value) {
    if (value === undefined || value === null || typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  },
  from(value) {
    if (typeof value !== 'string' || (value[0] !== '"' && value[0] !== '{')) {
      return value;
    }

    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'string' || (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed))) {
        return parsed;
      }
    } catch {
      return value;
    }

    return value;
  },
};
