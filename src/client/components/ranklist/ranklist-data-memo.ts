import type * as srk from '@algoux/standard-ranklist';

const VOLATILE_RANKLIST_KEYS = new Set(['_now']);

type RanklistPayload = srk.Ranklist & Record<string, unknown>;

export function toRanklistPayloadWithoutVolatileFields(data: srk.Ranklist): srk.Ranklist {
  const payload = data as RanklistPayload;
  const hasVolatileFields = Object.keys(payload).some((key) => VOLATILE_RANKLIST_KEYS.has(key));
  if (!hasVolatileFields) {
    return data;
  }

  const nextPayload: RanklistPayload = { ...payload };
  VOLATILE_RANKLIST_KEYS.forEach((key) => {
    delete nextPayload[key];
  });
  return nextPayload as srk.Ranklist;
}

export function hasRanklistPayloadReferenceChange(
  previous: srk.Ranklist | null | undefined,
  next: srk.Ranklist | null | undefined,
) {
  if (previous === next) {
    return false;
  }
  if (!previous || !next) {
    return true;
  }

  const previousPayload = previous as RanklistPayload;
  const nextPayload = next as RanklistPayload;
  const previousKeys = getStableRanklistKeys(previousPayload);
  const nextKeys = getStableRanklistKeys(nextPayload);

  if (previousKeys.length !== nextKeys.length) {
    return true;
  }

  return previousKeys.some((key) => (
    !Object.prototype.hasOwnProperty.call(nextPayload, key)
    || previousPayload[key] !== nextPayload[key]
  ));
}

function getStableRanklistKeys(payload: RanklistPayload) {
  return Object.keys(payload).filter((key) => !VOLATILE_RANKLIST_KEYS.has(key));
}
