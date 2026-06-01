import type { ValueTransformer } from 'typeorm';

export const nullableOutputTransformer: ValueTransformer = {
  to(value) {
    return value === undefined ? null : value;
  },
  from(value) {
    return value === null ? undefined : value;
  },
};
