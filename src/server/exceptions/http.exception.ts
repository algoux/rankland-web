import { Exception } from 'bwcx-ljsm';

export default class HttpException extends Exception {
  public code: number;
  public readonly headers: Readonly<Record<string, string>>;

  public constructor(code: number, headers: Readonly<Record<string, string>> = {}) {
    super(`HttpException with code ${code}`);
    this.name = 'HttpException';
    this.code = code;
    this.headers = Object.freeze({ ...headers });
  }
}
