// import CompatibleTool from '@/pages/Platform/DataSource/Compatible';
import { getDataByKey } from '@/utils/dataStoreUtils';
import {
  passCurrentValueComps,
  getChangeValue,
  compDataOptionValue,
  // getCategory,
  // getCompPureData,
  getDataset,
} from '@/utils/common';
import {
  // dataiComps,
  getComp,
  // getNVChartObj,
  // getChartSeriesKey,
  // parseCode,
  // chartToParams,
  setDataset,
  render,
  // TableMap,
} from './config';

export default (action, settings) => {
  if (window.DataI.isConfigPage()) {
    return;
  }

  console.log(action, settings, 'action.actionSettings');

  const { compKey, dataParams } = action.actionSettings;
  let { item, config: screenConfig, el } = settings; // item 是绑定该交互的当前组件
  if (el) {
    // 点击系列、点击图例
    item = el;
  }

  const triggerComp = getComp(compKey); // 触发对象组件
  if (!triggerComp) return;

  // 给参数赋值
  const setParamValue = (paramType, paramItemId, val, dataset, compDataItem, selectedComp) => {
    setDataset(paramType, val, dataset, triggerComp, compDataItem, selectedComp);
  };

  // 解析参数
  const parseParams = (dataset) => {
    dataParams.forEach((param) => {
      if (param.paramItemId) {
        // v8.5.1 编辑参数 新增是否选中值isSelected
        const {
          paramType,
          paramItemId,
          compDataItem,
          updateType,
          inputVal,
          isSelected = 1,
          dataSwitch,
          dataSwitchContent,
        } = param;
        switch (updateType) {
          case 1: {
            // 手动输入
            let newVal = [];
            newVal =
              inputVal && inputVal.startsWith('[') && inputVal.endsWith(']')
                ? inputVal.replaceAll(/\[|]/g, '').split(',')
                : inputVal;
            setParamValue(paramType, paramItemId, newVal, dataset);

            break;
          }
          case 2: {
            // 组件数据
            if (!compDataItem) {
              setParamValue(paramType, paramItemId, '', dataset);
              return;
            }
            const selectedComp = getComp(param.compKey);
            if (
              selectedComp.type === 'Input' ||
              selectedComp.type === 'NewInput' ||
              (passCurrentValueComps.has(selectedComp.type) && isSelected === 1)
            ) {
              // v8.5.1 选中值组件读取选中值
              const val = getChangeValue(selectedComp, 2, compDataItem, action);
              setParamValue(paramType, paramItemId, val, dataset);
            } else {
              // 数据项
              const val = compDataOptionValue(param.compKey, compDataItem, item, dataSwitch, dataSwitchContent);
              console.log('val', val);
              setParamValue(paramType, paramItemId, val, dataset, compDataItem, selectedComp);
            }

            break;
          }
          case 3: {
            // 变量
            if (param.variableKey) {
              const val = getDataByKey(param.variableKey);
              let newVal;
              /**
               * 将不是数组的数据都处理成字符串，setParamValue里面的逻辑目前只处理数组和字符串，防止报错
               */
              if (typeof val === 'object') {
                if (Object.prototype.toString.call(val) === '[object Object]') {
                  newVal = [JSON.stringify(val)];
                } else if (Array.isArray(val)) {
                  newVal = val;
                }
              } else {
                newVal = val;
              }
              setParamValue(paramType, paramItemId, newVal, dataset, compDataItem);
            } else {
              setParamValue(paramType, paramItemId, '', dataset);
            }
            break;
          }
          case 4: {
            console.log(item, param, 'item-param');
            // 交互传入值
            if (!param.interactDataItem || !item) {
              setParamValue(paramType, paramItemId, '', dataset);
            } else {
              console.log(param.interactDataItem, 'interactDataItem');
              const val = getChangeValue(item, 4, param.interactDataItem, action);
              setParamValue(paramType, paramItemId, val, dataset, compDataItem);
            }

            break;
          }
          default: {
            break;
          }
        }
      }
    });
  };

  const dataset = getDataset(triggerComp);
  console.log('dataset', dataset);
  if (dataset) {
    // 解析参数并赋值
    parseParams(dataset);
    render(triggerComp, dataset);
  }
};
