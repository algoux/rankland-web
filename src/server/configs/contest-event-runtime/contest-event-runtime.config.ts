import { Config } from 'bwcx-ljsm';

@Config()
export default class ContestEventRuntimeConfig {
  public readonly diagnosticsEnabled = parseBoolean('CONTEST_EVENT_RUNTIME_DIAGNOSTICS_ENABLED', false);
}

function parseBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const value = raw.trim().toLocaleLowerCase('en-US');
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new RangeError(`${name} must be true or false`);
}
