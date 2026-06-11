/**
 * 函数参数类型定义
 */

export type CompListenVariableLog = {
  actionType: string;
  action: string;
  el: AntdComp.InstanceType;
  variableName?: string;
  variable?: string;
  result?: string;
  resultType?: string;
};
