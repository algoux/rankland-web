import { registerErrCodeConfigs } from '@server/err-code-configs';
import { ErrCode } from '@common/enums/err-code.enum';

registerErrCodeConfigs({
  [ErrCode.SystemError]: '系统异常，请稍后再试',
  [ErrCode.IllegalRequest]: '非法请求',
  [ErrCode.IllegalParameters]: '非法参数',

  // LiveContest
  [ErrCode.LiveContestExisted]: '该比赛已存在',
  [ErrCode.LiveContestNotFound]: '该比赛未找到',
});
