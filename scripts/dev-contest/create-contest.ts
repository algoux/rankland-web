#!/usr/bin/env -S npx tsx

import { ErrCode } from '@common/enums/err-code.enum';
import { apiPath, CONTEST_UK } from './config';
import { contestFixture } from './fixtures';
import { authHeaders, DevApiError, printApiConfig, requestApi } from './http';

type CreateContestResponse = { _id: string };

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
  console.log(`contest uk: ${CONTEST_UK}`);

  try {
    const result = await requestApi<CreateContestResponse>('POST', apiPath('/contests'), contestFixture, authHeaders());
    console.log('created contest:', result);
    return;
  } catch (error) {
    if (!(error instanceof DevApiError) || error.code !== ErrCode.ContestExisted) {
      throw error;
    }
  }

  const { uk: _uk, ...updateBody } = contestFixture;
  await requestApi<null>('POST', apiPath(`/contests/${encodeURIComponent(CONTEST_UK)}`), updateBody, authHeaders());
  console.log('contest already existed; updated fixture data');
}

function printUsage(): void {
  console.log(`Usage:
  AUTH_TOKEN=dev-token scripts/dev-contest/create-contest.ts

Environment:
  DEV_SERVER_URL=http://127.0.0.1:3000
  DEV_CONTEST_UK=${CONTEST_UK}
  AUTH_TOKEN=dev-token

Behavior:
  Creates the fixture contest if missing. If it already exists, updates contest/problems/users/markers through the normal API.`);
}
