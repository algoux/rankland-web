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
  [ErrCode.ContestFinalized]: '比赛已完结，不能修改榜单数据',
  [ErrCode.ContestFinalizationIncomplete]: '仍有未完成判题的提交，不能确认完结',
  [ErrCode.ContestFinalizationInvalidData]: '比赛数据不完整或不一致，不能生成最终榜单',

  // File
  [ErrCode.FileNotFound]: '该文件未找到',
  [ErrCode.FileInvalidName]: '文件名非法',
  [ErrCode.FileUploadTooLarge]: '上传文件过大',
  [ErrCode.FileUploadAccessDenied]: '文件上传被存储服务拒绝',
  [ErrCode.FileUploadUnavailable]: '文件存储服务暂不可用',
  [ErrCode.FileReferencedByFinalizedContest]: '文件被已完结比赛引用，不能删除',
  [ErrCode.FileUploadUnknown]: '文件上传失败',

  // Collection
  [ErrCode.CollectionExisted]: '该合集已存在',
  [ErrCode.CollectionNotFound]: '该合集未找到',
});
