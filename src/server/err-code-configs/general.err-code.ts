import { registerErrCodeConfigs } from '@server/err-code-configs';
import { ErrCode } from '@common/enums/err-code.enum';

registerErrCodeConfigs({
  [ErrCode.SystemError]: '系统异常，请稍后再试',
  [ErrCode.IllegalRequest]: '非法请求',
  [ErrCode.IllegalParameters]: '非法参数',
  [ErrCode.Unauthorized]: '未授权的操作',
  [ErrCode.InvalidAuthInfo]: '未能授权，因为提供的信息错误',

  // Contest
  [ErrCode.ContestExisted]: '该比赛已存在',
  [ErrCode.ContestNotFound]: '该比赛未找到',
  [ErrCode.ContestUserNotFound]: '该比赛用户未找到',
  [ErrCode.ContestEventInvalidBatch]: '事件批次非法',
  [ErrCode.ContestEventProducerLocked]: '事件流已被其他生产者锁定',
  [ErrCode.ContestEventIdGap]: '事件 ID 不连续',
  [ErrCode.ContestEventIdConflict]: '事件 ID 已存在但内容不一致',
  [ErrCode.ContestEventStreamRevisionMismatch]: '事件流版本不匹配',
});
