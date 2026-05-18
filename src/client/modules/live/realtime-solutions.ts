import Long from 'long';
import type { IApiLiveScrollSolution } from '@common/rankland-api';

export function parseRealtimeSolutionBuffer(data: ArrayBuffer): IApiLiveScrollSolution {
  const dataView = new DataView(data);
  const fieldCount = dataView.getInt8(0);
  const fieldLengths: number[] = [];

  for (let index = 1; index <= fieldCount; index += 1) {
    fieldLengths.push(dataView.getInt8(index));
  }

  let start = fieldCount + 1;
  const textDecoder = new TextDecoder();
  const fields: ArrayBuffer[] = [];

  for (const fieldLength of fieldLengths) {
    fields.push(data.slice(start, start + fieldLength));
    start += fieldLength;
  }

  return {
    id: Long.fromBytes(Array.from(new Uint8Array(fields[0]))),
    problemAlias: textDecoder.decode(fields[1]),
    userId: textDecoder.decode(fields[2]),
    result: textDecoder.decode(fields[3]) as IApiLiveScrollSolution['result'],
    solved: new DataView(fields[4]).getInt8(0),
  };
}
