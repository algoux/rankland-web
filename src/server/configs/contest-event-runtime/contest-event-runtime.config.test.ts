import { afterEach, describe, expect, it } from 'vitest';
import ContestEventRuntimeConfig from './contest-event-runtime.config';

const key = 'CONTEST_EVENT_RUNTIME_DIAGNOSTICS_ENABLED';
const original = process.env[key];

afterEach(() => {
  if (original === undefined) delete process.env[key];
  else process.env[key] = original;
});

describe('ContestEventRuntimeConfig', () => {
  it('keeps routine runtime diagnostics disabled by default', () => {
    delete process.env[key];

    expect(new ContestEventRuntimeConfig()).toMatchObject({
      diagnosticsEnabled: false,
    });
  });

  it('enables runtime diagnostics only through an explicit boolean environment value', () => {
    process.env[key] = 'true';
    expect(new ContestEventRuntimeConfig()).toMatchObject({
      diagnosticsEnabled: true,
    });

    process.env[key] = 'yes';
    expect(() => new ContestEventRuntimeConfig()).toThrow(/DIAGNOSTICS_ENABLED.*true.*false/i);
  });
});
