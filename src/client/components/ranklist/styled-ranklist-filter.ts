import type * as srk from '@algoux/standard-ranklist';

export function isOfficialParticipant(user: srk.User | undefined): boolean {
  return !!user && user.official !== false;
}
