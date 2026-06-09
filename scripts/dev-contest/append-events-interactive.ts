#!/usr/bin/env -S npx tsx

import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { stdin as input, stdout as output } from 'process';
import { ErrCode } from '@common/enums/err-code.enum';
import { rankland_live_contest_producer } from '@common/proto/rankland_live_contest';
import { apiPath, CONTEST_UK, contestPath } from './config';
import { contestFixture } from './fixtures';
import { authHeaders, DevApiError, printApiConfig, producerHeaders, requestApi } from './http';

type ProducerEvent = rankland_live_contest_producer.IProducerEvent;

type AppendEventsResponse = {
  acceptedEventIds: number[];
  duplicateEventIds: number[];
  lastEventId: number;
  expectedNextEventId: number;
  streamRevision: number;
};

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
  const { fixturePath } = parseArgs(process.argv.slice(2));
  const events = await readEventFixture(fixturePath);
  const existingStream = await getExistingStream();

  printApiConfig();
  console.log(`contest uk: ${CONTEST_UK}`);
  console.log(`fixture file: ${fixturePath}`);
  console.log(`events loaded: ${events.length}`);
  console.log(`event ids: ${events.map((event) => event.eventId).join(', ')}`);

  if (existingStream) {
    await updateContestFixture();
    console.log('existing stream found:', existingStream);
    if (shouldResetExistingStream(existingStream)) {
      await resetEvents();
    } else {
      console.log('existing stream is empty revision 1; skip reset');
    }
  } else {
    await createContestFixture();
  }

  const stream = await getRequiredStream();
  console.log('current stream:', stream);

  await appendEventsOnEnter(stream.streamRevision, events);
}

async function createContestFixture(): Promise<void> {
  try {
    const result = await requestApi<{ _id: string }>('POST', apiPath('/contests'), contestFixture, authHeaders());
    console.log('created contest:', result);
  } catch (error) {
    if (!(error instanceof DevApiError) || error.code !== ErrCode.ContestExisted) {
      throw error;
    }
    await updateContestFixture();
  }
}

async function updateContestFixture(): Promise<void> {
  const { uk: _uk, ...updateBody } = contestFixture;
  await requestApi<null>('PATCH', apiPath(`/contests/${encodeURIComponent(CONTEST_UK)}`), updateBody, authHeaders());
  console.log('contest fixture updated');
}

async function getExistingStream(): Promise<StreamState | null> {
  try {
    return await requestApi<StreamState>('GET', contestPath('/event-stream'), undefined, authHeaders());
  } catch (error) {
    if (error instanceof DevApiError && error.code === ErrCode.ContestNotFound) {
      return null;
    }
    throw error;
  }
}

async function getRequiredStream(): Promise<StreamState> {
  return requestApi<StreamState>('GET', contestPath('/event-stream'), undefined, authHeaders());
}

async function resetEvents(): Promise<void> {
  await requestApi<null>('POST', contestPath('/events/reset'), {}, authHeaders());
  console.log('existing events reset');
}

function shouldResetExistingStream(stream: StreamState): boolean {
  return stream.streamRevision > 1 || stream.lastEventId > 0;
}

async function appendEventsOnEnter(streamRevision: number, events: ProducerEvent[]): Promise<void> {
  const rl = readline.createInterface({ input, output });
  try {
    for (let index = 0; index < events.length; index += 1) {
      const event = events[index];
      const line = await askQuestion(
        rl,
        `Press Enter to send ${index + 1}/${events.length} eventId=${event.eventId}; type q then Enter to quit: `,
      );
      if (isQuit(line)) {
        console.log('stopped before sending remaining events');
        return;
      }

      const result = await appendJson(streamRevision, event);
      console.log('append result:', result);
    }
    console.log('all fixture events sent');
  } finally {
    rl.close();
  }
}

async function appendJson(streamRevision: number, event: ProducerEvent): Promise<AppendEventsResponse> {
  return requestApi<AppendEventsResponse>('POST', contestPath('/events'), {
    streamRevision,
    events: [event],
  }, producerHeaders());
}

async function readEventFixture(fixturePath: string): Promise<ProducerEvent[]> {
  const resolvedPath = path.resolve(process.cwd(), fixturePath);
  const raw = await fs.readFile(resolvedPath, 'utf8');
  const parsed = JSON.parse(raw);
  const events = Array.isArray(parsed) ? parsed : parsed?.events;
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error('Event fixture must be a non-empty array or an object with a non-empty events array');
  }
  for (const [index, event] of events.entries()) {
    if (!event || typeof event !== 'object' || !Number.isInteger(event.eventId)) {
      throw new Error(`Invalid event at index ${index}: eventId must be an integer`);
    }
  }
  return events;
}

function parseArgs(args: string[]): { fixturePath: string } {
  if (!args[0]) {
    printUsage();
    throw new Error('Missing required event_fixture_json argument');
  }
  return {
    fixturePath: args[0],
  };
}

function isQuit(line: string): boolean {
  const value = line.trim().toLowerCase();
  return value === 'q' || value === 'quit' || value === 'exit';
}

function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function printUsage(): void {
  console.log(`Usage:
  AUTH_TOKEN=dev-token scripts/dev-contest/append-events-interactive.ts <event_fixture.json>

Examples:
  AUTH_TOKEN=dev-token scripts/dev-contest/append-events-interactive.ts scripts/dev-contest/event-fixtures/02-close-chase-ranking-series.json

Fixture shape:
  Either a ProducerEvent array:
    [{ "eventId": 1, "type": "NEW_SOLUTION", "newSolutionData": { ... } }]
  Or an object with an events array:
    { "events": [{ "eventId": 1, "type": "NEW_SOLUTION", "newSolutionData": { ... } }] }

Behavior:
  Ensures the fixed dev contest fixture exists.
  If an event stream has existing events or revision history, resets events first.
  Uses the current server streamRevision after create/reset.
  Sends one event per Enter keypress through POST /api/v2/contests/:uk/events.`);
}
