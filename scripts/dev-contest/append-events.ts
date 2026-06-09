#!/usr/bin/env -S npx tsx

import {
  rankland_live_contest_producer,
} from '@common/proto/rankland_live_contest';
import { contestPath } from './config';
import { getFixtureEvents } from './fixtures';
import { printApiConfig, producerHeaders, requestApi } from './http';

type SendFormat = 'json' | 'protobuf';

// Change this constant to 'protobuf' to send application/x-protobuf instead of JSON.
const SEND_FORMAT: SendFormat = 'json';
// const SEND_FORMAT: SendFormat = 'protobuf';

type AppendEventsResponse = {
  acceptedEventIds: number[];
  duplicateEventIds: number[];
  lastEventId: number;
  expectedNextEventId: number;
  streamRevision: number;
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
  const { revision, startIndex, endIndex } = parseArgs(process.argv.slice(2));
  const fullEvents = getFixtureEvents(revision);
  const selectedEvents = fullEvents.slice(startIndex, endIndex);
  if (selectedEvents.length === 0) {
    throw new Error(`Selected fixture slice is empty: [${startIndex}, ${endIndex})`);
  }

  printApiConfig();
  console.log(`send format: ${SEND_FORMAT}`);
  console.log(`fixture revision: ${revision}`);
  console.log(`fixture slice: [${startIndex}, ${endIndex})`);
  console.log(`event ids: ${selectedEvents.map((event) => event.eventId).join(', ')}`);

  const result = SEND_FORMAT === 'protobuf'
    ? await appendProtobuf(revision, selectedEvents)
    : await appendJson(revision, selectedEvents);

  console.log('append result:', result);
}

async function appendJson(
  streamRevision: number,
  events: rankland_live_contest_producer.IProducerEvent[],
): Promise<AppendEventsResponse> {
  return requestApi<AppendEventsResponse>('POST', contestPath('/events'), {
    streamRevision,
    events,
  }, producerHeaders());
}

async function appendProtobuf(
  streamRevision: number,
  events: rankland_live_contest_producer.IProducerEvent[],
): Promise<AppendEventsResponse> {
  const bytes = rankland_live_contest_producer.BatchProducerEvent.encode({
    streamRevision,
    events,
  }).finish();
  return requestApi<AppendEventsResponse>('POST', contestPath('/events'), Buffer.from(bytes), {
    ...producerHeaders(),
    'Content-Type': 'application/x-protobuf',
  });
}

function parseArgs(args: string[]): { revision: number; startIndex: number; endIndex: number } {
  if (!args[0]) {
    printUsage();
    throw new Error('Missing required revision argument');
  }

  const revision = parsePositiveInt(args[0], 'revision');
  const fullEvents = getFixtureEvents(revision);
  const startIndex = args[1] === undefined ? 0 : parseNonNegativeInt(args[1], 'start_index');
  const endIndex = args[2] === undefined ? fullEvents.length : parseNonNegativeInt(args[2], 'end_index');

  if (startIndex > endIndex) {
    throw new Error(`start_index must be <= end_index; got ${startIndex} > ${endIndex}`);
  }
  if (endIndex > fullEvents.length) {
    throw new Error(`end_index ${endIndex} exceeds fixture length ${fullEvents.length}`);
  }

  return { revision, startIndex, endIndex };
}

function parsePositiveInt(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function parseNonNegativeInt(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return parsed;
}

function printUsage(): void {
  console.log(`Usage:
  AUTH_TOKEN=dev-token scripts/dev-contest/append-events.ts <revision> [start_index] [end_index]

Examples:
  # Send fixture revision 1, event indexes [0, 4)
  AUTH_TOKEN=dev-token scripts/dev-contest/append-events.ts 1 0 4

  # Then send the next slice [4, 8)
  AUTH_TOKEN=dev-token scripts/dev-contest/append-events.ts 1 4 8

Notes:
  - start_index is 0-based and end_index is exclusive, matching Array.slice().
  - The server still enforces event-id continuity and solution references.
  - After drop-events, use the next stream revision fixture, for example revision 2.`);
}
