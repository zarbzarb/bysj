import { getDataByKey } from '@/utils/dataStoreUtils';
import { passCurrentValueComps, getChangeValue, compDataOptionValue } from '@/utils/common';
import RemoteControlWebSocket from '@/utils/RemoteControlWebSocket';
import { getComp } from './updateData/config';

const parseParams = (params, action, item) => {
  if (params.length === 0) return '';
  const param = params[0];
  let result = '';
  const { compDataItem, updateType, inputVal, isSelected = 1, dataSwitch, dataSwitchContent } = param;
  switch (updateType) {
    case 1: {
      // 手动输入
      result =
        inputVal && inputVal.startsWith('[') && inputVal.endsWith(']')
          ? inputVal.replaceAll(/\[|]/g, '').split(',')
          : inputVal;
      break;
    }
    case 2: {
      // 组件数据
      if (compDataItem) {
        const selectedComp = getComp(param.compKey);
        if (
          selectedComp.type === 'Input' ||
          selectedComp.type === 'NewInput' ||
          (passCurrentValueComps.has(selectedComp.type) && isSelected === 1)
        ) {
          // v8.5.1 选中值组件读取选中值
          result = getChangeValue(selectedComp, 2, compDataItem, action);
        } else {
          // 数据项
          result = compDataOptionValue(param.compKey, compDataItem, item, dataSwitch, dataSwitchContent);
        }
      }
      break;
    }
    case 3: {
      // 变量
      if (param.variableKey) {
        result = getDataByKey(param.variableKey);
      }
      break;
    }
    case 4: {
      // 交互传入值
      if (param.interactDataItem && item) {
        result = getChangeValue(item, 4, param.interactDataItem, action);
      }
      break;
    }
    default: {
      break;
    }
  }
  return result;
};

export default (action, settings) => {
  if (window.DataI.isConfigPage()) {
    return;
  }

  const { appPageId, eventKey, dataParams } = action.actionSettings;
  if (!eventKey) {
    console.warn('eventKey is missing');
    return;
  }
  const [compKey, eventName] = eventKey.split('__');

  let { item, el } = settings; // item 是绑定该交互的当前组件
  if (el) {
    // 点击系列、点击图例
    item = el;
  }

  const params = parseParams(dataParams, action, item);
  console.log({ params });

  const payload = {
    type: 'remoteEvent',
    pageId: appPageId,
    compKey,
    eventName,
    eventParams: JSON.stringify(params),
  };
  console.log({ payload });

  const rcSocket = RemoteControlWebSocket.instance;
  if (rcSocket) {
    rcSocket.sendMessage(payload);
  }
};
