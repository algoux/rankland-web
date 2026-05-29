import {
  ContestEventResponseFormat,
  negotiateContestEventResponseFormat,
} from '../contest-event-response';

describe('contest event response negotiation', () => {
  it('defaults to protobuf when Accept is missing or wildcard-only', () => {
    expect(negotiateContestEventResponseFormat(undefined)).toBe(ContestEventResponseFormat.Protobuf);
    expect(negotiateContestEventResponseFormat('*/*')).toBe(ContestEventResponseFormat.Protobuf);
    expect(negotiateContestEventResponseFormat('application/*')).toBe(ContestEventResponseFormat.Protobuf);
  });

  it('uses json only when application/json outranks protobuf', () => {
    expect(negotiateContestEventResponseFormat('application/json')).toBe(ContestEventResponseFormat.Json);
    expect(
      negotiateContestEventResponseFormat('application/json;q=0.9, application/protobuf;q=0.5'),
    ).toBe(ContestEventResponseFormat.Json);
  });

  it('prefers protobuf over json on equal priority', () => {
    expect(
      negotiateContestEventResponseFormat('application/json;q=0.8, application/x-protobuf;q=0.8'),
    ).toBe(ContestEventResponseFormat.Protobuf);
  });

  it('rejects unsupported accept types', () => {
    expect(negotiateContestEventResponseFormat('application/octet-stream')).toBe(
      ContestEventResponseFormat.Unsupported,
    );
  });
});
