import Long from 'long';
import type { IApiLiveScrollSolution } from '@/services/ranklist-api';

export function parseRealtimeSolutionBuffer(data: ArrayBuffer): IApiLiveScrollSolution {
  const view = new DataView(data);
  const fieldCount = view.getInt8(0);
  const fieldLengths: number[] = [];
  for (let index = 1; index <= fieldCount; index += 1) {
    fieldLengths.push(view.getInt8(index));
  }

  let offset = fieldCount + 1;
  const fields = fieldLengths.map((length) => {
    const field = data.slice(offset, offset + length);
    offset += length;
    return field;
  });
  const decoder = new TextDecoder();
  const solvedView = new DataView(fields[4]);

  return {
    id: Long.fromBytes(Array.from(new Uint8Array(fields[0]))),
    problemAlias: decoder.decode(fields[1]),
    userId: decoder.decode(fields[2]),
    result: decoder.decode(fields[3]) as IApiLiveScrollSolution['result'],
    solved: solvedView.getInt8(0),
  };
}
