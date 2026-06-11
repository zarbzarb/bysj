import { type COMPONENT_SPECIAL_ACTIONS } from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/ComSpecialAction/constant';

// 重新渲染组件
const render = (triggerComp) => {
  if (triggerComp.classType === 'antd') {
    triggerComp.refresh();
  } else if (triggerComp.classType === 'com') {
    triggerComp.instance.render();
  }
};

/** 登记组件特定实现
 *
 * ## Doc Action
 *
 * `ctrl` + 点击组件名称可以跳转到对应登记
 *
 * ## New
 *
 * - `com`: 对应组件
 * - `actionParam`: 对应触发事件
 *
 * 每次事件执行时执行
 */
export const ActionHandlerMap = {
  Table: (com, actionParam) => {
    const { props } = com;

    const isRepeat =
      (actionParam === 'pauseCarouseSelectLine' && !props.tbody.carouselChecked) ||
      (actionParam === 'pauseAnimation' && !props.dynamicScroll.scroll);

    // 播放轮播选中行
    if (actionParam === 'playCarouseSelectLine') props.tbody.carouselChecked = true;

    // 暂停轮播选中行
    if (actionParam === 'pauseCarouseSelectLine') props.tbody.carouselChecked = false;

    // 播放动画
    if (actionParam === 'playAnimation') props.dynamicScroll.scroll = true;

    // 暂停动画
    if (actionParam === 'pauseAnimation') props.dynamicScroll.scroll = false;

    // 当已经为false时，就不需要进行render了
    if (!isRepeat) render(com);
  },

  RadioTabs: (com, actionParam) => {
    const { props } = com;

    const isRepeat = actionParam === 'pauseCarouseSelectLine' && !props.isLoop;

    // 播放轮播选中行
    if (actionParam === 'playCarouseSelectLine') props.isLoop = true;

    // 暂停轮播选中行
    if (actionParam === 'pauseCarouseSelectLine') props.isLoop = false;

    // 当已经为false时，就不需要进行render了
    if (!isRepeat) render(com);
  },

  CustomList: (com, actionParam) => {
    const ref = com.compRef;

    // 取消选中
    if (actionParam === 'clearSelect') ref.current?.clearSelect();
  },

  Radio: (com, actionParam) => {
    const ref = com.compRef;

    // 取消选中
    if (actionParam === 'clearSelect') ref.current?.clearSelect();
  },

  CheckBox: (com, actionParam) => {
    const ref = com.compRef;

    // 取消选中
    if (actionParam === 'clearSelect') ref.current?.clearSelect();
  },

  TreeList: (com, actionParam) => {
    const ref = com.compRef;

    // 取消选中
    if (actionParam === 'clearSelect') ref.current?.clearSelect();
  },

  TreeSelect: (com, actionParam) => {
    const ref = com.compRef;

    // 取消选中
    if (actionParam === 'clearSelect') ref.current?.clearSelect();
  },

  Select: (com, actionParam) => {
    const ref = com.compRef;

    // 取消选中
    if (actionParam === 'clearSelect') ref.current?.clearSelect();
  },

  DatePicker: (com, actionParam) => {
    const ref = com.compRef;

    // 取消选中
    if (actionParam === 'clearSelect') ref.current?.clearSelect();
  },

  Input: (com, actionParam) => {
    const ref = com.compRef;

    // 清空内容
    if (actionParam === 'clearInput') ref.current?.clearInput();
  },

  NewInput: (com, actionParam) => {
    const ref = com.compRef;

    // 清空内容
    if (actionParam === 'clearInput') ref.current?.clearInput();
  },

  TimeLine: (com, actionParam) => {
    const { instance } = com;

    // 重置时间
    if (actionParam === 'resetTime') instance.resetTime();
  },
} as const satisfies {
  -readonly [K in keyof typeof COMPONENT_SPECIAL_ACTIONS]: (
    com: any,
    actionParam: (typeof COMPONENT_SPECIAL_ACTIONS)[K][number]['value'],
  ) => void;
};
