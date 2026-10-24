export enum ErrCode {
  /** 未捕获异常 */
  SystemError = -1,
  /** 非法请求 */
  IllegalRequest = -2,
  /** 非法参数 */
  IllegalParameters = -3,
  /** 未授权 */
  Unauthorized = -4,
  /** 无效的授权信息 */
  InvalidAuthInfo = -5,

  // Contest
  ContestExisted = 100000,
  ContestNotFound = 100001,
  ContestUserNotFound = 100002,
  ContestEventInvalidBatch = 100003,
  ContestEventProducerLocked = 100004,
  ContestEventIdGap = 100005,
  ContestEventIdConflict = 100006,
  ContestEventStreamRevisionMismatch = 100007,
  ContestFinalized = 100008,
  ContestFinalizationIncomplete = 100009,
  ContestFinalizationInvalidData = 100010,

  // File
  FileNotFound = 101000,
  FileInvalidName = 101001,
  FileUploadTooLarge = 101002,
  FileUploadAccessDenied = 101003,
  FileUploadUnavailable = 101004,
  FileReferencedByFinalizedContest = 101005,
  FileUploadUnknown = 101099,

  // Collection
  CollectionExisted = 102000,
  CollectionNotFound = 102001,
}
