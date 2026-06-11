import { COMPONENT_SPECIAL_ACTIONS } from './constant';

const getComponent = window.DataI.getComponentByKey;

/**
 * 根据组件key获取它可选的动作
 * @param {*} compKey 组件key
 */
export const getActionOptions = (compKey) => {
  const comp = getComponent(compKey);
  if (!comp) return [];
  const compType = comp.classType === 'antd' ? comp.type : comp.englishName;
  return COMPONENT_SPECIAL_ACTIONS[compType] || [];
};
