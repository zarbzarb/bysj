import { getParamValue } from '@/TriggerAction/utils';
import { setDataset, render } from '@/TriggerAction/updateData/config';
import { getDataByKey, setStoreData } from '@/utils/dataStoreUtils';
import { updateCompDataByJson } from '@/EventHandlers/AnimateEvent';
export const getMapData = (opts = {}, dataParams) => {
  let { action, comp } = opts;
  let obj = {};
  dataParams.forEach((param) => {
    let value = getParamValue(param, comp, action);
    if (typeof value === 'string' && (value?.includes('[') || value?.includes('{'))) {
      const invalidJsonString = value;
      const validJsonString = invalidJsonString.replace(/'/g, '"');
      obj[param.mapValName] = JSON.parse(validJsonString);
    } else {
      // 获取组件数据只获取第一项
      if (Array.isArray(value) && param.updateType == 2) {
        value = value[0];
      }
      obj[param.mapValName] = value;
    }
  });
  return obj;
};

export const setMapData = (opts = {}, saveParams = [], data, type) => {
  // const { action, comp, compKey } = opts;
  // console.log(opts, saveParams, data, '123456789++++');
  saveParams.forEach((param) => {
    const { paramItemId, updateType, variableKey, compDataItem, compKey } = param;
    // updateType 2 数组数据 -- 3 变量
    // paramItemId all 是所有数据
    let val = [];
    // 字符串
    if (typeof data === 'string' || type === 'getCenter') {
      val = data;
    } else if (Object.prototype.toString.call(data) === '[object Object]') {
      val = data[paramItemId];
    } else if (Object.prototype.toString.call(data) === '[object Array]') {
      data.forEach((item) => {
        const props = item.props || item.fields || {};
        props[paramItemId] && val.push(props[paramItemId]);
      });
    }

    if (updateType === 2) {
      updateCompDataByJson({ compKey, compDataItem }, val);
    } else {
      if (!variableKey) return;
      if (paramItemId === 'all') {
        setStoreData(variableKey, data);
        return;
      }
      setStoreData(variableKey, val);
    }
  });
};

export const getMapFn = (mapType) => {
  let mapInstanceFn = window.YunliMap;
  if (mapType == 'Map3DBasicLayer' || mapType == 'Map3DFoundationPlan') {
    mapInstanceFn = window.YunliMap3D;
  } else if (mapType == 'MapGlFoundationPlan') {
    mapInstanceFn = window.YunliMapGL;
  }
  return mapInstanceFn;
};
