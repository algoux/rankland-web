export class RanklandApiException extends Error {
  public readonly code: number;

  public constructor(code: number, message: string) {
    super(`RankLand API request failed with code ${code}: ${message}`);
    this.name = 'RanklandApiException';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    // @ts-ignore
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class RanklandHttpException extends Error {
  public readonly status: number;

  public constructor(status: number, statusText: string) {
    super(`RankLand HTTP request failed: ${status} ${statusText}`);
    this.name = 'RanklandHttpException';
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
    // @ts-ignore
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export enum RanklandLogicExceptionKind {
  NotFound = 'NotFound',
}

export class RanklandLogicException extends Error {
  public readonly kind: RanklandLogicExceptionKind;

  public constructor(kind: RanklandLogicExceptionKind) {
    super(`RankLand logic exception: ${kind}`);
    this.name = 'RanklandLogicException';
    this.kind = kind;
    Object.setPrototypeOf(this, new.target.prototype);
    // @ts-ignore
    Error.captureStackTrace?.(this, this.constructor);
  }
}
