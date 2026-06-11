/** 登记组件特定动作登记
 *
 * ## Doc Action
 *
 * `ctrl` + 点击组件名称可以跳转到对应实现
 */
export const COMPONENT_SPECIAL_ACTIONS = {
  // 表格
  Table: [
    { label: '播放轮播选中行', value: 'playCarouseSelectLine' },
    { label: '暂停轮播选中行', value: 'pauseCarouseSelectLine' },
    { label: '播放动画', value: 'playAnimation' },
    { label: '暂停动画', value: 'pauseAnimation' },
    { label: '取消选中', value: 'clearSelect' },
  ],
  // 多按钮
  RadioTabs: [
    { label: '播放轮播选中', value: 'playCarouseSelectLine' },
    { label: '暂停轮播选中', value: 'pauseCarouseSelectLine' },
  ],
  // 自定义列表
  CustomList: [{ label: '取消选中', value: 'clearSelect' }],
  // 文本域
  Input: [{ label: '清空内容', value: 'clearInput' }],
  // 输入框
  NewInput: [{ label: '清空内容', value: 'clearInput' }],
  // 单选框
  Radio: [{ label: '取消选中', value: 'clearSelect' }],
  // 复选框
  CheckBox: [{ label: '取消选中', value: 'clearSelect' }],
  // 树形列表
  TreeList: [{ label: '取消选中', value: 'clearSelect' }],
  // 树形选择器
  TreeSelect: [{ label: '取消选中', value: 'clearSelect' }],
  // 下拉选择器
  Select: [{ label: '取消选中', value: 'clearSelect' }],
  // 时间选择器
  DatePicker: [{ label: '取消选中', value: 'clearSelect' }],
  // 时间轴
  TimeLine: [{ label: '重置时间', value: 'resetTime' }],
} as const;
