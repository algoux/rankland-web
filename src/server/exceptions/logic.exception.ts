import { Exception } from 'bwcx-ljsm';
import type { ErrCode } from '@common/enums/err-code.enum';

export default class LogicException extends Exception {
  public code: ErrCode;

  public constructor(code: ErrCode, detailMessage?: string) {
    super(detailMessage || `Logic err with code ${code}`);
    this.name = 'LogicException';
    this.code = code;
  }
}
