/**
 * 属性配置中的数据类型
 */

// 编辑参数项
export type paramType = {
  // 唯一标识
  key?: string | number;
  // 参数项
  paramItemId?: string | number;
  paramName?: string;
  // 更新方式: 1-手动输入, 2-组件数据, 3-变量, 4-交互传入值
  updateType?: number;
  // 手动输入的值
  inputVal?: string;
  // 选择的组件
  compKey?: string;
  // v8.5.1 是否选中值 0:默认数据， 1：当前选中值
  isSelected?: number;
  // 组件选中的数据项
  compDataItem?: string;
  // 组件数据项列表
  compDataItemOptions?: any[];
  // 交互传入值
  interactDataItem?: string;
  // 交互传入值选项列表
  interactDataItemOptions?: any[];
  // 变量
  variableKey?: string;
  // 是否数据格式转换 0：不需要转，1：旧格式需要转，2： 转后正确
  dataSwitch?: number;
  dataSwitchContent?: {
    code: string;
    dimensionMap: any[];
  };
  expression?: string;
  mapValName?: string;
  tipMsg?: string;
};
