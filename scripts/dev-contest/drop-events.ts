#!/usr/bin/env -S npx tsx

import { contestPath } from './config';
import { authHeaders, printApiConfig, requestApi } from './http';

type StreamState = {
  contestId: string;
  uk: string;
  lastEventId: number;
  streamRevision: number;
  producerId?: string | null;
};

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main(): Promise<void> {
  printApiConfig();
  await requestApi<null>('POST', contestPath('/events/reset'), {}, authHeaders());
  const stream = await requestApi<StreamState>('GET', contestPath('/stream'), undefined, authHeaders());
  console.log('events reset; current stream:', stream);
}

function printUsage(): void {
  console.log(`Usage:
  AUTH_TOKEN=dev-token scripts/dev-contest/drop-events.ts

Behavior:
  Calls POST /api/v2/contests/:uk/events/reset through the dev server.
  Historical contest_event rows are retained by the service; streamRevision increments and lastEventId resets to 0.`);
}
