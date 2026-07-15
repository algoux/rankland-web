import type { ValueTransformer } from 'typeorm';

const jsonNullSentinel = Object.freeze({
  toJSON: () => null,
});

/**
 * TypeORM's MySQL driver returns JS null before applying JSON.stringify,
 * which would write SQL NULL into a NOT NULL JSON column. The sentinel is
 * stringified by the driver as the JSON literal null instead.
 */
export const mysqlJsonValueTransformer: ValueTransformer = {
  to(value: unknown): unknown {
    return value === null ? jsonNullSentinel : value;
  },
  from(value: unknown): unknown {
    return value;
  },
};
