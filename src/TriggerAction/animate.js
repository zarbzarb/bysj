/* eslint-disable no-throw-literal */
import { visiableToggleHandler } from '@/EventHandlers/AnimateEvent';
import $ from 'jquery';
import _ from 'lodash';
import { addAnimate, stopAnimation } from '@/components/commons/AnimationComponents/TriggerAnimation';

let timer = null;
let currentAnimationObj;

const compatible = (key) => {
  let selector = `[data-key="${key}"]`;
  if ($(selector).length > 0) {
    return selector;
  }
  selector = `[data-key="@com_${key}"]`;
  if ($(selector).length > 0) {
    return selector;
  }
  return selector;
};

export default (action, settings) => {
  const { config } = settings;
  const { isPC } = config;
  action = _.cloneDeep(action);
  const { actionType } = action;
  action.settings = action.actionSettings;
  if (!action.associatComponents) {
    return console.error('没有关联组件需要执行动画');
  }
  stopAnimation(currentAnimationObj);
  if (actionType === 'visiableToggle') {
    visiableToggleHandler(action);
    return;
  }
  const key = action.associatComponents;
  const selector = compatible(key);
  if ($(selector).length === 0) return console.error(selector, '没有对应的组件或者表达式');
  const animateObj = addAnimate(
    {
      key: action.associatComponents,
    },
    action,
    isPC,
  );
  setTimeout(() => {
    animateObj.start();
  }, 0);
  currentAnimationObj = animateObj;
  clearTimeout(timer);
  if (!window.DataI.isConfigPage()) {
    return;
  }
  timer = setTimeout(() => {
    animateObj.resetStartPosition();
  }, 5000);
};
