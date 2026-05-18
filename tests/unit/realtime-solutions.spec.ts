import { describe, expect, it } from 'vitest';
import { parseRealtimeSolutionBuffer } from '@client/modules/live/realtime-solutions';

function bytes(text: string) {
  return Array.from(new TextEncoder().encode(text));
}

function makeRealtimeSolutionBuffer() {
  const fields = [
    [0, 0, 0, 0, 0, 0, 0, 7],
    bytes('A'),
    bytes('team-alpha'),
    bytes('AC'),
    [2],
  ];
  const header = [fields.length, ...fields.map((field) => field.length)];
  return new Uint8Array([...header, ...fields.flat()]).buffer;
}

describe('parseRealtimeSolutionBuffer', () => {
  it('parses live scroll-solution binary payloads', () => {
    const solution = parseRealtimeSolutionBuffer(makeRealtimeSolutionBuffer());

    expect(solution.id.toString()).toBe('7');
    expect(solution.problemAlias).toBe('A');
    expect(solution.userId).toBe('team-alpha');
    expect(solution.result).toBe('AC');
    expect(solution.solved).toBe(2);
  });
});
