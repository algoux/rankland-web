export enum ErrCode {
  /** 未捕获异常 */
  SystemError = -1,
  /** 非法请求 */
  IllegalRequest = -2,
  /** 非法参数 */
  IllegalParameters = -3,

  // LiveContest
  LiveContestExisted = 100000,
  LiveContestNotFound = 100001,
}
