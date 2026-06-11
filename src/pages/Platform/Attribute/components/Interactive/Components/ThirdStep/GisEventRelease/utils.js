import _ from 'lodash';
import { getInitParam } from '../../Common/common';
import { getCurrentAction } from '../../../utils';

export const gisInaterActiveCompatible = (item, path, value) => {
  //   console.log(item, path, value);
  if (_.isEqual(item.actionSettings[path], value)) {
    console.warn('相同配置不更新');
    return false;
  }

  // 选择变量时默认将变量表达式的值设置为data

  // 定位
  if (path == 'variable' && item.actionSettings.expression == undefined) {
    item.actionSettings.expression = 'data';
  }
  if (path == 'latVariable' && item.actionSettings.latExpression == undefined) {
    item.actionSettings.latExpression = 'data';
  }

  // 相机飞行3个变量
  if (path == 'longVariable' && item.actionSettings.longVariableExp == undefined) {
    item.actionSettings.longVariableExp = 'data';
  }
  if (path == 'latVariable' && item.actionSettings.latVariableExp == undefined) {
    item.actionSettings.latVariableExp = 'data';
  }
  if (path == 'zoomVariable' && item.actionSettings.zoomVariableExp == undefined) {
    item.actionSettings.zoomVariableExp = 'data';
  }

  // 全局查询5个变量
  if (path == 'layerCodeVariable' && item.actionSettings.layerCodeVariableExp == undefined) {
    item.actionSettings.layerCodeVariableExp = 'data';
  }
  if (path == 'searchKeyVariable' && item.actionSettings.searchKeyVariableExp == undefined) {
    item.actionSettings.searchKeyVariableExp = 'data';
  }
  if (path == 'pageNumVariable' && item.actionSettings.pageNumVariableExp == undefined) {
    item.actionSettings.pageNumVariableExp = 'data';
  }
  if (path == 'pageSizeVariable' && item.actionSettings.pageSizeVariableExp == undefined) {
    item.actionSettings.pageSizeVariableExp = 'data';
  }
  if (path == 'labelVariable' && item.actionSettings.latExpression == undefined) {
    item.actionSettings.latExpression = 'data';
  }

  // 周边查询4个变量
  if (path == 'circleQueryLayerVariable' && item.actionSettings.circleQueryLayerVariableExp == undefined) {
    item.actionSettings.circleQueryLayerVariableExp = 'data';
  }
  if (path == 'circleQueryCenterVariable' && item.actionSettings.circleQueryCenterVariableExp == undefined) {
    item.actionSettings.circleQueryCenterVariableExp = 'data';
  }
  if (path == 'circleQueryRadiusVariable' && item.actionSettings.circleQueryRadiusVariableExp == undefined) {
    item.actionSettings.circleQueryRadiusVariableExp = 'data';
  }
  if (path == 'circleQueryLabelVariable' && item.actionSettings.circleQueryLabelVariableExp == undefined) {
    item.actionSettings.circleQueryLabelVariableExp = 'data';
  }

  // 空间查询4个变量
  if (path == 'layerCodeVariable' && item.actionSettings.layerCodeVariableExp == undefined) {
    item.actionSettings.layerCodeVariableExp = 'data';
  }
  if (path == 'searchKeyVariable' && item.actionSettings.searchKeyVariableExp == undefined) {
    item.actionSettings.searchKeyVariableExp = 'data';
  }
  if (path == 'pageNumVariable' && item.actionSettings.pageNumVariableExp == undefined) {
    item.actionSettings.pageNumVariableExp = 'data';
  }
  if (path == 'pageSizeVariable' && item.actionSettings.pageSizeVariableExp == undefined) {
    item.actionSettings.pageSizeVariableExp = 'data';
  }

  // 图层渲染
  if (path == 'renderLayerVariable' && item.actionSettings.renderLayerExpression == undefined) {
    item.actionSettings.renderLayerExpression = 'data';
  }

  // 绘制区域
  if (path == 'drawTypeVariable' && item.actionSettings.drawTypeVariableExp == undefined) {
    item.actionSettings.drawTypeVariableExp = 'data';
  }
  if (path == 'borderColorVariable' && item.actionSettings.borderColorVariableExp == undefined) {
    item.actionSettings.borderColorVariableExp = 'data';
  }
  if (path == 'borderWidthVariable' && item.actionSettings.borderWidthVariableExp == undefined) {
    item.actionSettings.borderWidthVariableExp = 'data';
  }
  if (path == 'backgroundVariable' && item.actionSettings.backgroundVariableExp == undefined) {
    item.actionSettings.backgroundVariableExp = 'data';
  }

  // 触发点击
  if (path == 'clickLayerVariable' && item.actionSettings.clickLayerVariableExp == undefined) {
    item.actionSettings.clickLayerVariableExp = 'data';
  }

  // 轨迹播放
  if (path == 'trackPlayPathVariable' && item.actionSettings.trackPlayPathVariableExp == undefined) {
    item.actionSettings.trackPlayPathVariableExp = 'data';
  }

  // 轨迹飞线
  if (path == 'routePathVariable' && item.actionSettings.routePathVariableExp == undefined) {
    item.actionSettings.routePathVariableExp = 'data';
  }

  // 热力线
  if (path == 'heatLineVariable' && item.actionSettings.heatLineVariableExp == undefined) {
    item.actionSettings.heatLineVariableExp = 'data';
  }

  // 地图选点
  if (path == 'imgSrcVariable' && item.actionSettings.imgSrcVariableExp == undefined) {
    item.actionSettings.imgSrcVariableExp = 'data';
  }
  if (path == 'imgSizeVariable' && item.actionSettings.imgSizeVariableExp == undefined) {
    item.actionSettings.imgSizeVariableExp = 'data';
  }

  // 图层显隐
  if (path == 'mapShowVariable' && item.actionSettings.mapShowExpression == undefined) {
    item.actionSettings.mapShowExpression = 'data';
  }

  // 分屏对比
  if (path == 'mainVariable' && item.actionSettings.mainVariableExp == undefined) {
    item.actionSettings.mainVariableExp = 'data';
  }
  if (path == 'secondVariable' && item.actionSettings.secondVariableExp == undefined) {
    item.actionSettings.secondVariableExp = 'data';
  }

  // 卷帘对比
  if (path == 'leftLayerVariable' && item.actionSettings.leftLayerVariableExp == undefined) {
    item.actionSettings.leftLayerVariableExp = 'data';
  }
  if (path == 'rightLayerVariable' && item.actionSettings.rightLayerVariableExp == undefined) {
    item.actionSettings.rightLayerVariableExp = 'data';
  }

  return true;
};

const updateEventSettings = (opts = {}) => {
  let { comp, eventSettings, parentIdx, actionIdx, idx, item } = opts;
  let retEventSettings = eventSettings;
  try {
    const action = getCurrentAction(comp.eventSetings, parentIdx, actionIdx);
    action.actionSettings.mapAction[idx] = item;

    retEventSettings = _.cloneDeep(comp.eventSetings);
  } catch (error) {
    console.error(error);
  }
  return retEventSettings;
};
export const updateGisEventSettings = (comp, eventSettings, others = {}) => {
  eventSettings = updateEventSettings({ comp, eventSettings, ...others });
  executeCommand('InteractionCommand', comp, eventSettings);
};

// 地图数据转化
export const getInitParams = (mapOptions) => {
  const initParams = mapOptions.map((option) => {
    const initParam = getInitParam();
    initParam.paramName = option.label;
    initParam.mapValName = option.mapValName;
    initParam.tipMsg = option.tipMsg;
    initParam.paramItemId = option.paramItemId;
    if (!option.eventType) {
      option.eventType = '1';
    }
    if (option.eventType == '1') {
      // 固定参数
      let value = option.value || '';
      if (option.mapValName == 'isLabel' && value == true) {
        // 兼容标注字段不统一问题
        value = '0';
      }
      initParam.updateType = 1;
      initParam.inputVal = typeof value === 'string' ? value : JSON.stringify(value);
    } else if (option.eventType == '2') {
      // 变量
      initParam.updateType = 3;
      initParam.variableKey = option.variable;
      initParam.expression = option.expression;
    }
    return initParam;
  });
  return initParams;
};
