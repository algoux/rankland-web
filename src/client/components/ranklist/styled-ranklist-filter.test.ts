import { describe, expect, it } from 'vitest';
import { isOfficialParticipant } from './styled-ranklist-filter';

describe('styled ranklist filters', () => {
  it('treats users as official unless official is explicitly false', () => {
    expect(isOfficialParticipant({ id: 'implicit-official', name: 'Implicit Official' })).toBe(true);
    expect(isOfficialParticipant({ id: 'official', name: 'Official', official: true })).toBe(true);
    expect(isOfficialParticipant({ id: 'unofficial', name: 'Unofficial', official: false })).toBe(false);
    expect(isOfficialParticipant(undefined)).toBe(false);
  });
});
