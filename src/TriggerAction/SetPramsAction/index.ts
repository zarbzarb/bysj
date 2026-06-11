import { getDataByKey } from '@/utils/dataStoreUtils';
import { passCurrentValueComps, getChangeValue, compDataOptionValue, getDataset } from '@/utils/common';
import { getComp, render } from './config';
import setPrams from './setPrams';

enum PramsSetWay {
  Static = 1,
  CompData = 2,
  Variable = 3,
  SelfCompInput = 4,
}

const SELECTED_COMP_TYPE_IN_GET_CHANGE_VALUE = new Set(['Input', 'NewInput']);

export default (action, settings) => {
  if (window.DataI.isConfigPage()) return;

  const { compKey, dataParams } = action.actionSettings;

  // item 是绑定该交互的当前组件
  const { item = settings.el } = settings;

  // 触发对象组件
  const triggerComp = getComp(compKey);

  if (!triggerComp) return;

  dataParams.forEach((prams: any = {}) => {
    const {
      paramType,
      compDataItem,
      updateType,
      inputVal,
      isSelected = 1,
      dataSwitch,
      dataSwitchContent,
      paramItemId,
      compKey: selectedCompKey,
      interactDataItem,
      variableKey,
    } = prams;

    if (!paramItemId) return;

    if (updateType === PramsSetWay.Static && inputVal && inputVal.startsWith('[') && inputVal.endsWith(']')) {
      setPrams(paramType, inputVal.replaceAll(/\[|]/g, '').split(',') ?? [], triggerComp);
      return;
    }

    if (updateType === PramsSetWay.Static) {
      setPrams(paramType, inputVal ?? [], triggerComp);
      return;
    }

    if (updateType === PramsSetWay.CompData && !compDataItem) {
      setPrams(paramType, '', triggerComp);
      return;
    }

    // v8.5.1 选中值组件读取选中值
    if (
      updateType === PramsSetWay.CompData &&
      (SELECTED_COMP_TYPE_IN_GET_CHANGE_VALUE.has(triggerComp.type) ||
        (passCurrentValueComps.has(triggerComp.type) && isSelected === 1))
    ) {
      setPrams(paramType, getChangeValue(triggerComp, 2, compDataItem, action), triggerComp);
      return;
    }

    // 数据项
    if (updateType === PramsSetWay.CompData) {
      setPrams(
        paramType,
        compDataOptionValue(selectedCompKey, compDataItem, item, dataSwitch, dataSwitchContent),
        triggerComp,
      );

      return;
    }

    const data = variableKey && getDataByKey(variableKey);

    // 将不是数组的数据都处理成字符串，setParamValue里面的逻辑目前只处理数组和字符串，防止报错
    if (updateType === PramsSetWay.Variable && Object.prototype.toString.call(data) === '[object Object]') {
      setPrams(paramType, [JSON.stringify(data)], triggerComp);

      return;
    }

    if (updateType === PramsSetWay.Variable && data) {
      setPrams(paramType, data, triggerComp);
      return;
    }

    if (updateType === PramsSetWay.Variable) {
      setPrams(paramType, '', triggerComp);
      return;
    }

    // 交互传入值
    if (updateType === PramsSetWay.SelfCompInput && (!interactDataItem || !item)) {
      setPrams(paramType, '', triggerComp);
      return;
    }

    if (updateType === PramsSetWay.SelfCompInput) {
      setPrams(paramType, getChangeValue(item, 4, interactDataItem, action), triggerComp);
      return;
    }
  });

  render(triggerComp, getDataset(triggerComp));
};
