import { getComp } from '../updateData/config';
import { ActionHandlerMap } from './config';

export default (action, settings) => {
  if (window.DataI.isConfigPage()) {
    return;
  }

  const { compKey, actionParam } = action.actionSettings;
  // let { item, config: screenConfig, el } = settings; // item 是绑定该交互的当前组件

  const triggerComp = getComp(compKey); // 触发对象组件
  if (!triggerComp) return;

  // 根据组件类型去找动作执行函数，如果找到了执行即可
  const triggerCompType = triggerComp.classType === 'antd' ? triggerComp.type : triggerComp.englishName;
  const handler = ActionHandlerMap[triggerCompType];
  if (handler) {
    handler(triggerComp, actionParam);
  }
};
