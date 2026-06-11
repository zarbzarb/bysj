import { getDataByKey } from '@/utils/dataStoreUtils';
import { babelTransform } from '@/utils/utils';
// import { getGisQuery } from '@/services/apis/dataManage';
export default (action) => {
  const EventEmitter = window.globalEventEmitter;
  let {
    eventKey,
    eventType,
    eventValue,
    variableKey,
    mapConfig,
    mapKey,
    gisType,
    mapAction,
    mapType,
    layerCodeAll,
    layerKeyAll,
  } = action.actionSettings;
  // 定位查询引用变量操作变量定位查询值没改变问题
  const getExpDataByKey = (variable, expression) => {
    let data = getDataByKey(variable);
    // const fn = new Function('data', 'expression');
    data = babelTransform(expression, data); // 运行时ES6转ES5
    return data;
  };
  // 兼容旧数据
  mapAction = mapAction.map((item) => {
    let s = item.actionSettings;
    if (item.actionType == 'mapLocationEvent' && s.variable && s.isLongitude) {
      s.longitude = getExpDataByKey(s.variable, s.expression);
    }
    if (item.actionType == 'mapLocationEvent' && s.latVariable && s.isLat) {
      s.lat = getExpDataByKey(s.latVariable, s.latExpression);
    }
    if (item.actionType == 'mapZoomEvent' && s.variable && s.isVariable) {
      s.zoom = getExpDataByKey(s.variable, s.expression);
    }
    if (item.actionType == 'mapQuery') {
      if (s.variable && s.isVariable) {
        s.filter = getExpDataByKey(s.variable, s.expression); // 引用变量的情况下更新过滤条件
      }
      if (s.isLabelRadio) {
        s.label = getExpDataByKey(s.labelVariable, s.latExpression);
      }
    }
    if (item.actionType == 'mapRenderLayers' && s.renderLayerVariable) {
      s.renderLayerData = getExpDataByKey(s.renderLayerVariable, s.renderLayerExpression);
      if (s.isLabelRadio) {
        s.label = getExpDataByKey(s.labelVariable, s.latExpression);
      }
    }
    return item;
  });
  // 暂时兼容缩放定位 触发点击跟查询同时存在情况
  let mapZoomData, mapLocationData;
  mapAction.forEach((item, index) => {
    if (item.actionType == 'mapZoomEvent') {
      mapZoomData = mapAction.splice(index, 1);
    }
    if (item.action == 'mapLocationEvent') {
      mapLocationData = mapAction.splice(index, 1);
    }
  });
  if (mapZoomData) {
    mapAction.unshift(mapZoomData[0]);
  }
  if (mapLocationData) {
    mapAction.unshift(mapLocationData[0]);
  }
  if (!eventKey) console.error('请完善事件发布中的事件key参数');

  let mapConfigData = Object.assign({}, mapConfig);
  mapConfigData['mapKey'] = mapKey;
  mapConfigData['gisType'] = gisType;
  mapConfigData['mapType'] = mapType;
  mapConfigData['gisAction'] = {};
  mapConfigData['otherInject'] = {
    actionKey: action?.actionKey,
  };
  if (eventType == 2) {
    if (variableKey) {
      mapConfigData['variableKey'] = variableKey;
      mapConfigData['variableData'] = getDataByKey(variableKey); // 根据key获取全局变量的值
    }
  }

  //gl交互事件
  let filterMapAction = mapAction.filter((val) => val.actionType != ''); //避免添加交互事件不进行后续操作

  let layerType = '';
  if (mapType == 'MapGlFoundationPlan') {
    layerType = 'MapGlFoundationPlan';
  } else if (mapType == 'Map3DFoundationPlan') {
    layerType = 'Map3DBasicLayer';
  } else {
    layerType = 'Map2DBasicLayer';
  }

  filterMapAction.forEach((item) => {
    let actionConfig = item.actionSettings;
    actionConfig.mapType = layerType;
    // console.log('actionConfig.value', actionConfig.value);
    mapConfigData['gisAction'][actionConfig.value] = actionConfig;
  });
  mapConfigData.action = action;
  action.compKey && (mapConfigData.comp = DataI.getComponentByKey(action.compKey));
  EventEmitter.emit(eventKey, mapConfigData);
};
