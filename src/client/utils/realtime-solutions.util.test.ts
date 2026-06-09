import Long from 'long';
import { describe, expect, it } from 'vitest';
import { parseRealtimeSolutionBuffer } from './realtime-solutions.util';

function createRealtimeSolutionBuffer() {
  const idBytes = Uint8Array.from(Long.fromNumber(123).toBytes());
  const problemBytes = new TextEncoder().encode('A');
  const userBytes = new TextEncoder().encode('alice');
  const resultBytes = new TextEncoder().encode('FB');
  const solvedBytes = Uint8Array.from([3]);
  const fields = [idBytes, problemBytes, userBytes, resultBytes, solvedBytes];
  const header = Uint8Array.from([fields.length, ...fields.map((field) => field.byteLength)]);
  const bodyLength = fields.reduce((total, field) => total + field.byteLength, 0);
  const bytes = new Uint8Array(header.byteLength + bodyLength);
  bytes.set(header, 0);
  let offset = header.byteLength;
  for (const field of fields) {
    bytes.set(field, offset);
    offset += field.byteLength;
  }
  return bytes.buffer;
}

describe('parseRealtimeSolutionBuffer', () => {
  it('decodes the source-compatible realtime solution binary format', () => {
    const solution = parseRealtimeSolutionBuffer(createRealtimeSolutionBuffer());

    expect(solution.id.toString()).toBe('123');
    expect(solution).toMatchObject({
      problemAlias: 'A',
      userId: 'alice',
      result: 'FB',
      solved: 3,
    });
  });
});
