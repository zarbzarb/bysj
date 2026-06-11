import { get, post, postFormData, postFormUrlencoded } from '@/services/xhr/fetch';
import { getDataByKey, setStoreData } from '@/utils/dataStoreUtils';
import { passCurrentValueComps, compDataOptionValue, getChangeValue } from '@/utils/common';
// import { cloneDeep } from 'lodash';
import { babelTransform } from '@/utils/utils';
import { updateCompDataByJson } from '@/EventHandlers/AnimateEvent';

export const allTypesFetch = {
  get,
  post,
  postFormData,
  postFormUrlencoded,
};

export const stringToFun = (funS, dft) => {
  let fn;
  try {
    fn = new Function(
      'data',
      `
      try {
        ${funS}
      } catch (error) {
        console.error(error, '函数错误error');
        return (${dft})(data);
      }
    `,
    );
  } catch (error) {
    fn = new Function('data', 'return data');
    console.error(funS, error, '函数初始化调用失败------');
  }
  return fn;
};

const getComp = (key) => {
  return window.DataI.getComponentByKey(key);
};

const getExpDataByKey = (variable, expression) => {
  let data = getDataByKey(variable);
  if (!expression) return data;
  data = babelTransform(expression, data);
  return data;
};

/**
 * 获取编辑参数的值(数据来源)
 * @param {*} param 某行参数
 * @param {*} item 配置该交互的当前组件
 * @param {*} action 当前交互
 * @returns
 */
export const getParamValue = (param, item, action) => {
  let value;
  // v8.5.1 编辑参数 新增是否选中值isSelected
  const { compDataItem, updateType, compKey, isSelected = 1, dataSwitch, dataSwitchContent } = param;
  // console.log('param', param);
  // eslint-disable-next-line default-case
  switch (updateType) {
    case 1: {
      // 手动输入
      value = param.inputVal;
      break;
    }
    case 2: {
      // 组件数据
      if (compDataItem) {
        const selectedComp = getComp(compKey);

        if (selectedComp?.isPage) return null;

        const { type } = selectedComp ?? {};

        // eslint-disable-next-line unicorn/prefer-ternary
        if (type === 'Input' || type === 'NewInput' || (passCurrentValueComps.has(type) && isSelected === 1)) {
          // v8.5.1 选中值组件读取选中值
          value = getChangeValue(selectedComp, 2, compDataItem, action);
        } else {
          // 数据项
          value = compDataOptionValue(compKey, compDataItem, item, dataSwitch, dataSwitchContent);
        }
      } else {
        value = '';
      }
      break;
    }
    case 3: {
      // 变量
      value = param.variableKey ? getExpDataByKey(param.variableKey, param.expression) : '';
      break;
    }
    case 4: {
      // 交互传入值
      // eslint-disable-next-line unicorn/prefer-ternary
      if (!param.interactDataItem || !item) {
        value = '';
      } else {
        value = getChangeValue(item, 4, param.interactDataItem, action);
      }
      break;
    }
    default: {
      break;
    }
  }
  return value;
};

export const receiveMessage = (e, event, item, cb) => {
  // console.log('receiveMessage', e);
  if (event.isOrigin === 1) {
    const originStr = getParamValue(event.originUrl[0], item, {}); // 获取数据来源的值
    if (!originStr || originStr.indexOf(e.origin) === -1) return console.warn('来源地址不匹配');
  }
  const data = e.data;
  event.groups?.forEach((ag, agIdx) => {
    const variableKey =
      ag.eventListenWithDataInjectVariable || (ag.dataParams?.[0]?.updateType === 3 && ag.dataParams?.[0]?.variableKey);
    if (variableKey) {
      setStoreData(variableKey, data); // 更新全局存储的变量数据
    } else {
      // 更新组件数据
      updateCompDataByJson(ag.dataParams[0], data);
    }
    const actions = ag.actions || [];
    actions.forEach((action) => {
      cb && cb(action, actions);
    });
  });
};
