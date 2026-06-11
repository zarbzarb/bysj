import React from 'react';
import ReactDOM from 'react-dom';
import { getDataByKey, setStoreData } from '@/utils/dataStoreUtils';
import _ from 'lodash';
import { Col, message, Row, Button } from 'antd';
import { encode } from 'js-base64';
import { queryGisByEs, getSysLayerListByBatch } from '@/services/apis/dataMapApi';
import { zoomMapList, mapBaseLayerType, mapEnglishNameArr } from '@/staticJson/MapBasic';
// import styles from './index.less';
import { setMapPixelWin, registerMapVariListen } from '@/utils/gisCommonUtils';
import { getImageUrl, babelTransform, dynamicLoadMapLayer } from '@/utils/utils';
import { getMapData, setMapData, getMapFn } from './gisCommon';

//全局查询
export const gisEsQuery = (opts) => {
  let { index, data, customMapObj, customMapPlan } = opts;
  data = { ...data, customConfigs: data.gisAction.mapEsQuery };
  const {
    //value: mapType,
    layerCodeAll,
    layerCode,
    layerCodeSw = 'default',
    layerCodeVal,
    layerCodeVariable,
    layerCodeVariableExp = 'data',
    searchKeySw = 'default',
    searchKeyVal,
    searchKeyVariable,
    searchKeyVariableExp = 'data',
    pageNumSw = 'default',
    pageNumVal = '1',
    pageNumVariable,
    pageNumVariableExp = 'data',
    pageSizeSw = 'default',
    pageSizeVal = '20',
    pageSizeVariable,
    pageSizeVariableExp = 'data',
    isType = false, //是否返回几何(坐标)
    queryApiVariable, //存储的变量
    dataParams = [],
    saveParams = [],
  } = data.customConfigs;

  console.log(data.customConfigs);
  //let layerCodeAll = data.layerCodeAll;
  const queryParam = {};
  const layerCodeTmp =
    layerCodeSw == 'default' ? layerCodeVal : getExpDataByKey(layerCodeVariable, layerCodeVariableExp);
  //不选图层默认查询全部
  queryParam.layerCodes = Array.isArray(layerCodeTmp) && layerCodeTmp.length > 0 ? layerCodeTmp : layerCodeAll;
  queryParam.keyWord =
    searchKeySw == 'default' ? searchKeyVal : getExpDataByKey(searchKeyVariable, searchKeyVariableExp);
  queryParam.pageNum = pageNumSw == 'default' ? pageNumVal : getExpDataByKey(pageNumVariable, pageNumVariableExp);
  queryParam.pageSize = pageSizeSw == 'default' ? pageSizeVal : getExpDataByKey(pageSizeVariable, pageSizeVariableExp);
  queryParam.returnGeometry = isType;
  let queryParams = queryParam;
  if (dataParams.length) {
    const objData = getMapData(opts, dataParams);
    if (layerCodeSw == 'default') {
      delete objData.layerCodes;
    }
    queryParams = { ...queryParam, ...objData };
  }

  const eventData = data;
  queryGisByEs(queryParams)
    .then(({ data, success, message: msg }) => {
      if (!success) {
        return message.error(msg);
      }
      const result = data.result;
      saveParams.length ? setMapData(opts, saveParams, data) : queryApiVariable && setStoreData(queryApiVariable, data);
      gisEsQueryFilter({
        data: {
          ...eventData,
          layerCodes: queryParams.layerCodes,
          label: queryParams.label,
        },
        index,
        searchData: data,
        customMapPlan,
      });
    })
    .catch((err) => {
      console.error(err, '地图查询出错');
    });
};

const gisEsQueryFilter = (opts) => {
  const { data, index, searchData, customMapPlan } = opts;
  const { customConfigs, layerCodes, label } = data;
  //console.log('gisEsQueryFilter*****', data, index, searchData);
  let {
    layerKeyAll,
    isFilter = false,
    layerCodeSw = 'default',
    filterWay = 'all',
    isLabel = false, //是否开启
    isLabelRadio = false, //直接使用还是变量,直接使用是否false
    labelExpression = 'data',
    labelVariable,
  } = data.customConfigs;

  // console.log(isLabel, isLabelRadio, '=====');
  if (isLabel) {
    let type = false;
    if (label == 0) {
      type = true;
    }
    isLabel = isLabelRadio ? type : true;
  }
  //兼容
  let queryStyleType; //添加标注状态
  const queryFilter = {
    layerType: customConfigs.layerType,
    filter: customConfigs.filter,
    isFilter: customConfigs.isFilter == undefined ? true : customConfigs.isFilter,
    queryStyleType,
  };
  const mapLayers = customMapPlan.layers;
  const layerList = window.layerList || [];
  //let queryFilter = data.customConfigs.eslegend;
  const queryFilterDataObj = {};
  // if (isLabelRadio) {
  //   isLabel = getExpDataByKey(labelVariable, labelExpression);
  // }
  if (queryFilter != undefined && Object.keys(queryFilter).length) {
    searchData.forEach((item) => {
      !Array.isArray(queryFilterDataObj[item.layerCode]) && (queryFilterDataObj[item.layerCode] = []);
      queryFilterDataObj[item.layerCode].push(item);
    });
    //多选
    let layerCodeArr =
      Array.isArray(queryFilter.layerType) && queryFilter.layerType.length > 0 ? queryFilter.layerType : layerKeyAll;
    if (layerCodeSw !== 'default') {
      layerCodeArr = layerCodes;
    }
    layerCodeArr.forEach((layer) => {
      //let layerIndex = _.findIndex(layerList[index].layers, ['key', layer])
      // let layerIndex = _.findIndex(mapLayers, function (o) {
      //   if (layer.includes('@com_')) {
      //     return o.key == layer;
      //   } else {
      //     return o?._attr?.relation_layer_code == layer;
      //   }
      // });

      const layerIndex = mapLayers.findIndex((o) => {
        if (layer.includes('@com_')) {
          return o.key == layer;
        } else {
          return o?._attr?.relation_layer_code == layer;
        }
      });

      if (layerIndex < 0) return;
      const mapLayer = mapLayers[layerIndex];
      const relation_layer_code = mapLayer?._attr.relation_layer_code;
      const queryFilterData = queryFilterDataObj[relation_layer_code] || [];
      let curLayerIns = mapLayer?.instance?.layer_instance;
      const renderInstance = () => {
        if (!curLayerIns) {
          return;
        }
        //数据优化开启
        if (curLayerIns.isTileLayer) {
          curLayerIns.filterSelectLayer &&
            curLayerIns.filterSelectLayer({
              queryFeatures: queryFilterData,
              isDeal: true,
              isFilter,
              isLabel,
              filterType: 'es',
              filterWay,
            });
        } else {
          queryFilterData.length &&
            curLayerIns?.filterQueryFeature({
              queryFeatures: queryFilterData,
              isFilter,
              isLabel,
              type: 'es',
              filterWay,
            });
        }
      };

      if (!mapLayer.createFlag) {
        dynamicLoadMapLayer({
          layer: mapLayer,
          baseMap: customMapPlan,
          gisEventType: true,
        });
      }
      //有instance
      if (curLayerIns) {
        renderInstance();
      } else {
        window.globalEventEmitter.on('renderLayerEvent', (layerCode) => {
          if (layerCode == relation_layer_code) {
            curLayerIns = mapLayer?.instance.layer_instance;
            renderInstance();
          }
        });
      }
    });
  }
};

//周边查询
export const gisCircleQuery = (opts) => {
  let { index, data, customMapObj, customMapPlan, gisDataCache } = opts;
  data = { ...data, customConfigs: data.gisAction.mapCircleQuery };
  const { mapType } = data;
  const layerList = window.layerList || [];
  let {
    //查询图层
    circleQueryLayerType = 1,
    circleQueryLayer = '',
    circleQueryLayerVariable = '',
    circleQueryLayerVariableExp = 'data',
    //查询点位
    circleQueryCenterType = 1,
    circleQueryCenter = '',
    circleQueryCenterVariable = '',
    circleQueryCenterVariableExp = 'data',
    //查询半径
    circleQueryRadiusType = 1,
    circleQueryRadius = '',
    circleQueryRadiusVariable = '',
    circleQueryRadiusVariableExp = 'data',

    circleBackground = 'rgba(255,255,255,0.65)',
    isInteract = false, //是否地图互动
    isLocation = false, //是否地图定位
    isFilter = false, //是否地图互动(过滤)
    filterWay = 'all',
    isLabel = false, //是否标注
    isLabelRadio = false, //启用类型
    isDrag = false,
    circleQueryLabelVariable = '',
    circleQueryLabelVariableExp = 'data',

    isReturnData = false,
    retDataType = 'default',
    queryApiVariable = undefined,
    dataParams = [],
    saveParams = [],
    deleteCircleVariable = '',
  } = data.customConfigs;
  let layerCodeLocal = [];
  let layerCodeSys = [];
  const layerUid = [];
  const mapLayers = customMapPlan.layers;
  let isLab = false;

  if (circleQueryLayerType == 1) {
    circleQueryLayer.forEach((layer) => {
      const circleQueryLayerTmp = layer.split('#');
      if (circleQueryLayerTmp[0] == 'local') {
        layerCodeLocal.push(circleQueryLayerTmp[1]);
      } else {
        layerUid.push(circleQueryLayerTmp[1]);
      }
    });
  }

  if (circleQueryLayerType != 1) {
    layerCodeLocal = getExpDataByKey(circleQueryLayerVariable, circleQueryLayerVariableExp);
  }

  if (circleQueryCenterType != 1) {
    circleQueryCenter = getExpDataByKey(circleQueryCenterVariable, circleQueryCenterVariableExp);
  }
  if (circleQueryRadiusType != 1) {
    circleQueryRadius = getExpDataByKey(circleQueryRadiusVariable, circleQueryRadiusVariableExp);
  }
  if (isLabel && isLabelRadio) {
    isLab = getExpDataByKey(circleQueryLabelVariable, circleQueryLabelVariableExp);
  }

  if (dataParams.length) {
    const objData = getMapData(opts, dataParams);
    circleQueryLayerType != 1 && (layerCodeLocal = objData.layerCodeLocal);
    circleQueryCenter = objData.circleQueryCenter;
    circleQueryRadius = objData.circleQueryRadius;
    isLab = objData.isLabel;
  }
  // console.log(isLabel, isLabelRadio, '12345');

  //islabel 是否标注
  //isLabelRadio 启用类型
  // isLab dataParams参数
  if (isLabel) {
    if (!isLabelRadio) {
      isLab = true;
    } else {
      isLab = isLab == '0' || isLab === true ? true : false;
    }
  } else {
    isLab = false;
  }
  if (!Array.isArray(layerCodeLocal)) {
    console.error('地图周围查询-图层数据不是数组！');
    return;
  }
  /* if (!Array.isArray(circleQueryLayer)) {
    return;
  } */
  try {
    !Array.isArray(circleQueryCenter) && (circleQueryCenter = JSON.parse(circleQueryCenter));
  } catch (err) {
    console.error('周边查询中心点坐标数据不正确');
  }
  if (!Array.isArray(circleQueryCenter)) {
    message.info('周边查询中心点坐标格式不正确！');
    return;
  }

  if (isInteract && isLocation) {
    customMapObj._map.setCenter(circleQueryCenter);
    const mapInstanceFn = getMapFn(mapType);
    // console.log(mapInstanceFn, '++++++++++++++++++++');
    const degrees = mapInstanceFn.metersToUnits(customMapObj._map.getCenter(), circleQueryRadius);

    let mapFitFn = 'fit';
    const fitOpts = {
      extent: [
        circleQueryCenter[0] - degrees,
        circleQueryCenter[1] - degrees,
        circleQueryCenter[0] + degrees,
        circleQueryCenter[1] + degrees,
      ],
      padding: [200, 200, 200, 200],
    };
    if (mapType == 'Map3DFoundationPlan') {
      mapFitFn = 'fitView';
      fitOpts.padding = [0.1, 0.1, 0.1, 0.1];
    }
    if (mapType == 'MapGlFoundationPlan') {
      customMapObj._map.fitExtent(fitOpts.extent, {
        padding: { top: 100, bottom: 100, left: 100, right: 100 },
      });
    } else {
      customMapObj._map[mapFitFn](fitOpts);
    }
  }
  const isInteractLabel = isInteract && isLab;
  const isInteractFilter = isInteract && isFilter;
  const isInteractDrag = isInteract && isDrag;
  const otherParams = { isReturnData, retDataType, queryApiVariable };
  //console.log('otherParams*****', otherParams);
  const circleSymbol = Symbol('circle');
  const queryCircleOpts = {
    customMapPlan,
    customMapObj,
    //queryLayer,
    circleQueryCenter,
    circleQueryRadius,
    circleBackground,
    mapType,
    isLabel: isInteractLabel,
    isFilter: isInteractFilter,
    isDrag: isInteractDrag,
    filterWay,
    catchField: circleSymbol,
    gisDataCache,
    dragTarget: {},
    ...otherParams,
    saveParams,
    deleteCircleVariable,
  };
  const varListenCb = () => {
    if (circleQueryRadiusType != 1 && circleQueryRadiusVariable) {
      registerMapVariListen(circleQueryRadiusVariable, () => {
        const preCircleMapObj = gisDataCache[circleSymbol];
        Object.values(preCircleMapObj)?.forEach((obj) => {
          customMapObj._map.remove(obj);
        });
        delete gisDataCache[circleSymbol];
        queryCircleOpts.circleQueryRadius = getExpDataByKey(circleQueryRadiusVariable, circleQueryRadiusVariableExp);
        queryCircleData(queryCircleOpts);
      });
    }
  };
  //业务图层layerUid
  if (layerUid.length > 0) {
    getSysLayerListByBatch(layerUid).then((res) => {
      //console.log('getSysLayerListByBatch', res.data);
      layerCodeSys = parseSysLayerConfig(res.data);
      layerCodeLocal = layerCodeLocal.concat(layerCodeSys);
      const queryLayer = mapLayers.filter((item) => {
        return layerCodeLocal.includes(item._attr.relation_layer_code) || layerCodeLocal.includes(item.key);
      });
      queryCircleOpts.queryLayer = queryLayer;
      queryCircleData(queryCircleOpts);
      varListenCb();
    });
  } else {
    layerCodeLocal = layerCodeLocal.concat(layerCodeSys);
    const queryLayer = mapLayers.filter((item) => {
      return layerCodeLocal.includes(item._attr.relation_layer_code) || layerCodeLocal.includes(item.key);
    });
    queryCircleOpts.queryLayer = queryLayer;
    queryCircleData(queryCircleOpts);
    varListenCb();
  }
};

const getApiParamVar = (apiParamVar = {}) => {
  const { type, layerType, defaultValue, dataVariable, dataExpression } = apiParamVar || {};
  let reApiParam;
  if (layerType == 'API') {
    if (type == 'default') {
      reApiParam = defaultValue;
    } else if (type == 'variableRef') {
      const expression = dataExpression || 'data';
      const fn = new Function('data', `return ${expression}`);
      const variableValue = fn(window.getDataByKey(dataVariable));
      reApiParam = variableValue;
    }
  }
  return reApiParam;
};

const queryCircleData = (opts = {}) => {
  const {
    customMapPlan,
    customMapObj,
    queryLayer,
    circleQueryCenter,
    circleQueryRadius,
    mapType,
    isLabel,
    isFilter,
    isDrag,
    filterWay,
    catchField,
    gisDataCache,
    dragTarget,
    isReturnData,
    retDataType = 'default',
    queryApiVariable,
    saveParams = [],
  } = opts;
  const mapInstanceFn = getMapFn(mapType);
  console.log('queryLayer*', opts);
  let retObjs;
  if (mapType === 'Map3DFoundationPlan') {
    retObjs = add3dCircleMask(opts);
  } else if (mapType === 'MapGlFoundationPlan') {
    retObjs = addGlCircleMask(opts);
  } else {
    retObjs = addCircleMask(opts);
  }
  if (catchField) {
    gisDataCache[catchField] = retObjs;
  }

  const queryRetData = [];
  let queryFeatures = [];
  Array.isArray(queryLayer) &&
    queryLayer.forEach((layer) => {
      const relation_layer_code = layer._attr.relation_layer_code;
      if (!layer.createFlag) {
        dynamicLoadMapLayer({
          layer: layer,
          baseMap: customMapPlan,
          gisEventType: true,
        });
      }
      if (!layer.instance) {
        return;
      }
      let curLayer = layer?.instance.layer_instance;
      //有instance
      if (curLayer) {
        renderInstance();
      } else {
        window.globalEventEmitter.on('renderLayerEvent', (layerCode) => {
          if (layerCode == relation_layer_code) {
            curLayer = layer?.instance.layer_instance;
            renderInstance(); // REVIEW zengwei 多余参数
          }
        });
      }

      function renderInstance() {
        const queryDataParam = {
          // 查询的图层
          layerCode: relation_layer_code,
          coordinates: circleQueryCenter,
          // 周边查询时传递'point'，矩形查询和多边形查询传递'polygon'
          geometryType: 'point',
          exact: true,
          returnGeometry: retDataType == 'default' ? true : false,
          // 查询半径，周边查询时生效
          radius: circleQueryRadius,
        };
        mapType.indexOf('Map3D') > -1 && (queryDataParam.exact = false);

        const apiParam = getApiParamVar(curLayer?.states?.apiParamVar || curLayer.apiParam);
        if (apiParam) {
          queryDataParam.apiParam = apiParam;
        }
        const queryDataFun = () => {
          mapInstanceFn.queryDataInLayer(queryDataParam).then(function (features) {
            //console.log('queryDataInLayer***', features, curLayer);
            if (isReturnData) {
              queryRetData.push({
                features,
                layerCode: relation_layer_code,
                layerName: layer.name,
                feaLength: features.length,
                key: layer.key,
              });
              queryFeatures = [...queryFeatures, ...features];
              if (queryLayer.length == queryRetData.length) {
                saveParams.length
                  ? setMapData(opts, saveParams, queryFeatures)
                  : setStoreData(queryApiVariable, queryRetData);
              }
            }
            //数据优化开启
            if (curLayer.isTileLayer) {
              curLayer.filterSelectLayer &&
                curLayer.filterSelectLayer({
                  queryFeatures: features,
                  isDeal: true,
                  isFilter,
                  isLabel,
                  filterType: 'circle',
                  filterWay,
                  dragTarget,
                });
            } else {
              curLayer.filterQueryFeature &&
                curLayer.filterQueryFeature({
                  queryFeatures: features,
                  circleQueryCenter,
                  circleQueryRadius,
                  isLabel,
                  isFilter,
                  type: 'circle',
                  filterWay,
                  dragTarget,
                });
            }
          });
        };
        if (dragTarget) {
          if (Object.prototype.toString.call(dragTarget.moveTimer) !== '[object Object]') {
            dragTarget.moveTimer = {};
          }
          if (dragTarget.moveTimer[relation_layer_code]) {
            clearTimeout(dragTarget.moveTimer[relation_layer_code]);
            dragTarget.moveTimer[relation_layer_code] = null;
          }
          dragTarget.moveTimer[relation_layer_code] = setTimeout(() => {
            queryDataFun();
          }, 300);
        } else {
          queryDataFun();
        }
      }
    });
};

const addGlCircleMask = (opts = {}) => {
  let {
    customMapObj,
    circleQueryCenter,
    circleQueryRadius,
    circleBackground,
    dragging,
    isDrag,
    dragTarget,
    queryLayer,
    deleteCircleVariable,
  } = opts;
  circleQueryRadius = Number(circleQueryRadius);
  const circle = new YunliMapGL.Polygon({
    coordinates: YunliMapGL.GeometryUtil.polygonFromCircle(circleQueryCenter, circleQueryRadius, 100),
    color: circleBackground,
  });
  customMapObj._map.add(circle);

  const degrees = YunliMapGL.metersToUnits(customMapObj._map.getCenter(), circleQueryRadius);
  const delCoors = [circleQueryCenter[0] + degrees, circleQueryCenter[1]];
  const delMarker = new YunliMapGL.Marker({
    src: getImageUrl('/assets/datai/gis/removeicon.png'),
    scale: 0.1,
    position: delCoors,
    //anchor: 'bottom',
    zIndex: 991,
    rotation: 0,
    offset: [0, 50],
  });
  delMarker.hide();
  customMapObj._map.add(delMarker);

  delMarker.on('click', () => {
    // resetStyle(queryLayer);
    customMapObj._map.remove(circle);
    customMapObj._map.remove(delMarker);
    infoText && customMapObj._map.remove(infoText);
    dragMarker && customMapObj._map.remove(dragMarker);
  });

  // if (deleteCircleVariable) {
  //   const EventEmitter = window.globalEventEmitter;
  //   const listenFn = () => {
  //     const deleteLineVar = getExpDataByKey(deleteCircleVariable, 'data');
  //     if (deleteLineVar == 0) {
  //       resetStyle(queryLayer);
  //       customMapObj._map.remove(circle);
  //       customMapObj._map.remove(delMarker);
  //       infoText && customMapObj._map.remove(infoText);
  //       dragMarker && customMapObj._map.remove(dragMarker);
  //       EventEmitter.removeListener(deleteCircleVariable, listenFn);
  //     }
  //   };

  //   EventEmitter.on(deleteCircleVariable, listenFn);
  // }
  circle.on('mouseover', () => {
    delMarker.show();
  });
  circle.on('mouseout', () => {
    delMarker.hide();
  });
  let infoText = null;
  let dragMarker = null;
  if (!isDrag) {
    return { circle, delMarker };
  }

  const markup = `<div style=" color: #fff; font-size: 16px">${formatLength(circleQueryRadius)}</div>`;
  // 使用 InfoWindow 来创建文本标记
  const infoTextCoors = [delCoors[0] + 0.0001, delCoors[1] + 0.08];
  infoText = new YunliMapGL.InfoWindow({
    content: markup,
    position: infoTextCoors,
    // offset: [50, 0],
    // anchor: 'top-right',
    zooms: [8, 18],
    zIndex: 999, // 信息窗体的CSS层级
    stopEvents: false, // 忽略信息窗本身的事件处理从而直接操作地图
  });
  // customMapObj._map.add(infoText);

  if (!dragging) {
    dragMarker = new YunliMapGL.Marker({
      src: getImageUrl('/assets/datai/gis/dragArrow.png'),
      scale: 0.37,
      position: delCoors,
      // anchor: 'bottom',
      zIndex: 991,
      rotation: 0,
      draggable: true,
    });
    customMapObj._map.add(dragMarker);
    dragMarker.on('dragend', (event) => {
      // console.log('dragMarker', event);
      const { target } = event || {};
      const movePosition = target.getPosition();
      const moveQueryRadius = YunliMapGL.unitsToMeters(circleQueryCenter, movePosition[0] - circleQueryCenter[0]);
      if (moveQueryRadius < 0) {
        target.setPosition([delCoors[0], delCoors[1]]);
        return false;
      }
      target.setPosition([movePosition[0], delCoors[1]]);
      const { circleObj, textObj, delMarkerObj } = dragMarker._circleOpts;
      customMapObj._map.remove(circleObj);
      customMapObj._map.remove(textObj);
      customMapObj._map.remove(delMarkerObj);
      queryCircleData({
        ...opts,
        circleQueryRadius: moveQueryRadius,
        dragging: true,
        dragTarget: dragMarker,
      });
    });
  } else {
    dragMarker = dragTarget;
  }
  dragMarker._circleOpts = {
    circleObj: circle,
    textObj: infoText,
    delMarkerObj: delMarker,
  };
  return { circle, infoText, delMarker, dragMarker };
};

const addCircleMask = (opts = {}) => {
  let {
    customMapObj,
    circleQueryCenter,
    circleQueryRadius,
    circleBackground,
    dragging,
    isDrag,
    dragTarget,
    queryLayer,
    deleteCircleVariable,
  } = opts;
  circleQueryRadius = Number(circleQueryRadius);
  const circle = new YunliMap.Circle({
    coordinates: circleQueryCenter,
    style: {
      background: circleBackground || 'rgba(255,255,255,0.65)',
      borderColor: 'rgba(255,255,255,0.65)',
      borderWidth: 2,
      //lineDash:[2]
    },
    zIndex: 9,
    radius: circleQueryRadius,
  });
  customMapObj._map.add(circle);
  //let degrees =  YunliMap.lengthToDegrees(circleQueryRadius, 'metres');
  const degrees = YunliMap.metersToUnits(customMapObj._map.getCenter(), circleQueryRadius);
  const delCoors = [circleQueryCenter[0] + degrees, circleQueryCenter[1]];
  const delMarker = new YunliMap.Marker({
    //icon:'http://172.26.30.146:31800/gis/static/images/marker.png',
    icon: getImageUrl('/assets/datai/gis/removeicon.png'),
    scale: 0.1,
    position: delCoors,
    //anchor: 'bottom',
    zIndex: 991,
    rotation: 0,
    offset: [-100, 150],
  });
  delMarker.setVisible(false);
  customMapObj._map.add(delMarker);

  delMarker.on('click', () => {
    // resetStyle(queryLayer);
    customMapObj._map.remove(circle);
    customMapObj._map.remove(delMarker);
    infoText && customMapObj._map.remove(infoText);
    dragMarker && customMapObj._map.remove(dragMarker);
  });

  // if (deleteCircleVariable) {
  //   //监听变量清除数据
  //   const EventEmitter = window.globalEventEmitter;
  //   const listenFn = () => {
  //     const deleteLineVar = getExpDataByKey(deleteCircleVariable, 'data');
  //     // console.log(deleteLineVar, 'remover', searchKeyVal);
  //     if (deleteLineVar == 0) {
  //       resetStyle(queryLayer);
  //       customMapObj._map.remove(circle);
  //       customMapObj._map.remove(delMarker);
  //       infoText && customMapObj._map.remove(infoText);
  //       dragMarker && customMapObj._map.remove(dragMarker);
  //       EventEmitter.removeListener(deleteCircleVariable, listenFn);
  //     }
  //   };
  //   EventEmitter.on(deleteCircleVariable, listenFn);
  // }

  circle.on('mouseover', () => {
    delMarker.setVisible(true);
  });
  circle.on('mouseout', () => {
    delMarker.setVisible(false);
  });
  let infoText = null;
  let dragMarker = null;
  const moveTimer = null;
  if (!isDrag) {
    return { circle, delMarker };
  }
  infoText = new YunliMap.Text({
    coordinate: delCoors,
    textAlign: 'center',
    textBaseline: 'middle',
    offsetX: 43,
    offsetY: -10,
    scale: 1,
    //zooms: [8, 18],
    rotation: 0,
    text: formatLength(circleQueryRadius),
    zIndex: 991,
    color: '#fff',
  });
  customMapObj._map.add(infoText);

  if (!dragging) {
    dragMarker = new YunliMap.Marker({
      icon: getImageUrl('/assets/datai/gis/dragArrow.png'),
      scale: 0.37,
      position: delCoors,
      anchor: 'bottom',
      zIndex: 991,
      rotation: 0,
      draggable: true,
    });
    customMapObj._map.add(dragMarker);
    dragMarker.on('dragging', (event) => {
      const { target } = event || {};
      const movePosition = target.getPosition();
      const moveQueryRadius = YunliMap.unitsToMeters(circleQueryCenter, movePosition[0] - circleQueryCenter[0]);
      if (moveQueryRadius < 0) {
        target.setPosition([delCoors[0], delCoors[1]]);
        return false;
      }
      target.setPosition([movePosition[0], delCoors[1]]);
      //if (moveTimer) {
      //  clearTimeout(moveTimer);
      //}
      //moveTimer = setTimeout(() => {
      const { circleObj, textObj, delMarkerObj } = dragMarker._circleOpts;
      customMapObj._map.remove(circleObj);
      customMapObj._map.remove(textObj);
      customMapObj._map.remove(delMarkerObj);
      //customMapObj._map.remove(dragMarker);
      queryCircleData({
        ...opts,
        circleQueryRadius: moveQueryRadius,
        dragging: true,
        dragTarget: dragMarker,
      });
      //}, 500);
    });
  } else {
    dragMarker = dragTarget;
  }
  dragMarker._circleOpts = {
    circleObj: circle,
    textObj: infoText,
    delMarkerObj: delMarker,
  };
  return { circle, infoText, delMarker, dragMarker };
};
const add3dCircleMask = (opts = {}) => {
  let {
    customMapObj,
    circleQueryCenter,
    circleQueryRadius,
    dragging,
    isDrag,
    dragTarget,
    queryLayer,
    circleBackground = 'rgba(255,255,255,0.65)',
    deleteCircleVariable,
  } = opts;
  circleQueryRadius = Number(circleQueryRadius);
  const circle = new YunliMap3D.Entity({
    position: Cesium.Cartesian3.fromDegrees(circleQueryCenter[0], circleQueryCenter[1]),
    ellipse: {
      semiMinorAxis: circleQueryRadius,
      semiMajorAxis: circleQueryRadius,
      zIndex: 9,
      height: 1,
      //outline: true, //outline要有效果，必须给height一个值
      //outlineColor: Cesium.Color.fromCssColorString('#aaec11'), //边框颜色
      material: Cesium.Color.fromCssColorString(circleBackground), //填充颜色
    },
  });
  customMapObj._map.add(circle);
  //let degrees =  YunliMap.lengthToDegrees(circleQueryRadius, 'metres');
  const degrees = YunliMap3D.metersToUnits(customMapObj._map.getCenter(), circleQueryRadius);
  const delCoors = [circleQueryCenter[0] + degrees, circleQueryCenter[1]];
  const delMarker = new YunliMap3D.Marker({
    //icon:'http://172.26.30.146:31800/gis/static/images/marker.png',
    icon: getImageUrl('/assets/datai/gis/removeicon.png'),
    scale: 0.1,
    position: delCoors,
    anchor: 'bottom',
    zIndex: 100,
    rotation: 0,
    offset: [0, 30],
  });
  customMapObj._map.add(delMarker);
  delMarker.on('click', () => {
    resetStyle(queryLayer);
    customMapObj._map.remove(circle);
    customMapObj._map.remove(delMarker);
    customMapObj._map.remove(dragMarker);
    customMapObj._map.remove(infoText);
  });

  if (deleteCircleVariable) {
    //监听变量清除数据
    const EventEmitter = window.globalEventEmitter;
    const listenFn = () => {
      const deleteLineVar = getExpDataByKey(deleteCircleVariable, 'data');
      // console.log(deleteLineVar, 'remover', searchKeyVal);
      if (deleteLineVar == 0) {
        resetStyle(queryLayer);
        customMapObj._map.remove(circle);
        customMapObj._map.remove(delMarker);
        customMapObj._map.remove(dragMarker);
        customMapObj._map.remove(infoText);
        EventEmitter.removeListener(deleteCircleVariable, listenFn);
      }
    };
    EventEmitter.on(deleteCircleVariable, listenFn);
  }

  let infoText = null;
  let dragMarker = null;
  if (!isDrag) {
    return;
  }

  infoText = new YunliMap3D.Text({
    position: delCoors,
    textAlign: 'center',
    textBaseline: 'middle',
    pixelOffset: [43, -10],
    // offsetX: 43,
    // offsetY: -10,
    //scale: 1,
    //zooms: [8, 18],
    //rotation: 0,
    text: formatLength(circleQueryRadius),
    //  zIndex: 991,
    color: '#fff',
  });
  customMapObj._map.add(infoText);
  if (!dragging) {
    dragMarker = new YunliMap3D.Marker({
      icon: getImageUrl('/assets/datai/gis/dragArrow.png'),
      scale: 0.37,
      position: delCoors,
      anchor: 'bottom',
      zIndex: 991,
      rotation: 0,
      draggable: true,
    });
    customMapObj._map.add(dragMarker);
    customMapObj._map.mapEvent.enablePointMove = true;
    dragMarker.on('dragend', (event) => {
      const pos = dragMarker.csEntity.position._value;
      const carto = Cesium.Cartographic.fromCartesian(pos);
      const degreeLng = Cesium.Math.toDegrees(carto.longitude);
      const degreeLat = Cesium.Math.toDegrees(carto.latitude);
      let moveQueryRadius = YunliMap3D.unitsToMeters(circleQueryCenter, degreeLng - circleQueryCenter[0]);

      dragMarker.position = [degreeLng, degreeLat];
      if (moveQueryRadius < 0) {
        dragMarker.position = [delCoors[0], delCoors[1]];
        moveQueryRadius = circleQueryRadius;
      }
      const { circleObj, textObj, delMarkerObj } = dragMarker._circleOpts;
      customMapObj._map.remove(circleObj);
      customMapObj._map.remove(textObj);
      customMapObj._map.remove(delMarkerObj);

      queryCircleData({
        ...opts,
        circleQueryRadius: moveQueryRadius,
        dragging: true,
        dragTarget: dragMarker,
      });
    });
  } else {
    dragMarker = dragTarget;
  }
  dragMarker._circleOpts = {
    circleObj: circle,
    textObj: infoText,
    delMarkerObj: delMarker,
  };
};

/**
 *主要是显示图层点位、标注，样式还原成基础样式
 * @param queryLayer 图层实列
 */
const resetStyle = (queryLayer = []) => {
  const names = ['setPolygonStyle', 'setPointStyle', '_setPolyLineStyle', 'resetPolygonStyle'];
  queryLayer.forEach((layer) => {
    const type = layer.type.split('-')[layer.type.includes('map-base') ? 4 : 5];
    const setStyleName = names.find((item) => {
      if (layer.type === '@yl/datai-com-map-gl-base-polygon-layer' && item === 'resetPolygonStyle') {
        return 'resetPolygonStyle';
      }
      // if (layer.type === '@yl/datai-com-map-base-polygon-layer') {
      //   return '_setPolygonStyle';
      // }
      return item.toLowerCase().includes(type.toLowerCase());
    });

    if (!setStyleName) {
      return;
    }
    const { isTileLayer, states = {} } = layer.instance?.layer_instance;
    if (isTileLayer) {
      layer.instance?.layer_instance?._selectLayer?.updateParams({
        cql_filter: '1=1',
        _: Date.now(),
        styles: states.wms_style_code ?? '', // 图层样式
      });
      return;
    }
    layer.instance?.layer_instance?.features.forEach((feature) => {
      if (!feature) return;
      const { _baseLegendStyle, _legend } = feature;
      if (typeof feature.show === 'function') {
        feature.show();
      } else {
        feature.show = true;
      }
      layer.instance.layer_instance[setStyleName] &&
        layer.instance.layer_instance[setStyleName](feature, _baseLegendStyle || _legend);
      if (feature._label?.enable ?? feature._label?.enabled) {
        if (feature.labelText && typeof feature.labelText.show === 'function') {
          feature.labelText && feature.labelText.show();
        } else {
          feature.labelText && (feature.labelText.show = true);
          feature?.label && (feature.label.show = true);
        }
        const fnType = layer.instance.layer_instance['_setLabels'] ? '_setLabels' : '_setFeatureLabel';
        layer.instance.layer_instance[fnType]({
          feature,
          label: feature._label,
          labelPanes: feature._labelPanes,
        });
      }
    });
  });
};

const formatLength = (val) => {
  let num = val;
  let unit = 'm';
  if (num / 1000 > 1) {
    num = num / 1000;
    unit = 'km';
  }
  const lenArr = num.toString().split('.');
  if (lenArr.length > 1 && lenArr[1].length > 3) {
    num = num.toFixed(3);
  }
  return num + unit;
};
//获取业务图层layercode
const parseSysLayerConfig = (sysLayerList) => {
  const relationLayerCodes = [];
  sysLayerList.forEach((sysLayer) => {
    const sysLayerConfig = JSON.parse(sysLayer.jsonConfig);
    const foundationMap = sysLayerConfig.componentList.find((list) => {
      return 'MapFoundationPlan' === list.englishName || 'Map3DFoundationPlan' === list.englishName;
    });
    const tmpLayer = foundationMap?.layers.find((layer) => {
      return mapBaseLayerType.includes(layer.type);
    });
    relationLayerCodes.push(tmpLayer._attr.relation_layer_code);
  });
  return relationLayerCodes;
};

//轨迹回放
export const gisTrackPlayback = (opts = {}) => {
  let { index, data, customMapObj, gisDataCache } = opts;
  data = { ...data, customConfigs: data.gisAction.mapTrackPlayback };
  const { mapType } = data;
  const eventActionKey = data.otherInject?.actionKey;
  const layerList = window.layerList || [];

  const {
    isLocationZoom = true, //是否地图定位
    isAutoPlayBack = false, //是否自动播放
  } = data.customConfigs;
  data.customConfigs = Object.assign(
    {},
    {
      trackPlayPath: [
        {
          longitude: 116.381612,
          latitude: 39.87011,
          height: 1000,
          patrolTime: '2022-01-19 16:07:45',
        },
        {
          longitude: 116.437482,
          latitude: 39.86955,
          height: 1000,
          patrolTime: '2022-01-19 16:15:45',
        },
      ],
    },
    data.customConfigs,
  );

  const trackPlaybackOpts = parseTrackPlayPath({
    ...data.customConfigs,
    mapType,
  });
  const trackPlayInsKey = 'trackPlayIns-' + eventActionKey;
  const trackPlayButtonsKey = 'trackPlayButtons-' + eventActionKey;
  const isMap3D = mapType.indexOf('Map3D') > -1 ? true : false;
  trackPlaybackOpts.map = customMapObj._map;
  //console.log('gisTrackPlayback*trackPlaybackOpts*', opts, trackPlaybackOpts);
  const mapInstanceFn = getMapFn(mapType);
  if (gisDataCache[trackPlayInsKey]) {
    gisDataCache[trackPlayInsKey].destroy();
  }
  if (Array.isArray(gisDataCache[trackPlayButtonsKey])) {
    gisDataCache[trackPlayButtonsKey].forEach((obj) => {
      customMapObj._map.remove(obj);
    });
  }

  // console.log(trackPlaybackOpts, '++++++++++');
  const trackPlayIns = new mapInstanceFn.TrackPlayback(trackPlaybackOpts);
  gisDataCache[trackPlayInsKey] = trackPlayIns;
  gisDataCache[trackPlayButtonsKey] = [];

  //定位缩放
  if (isLocationZoom) {
    const pathArr = trackPlaybackOpts.path;
    const trackStart = Array.isArray(pathArr[0]) ? pathArr[0] : pathArr[0].coordinate;

    customMapObj._map.setCenter(trackStart);
    const trackExtent = getMapViewExtent(pathArr);
    let mapFitFn = 'fit';
    const fitOpts = {
      extent: trackExtent,
      padding: [100, 100, 100, 100],
    };
    if (mapType === 'Map3DFoundationPlan') {
      mapFitFn = 'fitView';
      fitOpts.padding = [0.1, 0.1, 0.1, 0.1];
    }
    if (mapType === 'MapGlFoundationPlan') {
      customMapObj._map.fitExtent(trackExtent, {
        padding: { top: 100, bottom: 100, left: 100, right: 100 },
      });
    } else {
      customMapObj._map[mapFitFn](fitOpts);
    }
  }

  //监听轨迹回放停止
  trackPlayIns.onStop(function () {
    //console.log('运行到终点了');
    //轨迹播放联动描述列表
    linkDesTrackPlayPath(data.customConfigs, {
      trackPlayIns,
      isMap3D,
      isEnd: true,
    });
    //联动通用视频播放器
    linkVideoTrackPlayPath(data.customConfigs, 'end', { trackPlayIns });
  });
  //监听轨迹回放执行
  trackPlayIns.onProgress(function (info) {
    // console.log('里程', info, trackPlayIns.marker.getPosition());
    linkDesTrackPlayPath(data.customConfigs, { trackPlayIns, isMap3D });
  });

  //添加按键
  genTrackPlayBtn({
    ...data.customConfigs,
    eventActionKey,
    gisDataCache,
    customMapObj,
    trackPlayIns,
    mapType,
  });
  linkVideoTrackPlayPath(data.customConfigs, 'init', { trackPlayIns });

  handleTrackPolylineEvent({
    ...data.customConfigs,
    eventActionKey,
    gisDataCache,
    customMapObj,
    trackPlayIns,
    isMap3D,
  });
};
//轨迹播放事件
const handleTrackPolylineEvent = (opts = {}) => {
  const {
    isHoverWin = false,
    hoverCompKey = '',
    isClickWin = false,
    trackPlayIns,
    customMapObj,
    eventActionKey,
    gisDataCache,
    isMap3D,
  } = opts;
  const polylineObj = trackPlayIns.polyline;
  // console.log(trackPlayIns, polylineObj, '+handleTrackPolylineEvent+++++++++++++');
  const trackPlayMoveHandleCbKey = 'trackPlayMoveHandleCb-' + eventActionKey;
  const callbackShowWinFun = (opts = {}, type, event) => {
    const {
      isHoverWin = false,
      hoverOffsetX = 0,
      hoverOffsetY = 0,
      hoverCompKey = '',
      isClickWin = false,
      clickOffsetX = 0,
      clickOffsetY = 0,
      clickCompKey = '',
      trackPlayIns,
      customMapObj,
      polylineObj,
      isMap3D,
    } = opts;
    const isClickType = type == 'click' ? true : false;
    let compKey = '',
      offsetX = 0,
      offsetY = 0;
    if (isClickType) {
      compKey = clickCompKey;
      offsetX = clickOffsetX;
      offsetY = clickOffsetY;
    } else {
      compKey = hoverCompKey;
      offsetX = hoverOffsetX;
      offsetY = hoverOffsetY;
    }
    setMapPixelWin({
      mapInstance: customMapObj._map,
      feature: polylineObj,
      coordinates: event.coordinate || polylineObj._coordinates,
      pixel: event.pixel,
      compKey,
      action: type,
      offsetX,
      offsetY,
      follow: true,
      isMap3D,
    });
  };
  const showWinOpts = { ...opts, polylineObj };
  gisDataCache[trackPlayMoveHandleCbKey] = () => {
    polylineObj.customMoveHandleCb && polylineObj.customMoveHandleCb();
  };
  if (isMap3D) {
    customMapObj._map.on('postrender', gisDataCache[trackPlayMoveHandleCbKey]);
  } else {
    customMapObj._map.on('mapmove', gisDataCache[trackPlayMoveHandleCbKey]);
  }
  if (isHoverWin) {
    polylineObj.on('mouseover', (e) => {
      callbackShowWinFun(showWinOpts, 'hover', e);
    });
    polylineObj.on('mouseout', () => {
      const windom = document.querySelector(`[data-key*="${hoverCompKey}"]`);
      if (windom && windom.style.display != 'none') {
        windom.style.display = 'none';
      }
    });
  }

  if (isClickWin) {
    polylineObj.on('click', (e) => {
      callbackShowWinFun(showWinOpts, 'click', e);
    });
  }
};
//轨迹播放联动描述列表
const linkDesTrackPlayPath = (opts = {}, { trackPlayIns, isMap3D, isEnd }) => {
  let {
    trackPlayPathType,
    trackPlayPath,
    trackPlayPathVariable,
    trackPlayPathVariableExp,

    isDesLinkage = false,
    isVideoLinkage = false,
    desComKey,
    desComDataType = 'muti',
    singleContentTextField,
    mutiTitleTextField,
    mutiLabelTextField,
    mutiContentTextField,
    videoComKey,
    videoComSyncTime = 10,
    dataParams = [],
  } = opts;

  //let { marker } = trackPlayIns;
  const driveTarget = isMap3D ? trackPlayIns.target : trackPlayIns.marker;
  const curPosition = isMap3D ? driveTarget.position : driveTarget.getPosition();
  if (trackPlayPathType == 2) {
    trackPlayPath = getExpDataByKey(trackPlayPathVariable, trackPlayPathVariableExp);
    dataParams.length && (trackPlayPath = getMapData(opts, dataParams).trackPlayPath);
  }
  let curPoint = null;
  for (let i = 0, len = trackPlayPath.length; i < len; i++) {
    const { longitude, latitude } = trackPlayPath[i];
    if (isEnd) {
      curPoint = trackPlayPath[len - 1];
      trackPlayIns._curPoint = curPoint;
      break;
    } else if (Math.abs(longitude - curPosition[0]) < 0.001 && Math.abs(latitude - curPosition[1]) < 0.001) {
      curPoint = trackPlayPath[i];
      trackPlayIns._curPoint = curPoint;
      break;
    }
  }
  trackPlayIns._trackPlayPath = trackPlayPath;
  if (!curPoint || !isDesLinkage) {
    return;
  }
  const desComEle = $('[data-key="@com_' + desComKey + '"]');
  const desContainer = desComEle?.find('.ant-descriptions-item-container');
  let desLabel = null;
  let desContent = null;
  if (desComDataType == 'single') {
    //singleContentTextField
    const content = curPoint[singleContentTextField] || '';
    desContent = desContainer?.eq(0).find('.ant-descriptions-item-content');
    desContent?.eq(0).html('<span>' + content + '</span>');
  } else {
    //mutiTitleTextField
    if (mutiTitleTextField) {
      const title = curPoint[mutiTitleTextField] || '';
      const desTitle = desComEle?.find('.ant-descriptions-title > span');
      desTitle?.eq(0).html(title);
    }

    $.each(desContainer, (index, item) => {
      //mutiLabelTextField
      if (Array.isArray(mutiLabelTextField) && mutiLabelTextField[index]) {
        const label = curPoint[mutiLabelTextField[index]] || '';
        desLabel = $(item)?.find('.ant-descriptions-item-label');
        desLabel?.eq(0).html(label);
      }
      //mutiContentTextField
      if (Array.isArray(mutiContentTextField) && mutiContentTextField[index]) {
        const content = curPoint[mutiContentTextField[index]] || '';
        desContent = $(item)?.find('.ant-descriptions-item-content');
        desContent?.eq(0).html('<span>' + content + '</span>');
      }
    });
  }
};
//轨迹播放联动通用视频播放器
const linkVideoTrackPlayPath = (opts = {}, state, other = {}) => {
  const { isVideoLinkage = false, videoComKey, videoComSyncTime = 10, isAutoPlayBack = false } = opts;
  const { trackPlayIns } = other;
  if (!isVideoLinkage || !videoComKey) {
    return;
  }
  const videoPlayer = comList.get(videoComKey)?.player;
  videoPlayer._linkTimerState = state;
  if (state == 'start') {
    videoPlayer.play();
  } else if (state == 'end') {
    const cacheDuration = videoPlayer?.cache_?.duration;
    //cacheDuration && videoPlayer.currentTime(cacheDuration);
  } else if (state == 'pause') {
    videoPlayer.pause();
  } else if (state == 'stop') {
    videoPlayer.pause();
    videoPlayer.currentTime(0);
  } else if (state == 'close') {
    trackPlayIns?._linkTimer && clearInterval(trackPlayIns._linkTimer);
  } else if (state == 'init') {
    if (isAutoPlayBack && videoPlayer) {
      videoPlayer.currentTime(0);
      videoPlayer.play();
    }
    trackPlayIns._linkTimer = setInterval(() => {
      const { _curPoint = {}, _trackPlayPath } = trackPlayIns;
      const { patrolTime } = _curPoint;
      if (
        patrolTime &&
        (videoPlayer._linkTimerState == 'init' ||
          videoPlayer._linkTimerState == 'start' ||
          videoPlayer._linkTimerState == 'end')
      ) {
        try {
          let timeTmp = new Date(patrolTime).valueOf() - new Date(_trackPlayPath[0].patrolTime).valueOf();
          timeTmp = timeTmp / 1000;
          const videoDur = videoPlayer.duration();
          const videoCur = videoPlayer.currentTime();
          if (timeTmp < videoDur) {
            videoPlayer.currentTime(timeTmp);
            videoPlayer.play();
          } else if (videoCur != videoDur) {
            videoPlayer.currentTime(videoDur);
          }
        } catch (e) {
          console.error('轨迹播放时间同步失败，', e);
        }
      }
    }, videoComSyncTime * 1000);
  }
};
const parseTrackPlayPath = (opts = {}) => {
  let {
    trackPlayPathType = 1,
    trackPlayPath,
    trackPlayPathVariable = '',
    trackPlayPathVariableExp = 'data',

    trackPlayDriveImg = getImageUrl('/assets/datai/gis/playDrive.png'),
    rotation = 90,

    trackPlayLineType = 1,
    trackPlayLine = 'none',
    trackPlayLineColor = '#F90',
    trackPlayLineWidth = 1,

    playBackWay = 1, //播放方式
    playBackSpeed = 200,
    playBackTimes = 200,
    mapType,
    dataParams = [],
  } = opts;
  const trackPlayPathArr = [];
  if (trackPlayPathType != 1) {
    trackPlayPath = getExpDataByKey(trackPlayPathVariable, trackPlayPathVariableExp);
    dataParams.length && (trackPlayPath = getMapData(opts, dataParams).trackPlayPath);
  }
  if (playBackWay == 1 && Array.isArray(trackPlayPath)) {
    trackPlayPath.forEach((path) => {
      const pathTmp =
        mapType.indexOf('Map3D') > -1 ? [path.longitude, path.latitude, path.height] : [path.longitude, path.latitude];
      trackPlayPathArr.push(pathTmp);
    });
  } else if (playBackWay == 2 && Array.isArray(trackPlayPath)) {
    trackPlayPath.forEach((path) => {
      const pathTmp =
        mapType.indexOf('Map3D') > -1 ? [path.longitude, path.latitude, path.height] : [path.longitude, path.latitude];
      trackPlayPathArr.push({
        coordinate: pathTmp,
        time: path.patrolTime,
      });
    });
  }
  let diffOpts = {};
  let trackPlaybackOpts = {
    path: trackPlayPathArr, // 轨迹数据
    autoRotation: true, // 自动旋转图标角度
    iconDegree: rotation || 90,
  };
  const markerIcon = trackPlayDriveImg.charAt(0) == '.' ? trackPlayDriveImg.substr(1) : trackPlayDriveImg;
  if (mapType.indexOf('3D') > -1) {
    diffOpts = {
      polyline: {
        polyline: {
          material: Cesium.Color.fromCssColorString(trackPlayLineColor),
          width: trackPlayLineWidth,
          zIndex: 990,
        },
      },
      target: {
        icon: trackPlayDriveImg,
        anchor: 'center',
        //rotation: rotation || 0,
        zIndex: 995,
      },
    };
    if (trackPlayLineType == 1 && trackPlayLine != 'none') {
      diffOpts.polyline.polyline.material = new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.fromCssColorString(trackPlayLineColor),
        dashLength: 50.0,
      });
    }
  } else if (mapType === 'MapGlFoundationPlan') {
    diffOpts = {
      polyline: {
        color: trackPlayLineColor,
        width: trackPlayLineWidth,
        zIndex: 990,
      },
      marker: new YunliMapGL.Marker({
        src: trackPlayDriveImg,
        anchor: 'center',
        //rotation: rotation || 0,
        zIndex: 995,
        // infowindow: {},
      }),
    };
    if (trackPlayLineType == 1) {
      trackPlayLine != 'none' && (diffOpts.polyline.lineDash = [10, 10]);
    } else {
      diffOpts.polyline.lineType = trackPlayLine;
    }
  } else {
    diffOpts = {
      polyline: {
        style: {
          color: trackPlayLineColor,
          lineWidth: trackPlayLineWidth,
          //strokeWidth: 4,
          //strokeColor: '#FFF'
        },
        zIndex: 990,
        //showArrow: true
      },
      marker: {
        icon: trackPlayDriveImg,
        anchor: 'center',
        //rotation: rotation || 0,
        zIndex: 995,
        infowindow: {},
      },
    };
    if (trackPlayLineType == 1) {
      trackPlayLine != 'none' && (diffOpts.polyline.style.lineDash = [10, 10]);
    } else {
      diffOpts.polyline.style.lineType = trackPlayLine;
    }
  }
  trackPlaybackOpts = Object.assign({}, trackPlaybackOpts, diffOpts);
  //console.log('trackPlaybackOpts**', trackPlaybackOpts);
  if (playBackWay == 2) {
    trackPlaybackOpts.mode = 'withTime';
    trackPlaybackOpts.speed = playBackTimes;
  } else {
    trackPlaybackOpts.speed = playBackSpeed;
  }

  return trackPlaybackOpts;
};
const genTrackPlayBtn = (opts = {}) => {
  let {
    trackPlayPathType = 1,
    trackPlayPath,
    trackPlayPathVariable = '',
    trackPlayPathVariableExp = 'data',

    trackPlayBeginImg = getImageUrl('/assets/datai/gis/playBegin.png'),
    trackPlayEndImg = getImageUrl('/assets/datai/gis/playEnd.png'),
    trackPlayStartImg = getImageUrl('/assets/datai/gis/playStart.png'),
    trackPlayPauseImg = getImageUrl('/assets/datai/gis/playPause.png'),
    trackPlayStopImg = getImageUrl('/assets/datai/gis/playStop.png'),
    trackPlayCloseImg = getImageUrl('/assets/datai/gis/playClose.png'),
    offsetX = 0,
    offsetY = 0,

    isLocationZoom = true, //是否地图定位
    isAutoPlayBack = false, //是否自动播放
    customMapObj,
    eventActionKey,
    gisDataCache,
    trackPlayIns,
    clickCompKey,
    mapType,
    dataParams = [],
  } = opts;
  //console.log(opts, 'genTrackPlayBtn++++++++++++++++++++++++++++');
  let infowindow = null;
  let beginMarker = null;
  let endMarker = null;
  const mapInstanceFn = getMapFn(mapType);
  const mapIns = customMapObj._map;
  const trackPlayInsKey = 'trackPlayIns-' + eventActionKey;
  const trackPlayButtonsKey = 'trackPlayButtons-' + eventActionKey;
  const trackPlayMoveHandleCbKey = 'trackPlayMoveHandleCb-' + eventActionKey;

  //开始动画
  if (isAutoPlayBack) {
    trackPlayIns.start();
  }
  const trackPlayPathArr = [];
  if (trackPlayPathType != 1) {
    trackPlayPath = getExpDataByKey(trackPlayPathVariable, trackPlayPathVariableExp);
    dataParams.length && (trackPlayPath = getMapData(opts, dataParams).trackPlayPath);
  }
  trackPlayPath.forEach((path) => {
    const pathTmp =
      mapType.indexOf('Map3D') > -1 ? [path.longitude, path.latitude, path.height] : [path.longitude, path.latitude];
    trackPlayPathArr.push(pathTmp);
  });
  // console.log('trackPlayPathArr**', trackPlayPathArr);
  const playControlClick = (type) => {
    if (type == 'start') {
      trackPlayIns.start();
      linkVideoTrackPlayPath(opts, 'start');
    } else if (type == 'pause') {
      trackPlayIns.pause();
      linkVideoTrackPlayPath(opts, 'pause');
    } else if (type == 'stop') {
      trackPlayIns.stop();
      linkVideoTrackPlayPath(opts, 'stop');
    } else if (type == 'close') {
      infowindow && mapIns.remove(infowindow);
      beginMarker && mapIns.remove(beginMarker);
      endMarker && mapIns.remove(endMarker);

      if (mapType.indexOf('Map3D') > -1) {
        mapIns.off('postrender', gisDataCache[trackPlayMoveHandleCbKey]);
      } else {
        //console.log('关闭', gisDataCache[trackPlayMoveHandleCbKey]);
        mapIns.off('mapmove', gisDataCache[trackPlayMoveHandleCbKey]);
      }
      gisDataCache[trackPlayMoveHandleCbKey] = undefined;

      const clickWindom = document.querySelector(`[data-key*="${clickCompKey}"]`);
      if (clickWindom && clickWindom.style.display != 'none') {
        clickWindom.style.display = 'none';
      }

      trackPlayIns.destroy();
      gisDataCache[trackPlayInsKey] = undefined;
      gisDataCache[trackPlayButtonsKey] = [];
      linkVideoTrackPlayPath(opts, 'close');
    }
  };
  const btnImgStyle = {
    cursor: 'pointer',
    maxWidth: '100px ',
    maxHeight: '100px ',
  };
  const contentEle = convertElementToDomString(
    <div className='playback-control-inforwindow' style={{ display: 'flex' }}>
      <img
        alt='开始'
        style={btnImgStyle}
        src={trackPlayStartImg}
        onClick={() => {
          playControlClick('start');
        }}
      />

      <img
        alt='暂停'
        style={btnImgStyle}
        src={trackPlayPauseImg}
        onClick={() => {
          playControlClick('pause');
        }}
      />

      <img
        alt='停止'
        style={btnImgStyle}
        src={trackPlayStopImg}
        onClick={() => {
          playControlClick('stop');
        }}
      />

      <img
        alt='关闭'
        style={btnImgStyle}
        src={trackPlayCloseImg}
        onClick={() => {
          playControlClick('close');
        }}
      />
    </div>,
  );
  const beginObj = {
    icon: trackPlayBeginImg,
    //scale: 0.1,
    position: trackPlayPathArr[0],
    anchor: 'center',
    //offset: [-30, 0],
    zIndex: 993,
    rotation: 0,
  };
  const endObj = {
    icon: trackPlayEndImg,
    //scale: 0.1,
    position: trackPlayPathArr[trackPlayPathArr.length - 1],
    anchor: 'center',
    zIndex: 993,
    rotation: 0,
  };
  let offset = [offsetX, -30 + offsetY, 20, 20];
  if (mapType === 'MapGlFoundationPlan') {
    beginObj.src = trackPlayBeginImg;
    endObj.src = trackPlayEndImg;
    offset = [-70 + offsetX, -80 + offsetY];
  }

  infowindow = new mapInstanceFn.InfoWindow({
    content: contentEle,
    position: trackPlayPathArr[0],
    offset,
  });
  mapIns.add(infowindow);
  gisDataCache[trackPlayButtonsKey].push(infowindow);

  const beginIcon = trackPlayBeginImg.charAt(0) == '.' ? trackPlayBeginImg.substr(1) : trackPlayBeginImg;

  beginMarker = new mapInstanceFn.Marker(beginObj);
  mapIns.add(beginMarker);
  gisDataCache[trackPlayButtonsKey].push(beginMarker);
  const endIcon = trackPlayEndImg.charAt(0) == '.' ? trackPlayEndImg.substr(1) : trackPlayEndImg;

  endMarker = new mapInstanceFn.Marker(endObj);
  mapIns.add(endMarker);
  gisDataCache[trackPlayButtonsKey].push(endMarker);
};

//routepath
export const gisRoutePath = (opts = {}) => {
  let { index, data, customMapObj } = opts;
  data = { ...data, customConfigs: data.gisAction.mapRoutePath };
  const {
    routePathType = 'refer',
    routePathVal = [
      [
        [116.3884131, 39.9068394],
        [116.3892487, 39.9068682],
        [116.3895836, 39.9068629],
        [116.3898012, 39.9068393],
        [116.3902089, 39.9068064],
        [116.3906166, 39.9067776],
        [116.3907265, 39.9067735],
        [116.3916144, 39.9067879],
        [116.3918727, 39.9068157],
        [116.3922796, 39.906864],
        [116.3926846, 39.9069196],
        [116.393177, 39.9069818],
        [116.3940825, 39.9070069],
      ],
    ], //外金水河
    routePathVariable = '',
    routePathVariableExp = 'data',
    routePathLayer = '',
    dataParams = [],
  } = data.customConfigs;
  // console.log('++++++++++', dataParams);
  const map3dTypeFlag = data.mapType.indexOf('Map3D') > -1;
  const coordinatesField = map3dTypeFlag ? 'arrPositions' : 'coordinates';

  const mapInstanceFn = map3dTypeFlag ? YunliMap3D : YunliMap;
  const mapRoutePathFn = map3dTypeFlag ? YunliMap3D.FlowLineGlow : YunliMap.RoutePath;
  let featureCoordinates = routePathVal;
  const routePathParam = handleRoutePathParams({
    ...data.customConfigs,
    map3dTypeFlag: map3dTypeFlag,
  });
  if (routePathType == 'map') {
    mapInstanceFn.getFeatureByFilter({
      filter: {},
      layerCode: routePathLayer,
      needPolygon: true,
      callback: (data) => {
        Array.isArray(data) &&
          data.forEach((item) => {
            routePathParam[coordinatesField] = item.coordinates[0];
            const routePathObj = new mapRoutePathFn(routePathParam);
            customMapObj._map.add(routePathObj);
          });
      },
    });
    return;
  } else if (routePathType == 'refer') {
    featureCoordinates = getExpDataByKey(routePathVariable, routePathVariableExp);
    //兼容历史default默认值情况
    if (!featureCoordinates) {
      featureCoordinates = routePathVal;
    }
    dataParams.length && (featureCoordinates = getMapData(opts, dataParams).routePathVal);
  }
  //console.log('gisRoutePath**featureCoordinates*', featureCoordinates);
  featureCoordinates.forEach((item) => {
    routePathParam[coordinatesField] = item;
    const routePathObj = new mapRoutePathFn(routePathParam);
    customMapObj._map.add(routePathObj);
  });
};

const handleRoutePathParams = (opts = {}) => {
  const {
    routePathLineColor = '#FC3',
    routePathLineWidth = 2,
    routePathLineLength = 30,
    routePathSpeed = 500,
    routePathMultiple = 1,
    routePathDuration = 1000,
    map3dTypeFlag,
  } = opts;
  //三维轨迹飞线(流动线)
  const routePathParam = map3dTypeFlag
    ? {
        //arrPositions: item,
        color: routePathLineColor,
        width: routePathLineWidth,
        duration: routePathDuration,
        showPercent: Number(routePathLineLength) / 100,
        repeatNum: 1,
        zIndex: 9999,
      }
    : {
        //coordinates: item,
        lineColor: routePathLineColor,
        lineWidth: routePathLineWidth,
        speed: routePathSpeed,
        length: Number(routePathLineLength) / 100,
        multiple: routePathMultiple,
        zIndex: 999,
      };

  return routePathParam;
};

export const gisHeatLine = (opts = {}) => {
  let { index, data, customMapObj, customMapPlan } = opts;
  data = { ...data, customConfigs: data.gisAction.mapHeatLine };
  const layerList = window.layerList || [];
  const {
    heatLineType = 'default',
    heatLineVal = [
      { key: '101', count: 100 },
      { key: '201', count: 200 },
      { key: '301', count: 300 },
    ],
    heatLineVariable = '',
    heatLineVariableExp = 'data',
    heatLineLayer = '',

    highLineColor = 'rgba( 248, 231 , 28 , 1 )',
    lowLineColor = 'rgba( 208, 2 , 27 , 1 )',
    heatLineWidth = 2,
    dataParams = [],
  } = data.customConfigs;

  let heatLineData = heatLineVal;
  const mapInstanceFn = data.mapType.indexOf('Map3D') > -1 ? YunliMap3D : YunliMap;
  const mapLayers = customMapPlan.layers;
  if (heatLineType == 'refer') {
    heatLineData = getExpDataByKey(heatLineVariable, heatLineVariableExp);
  }

  dataParams.length && (heatLineData = getMapData(opts, dataParams).heatLineVal);

  // let layerIndex = _.findIndex(mapLayers, ['key', heatLineLayer]);
  const layerIndex = mapLayers.findIndex((layer) => layer.key === heatLineLayer);
  const curLayer = mapLayers[layerIndex];
  let curLayerIns = curLayer?.instance?.layer_instance;
  // console.log('gisHeatLine****');
  if (!curLayer.createFlag) {
    dynamicLoadMapLayer({
      layer: curLayer,
      baseMap: customMapPlan,
      gisEventType: true,
    });
  }

  //有instance
  if (curLayerIns) {
    curLayerIns.renderHeatLine &&
      curLayerIns.renderHeatLine({
        heatLineData,
        highLineColor,
        lowLineColor,
        heatLineWidth,
      });
  } else {
    window.globalEventEmitter.on('renderLayerEvent', (layerCode) => {
      curLayerIns = curLayer?.instance.layer_instance;
      curLayerIns.renderHeatLine &&
        curLayerIns.renderHeatLine({
          heatLineData,
          highLineColor,
          lowLineColor,
          heatLineWidth,
        });
    });
  }
};

//触发点击
export const gisTriggerClick = (opts = {}) => {
  const EventEmitter = window.globalEventEmitter;
  let { index, data, customMapObj, customMapPlan } = opts;
  data = { ...data, customConfigs: data.gisAction.mapSetClick };
  const layerList = window.layerList || [];
  const {
    clickLayerVariable,
    clickLayerVariableExp,
    clickDataVariable,
    clickDataVariableExp,
    dataParams = [],
  } = data.customConfigs;
  let clickLayerVal = getExpDataByKey(clickLayerVariable, clickLayerVariableExp);
  const clickDataVal = getExpDataByKey(clickDataVariable, clickDataVariableExp);
  const mapLayers = customMapPlan.layers;
  // console.log(layerList, index, '----');

  if (dataParams.length) {
    const objData = getMapData(opts, dataParams);
    clickLayerVal = objData.clickLayerVal;
  }

  mapLayers.forEach((item) => {
    if (!item.instance) return;
    const { relation_layer_code = '', filterKey } = item.instance.compAttr;
    const layer_key = item.key;
    if (relation_layer_code === clickLayerVal.layerCode || layer_key === clickLayerVal.layerKey) {
      const curLayer = item.instance.layer_instance;
      if (curLayer?.isTileLayer) {
        if (!filterKey?.text) {
          message.warning('检查选中图层指定key字段是否选中！');
          return;
        }
        if (!clickLayerVal?.dataId) {
          message.warning('检查dataId是否存在');
          return;
        }

        getRenderGisData(relation_layer_code, data.mapType, filterKey.text, [clickLayerVal.dataId], curLayer).then(
          (data) => {
            if (!data?.length && !clickLayerVal.dataMsg) {
              message.warning('数据不存在');
              return;
            }
            if (data?.length) {
              clickLayerVal.data = data;
            } else {
              clickLayerVal.data = [clickLayerVal.dataMsg];
            }
            curLayer.triggersClickLayer && curLayer.triggersClickLayer(clickLayerVal);
          },
        );
      } else if (clickLayerVal?.layerKey && curLayer?._triggerClick) {
        curLayer._triggerClick({
          clickLayerVal: { ...clickLayerVal, layerCode: relation_layer_code },
          clickDataVal,
        });
      } else {
        EventEmitter.emit('dataiClickLayerEvent', {
          clickLayerVal,
          clickDataVal,
        });
      }
    }
  });
  //gisSetClickFilter(index, data, { clickLayerVal, clickDataVal });
};

const convertElementToDomString = (element) => {
  const newDom = document.createElement('div');
  ReactDOM.render(element, newDom);
  return newDom;
};
const getMapViewExtent = (coordinates) => {
  const lon = [];
  const lat = [];
  coordinates.forEach((item) => {
    const position = Array.isArray(item) ? item : item.coordinate;
    lon.push(position[0]);
    lat.push(position[1]);
  });
  const extent = [
    Math.min.apply(null, lon),
    Math.min.apply(null, lat),
    Math.max.apply(null, lon),
    Math.max.apply(null, lat),
  ];
  return extent;
};
const getExpDataByKey = (variable, expression) => {
  let data = getDataByKey(variable);
  //const fn = new Function('data', 'expression');
  data = babelTransform(expression, data); // 运行时ES6转ES5
  return data;
};

// 切换底图
export const gisChangeBaseLayer = (opts = {}) => {
  const { data, index, customMapObj, customMapPlan } = opts;
  const dataConfig = data.gisAction.mapCutEvent;
  const basicLayers = { type: dataConfig.mapType };
  const mapLayers = customMapPlan.layers;

  // console.log('dataConfig', dataConfig);
  // console.log('mapLayers', mapLayers);

  if (dataConfig.mapType == 'MapGlFoundationPlan') {
    basicLayers.url = {
      mapType: dataConfig.mapUrl, // v8.5,0 设置底图类型
    };
    basicLayers.type = 'MapGlBasicLayerNew'; // 设置底图englishName值，用于查找对应的底图
    basicLayers.thirdLayerType = dataConfig.thirdLayerType; // 自定义底图值
    basicLayers.thirdLayerTypeUrl = dataConfig.thirdLayerTypeUrl;
  } else if (dataConfig.mapType == 'Map3DBasicLayer') {
    basicLayers.url = {
      layerType: 'defaultLayers',
      defaultLayerType: dataConfig.mapUrl,
    };
    basicLayers.thirdLayerType = dataConfig.thirdLayerType;
    basicLayers.thirdLayerTypeUrl = dataConfig.thirdLayerTypeUrl;
  } else if (dataConfig.mapType == 'Map2DBasicLayer') {
    basicLayers.url = {
      mapType: dataConfig.mapUrl,
    };
    basicLayers.type = 'MapGaudOnline';
    basicLayers.thirdLayerType = dataConfig.thirdLayerType;
    basicLayers.thirdLayerTypeUrl = dataConfig.thirdLayerTypeUrl;
  }

  if (basicLayers.url) {
    const { thirdLayerType, thirdLayerTypeUrl, url: basicUrl } = basicLayers;
    const basicLayerOpts = Object.assign({}, basicUrl); // 设置mapType

    // let layerIndex = _.findIndex(mapLayers, [
    //   'englishName',
    //   basicLayers['type']
    // ]);

    // 获取第一个当前地图的底图
    const layerIndex = mapLayers.findIndex((layer) => layer.englishName === basicLayers.type);
    const mapBasicLayer = mapLayers[layerIndex].instance;
    if (!mapBasicLayer) return;

    // 高德在线 是否将gps坐标矫正为高德坐标
    if (basicUrl.mapType == 0) {
      basicLayerOpts.gpsCoordTransBool = dataConfig.gpsCoordTransBool || false;
    }

    // 自定义底图
    if ((basicUrl.mapType == 5 || basicUrl.defaultLayerType == 'custom') && thirdLayerType && thirdLayerTypeUrl) {
      basicLayerOpts.customMapType = thirdLayerType;
      basicLayerOpts.customMapUrl = thirdLayerTypeUrl;
    }
    // console.log('basicLayerOpts', basicLayerOpts);

    // v8.5.0 重置底图设置
    mapBasicLayer.mergeAttr(basicLayerOpts);
  }
};

//卷帘对比
export const gisSwipCompare = (opts = {}) => {
  const { data, index, customMapObj } = opts;
  const dataConfig = data.gisAction.mapSwipCompare;
  // console.log('gisSwipCompare****', dataConfig, customMapObj);
  let {
    mapType,
    swipDirect = 'horizontal',
    leftLayerType = 'default',
    leftLayerVal = [
      {
        layerCode: 'tianditu',
        zIndex: 2,
      },
    ],
    leftLayerVariable,
    leftLayerVariableExp = 'data',
    rightLayerType = 'default',
    rightLayerVal = [
      {
        layerCode: 'tianditu_img',
        zIndex: 2,
      },
    ],
    rightLayerVariable,
    rightLayerVariableExp = 'data',
    dataParams = [],
  } = dataConfig;

  if (leftLayerType != 'default') {
    leftLayerVal = getExpDataByKey(leftLayerVariable, leftLayerVariableExp);
  }
  if (rightLayerType != 'default') {
    rightLayerVal = getExpDataByKey(rightLayerVariable, rightLayerVariableExp);
  }

  if (dataParams.length) {
    const objData = getMapData(opts, dataParams);
    leftLayerVal = objData.leftLayerVal;
    rightLayerVal = objData.rightLayerVal;
  }

  const leftSplitDirect = swipDirect == 'horizontal' ? 'left' : 'top';
  const rightSplitDirect = swipDirect == 'horizontal' ? 'right' : 'bottom';

  const layerList = window.layerList || [];
  // let mapLayers = _.find(layerList, ['key', data['mapKey']])?.layers || [];
  const mapLayers = layerList.find((layer) => layer.key === data.mapKey)?.layers || [];

  const mapIns = customMapObj._map;
  const map3dTypeFlag = mapType.indexOf('Map3D') > -1;
  if (swipDirect == 'close') {
    map3dTypeFlag ? mapIns?._rollerShades.close() : mapIns?.setSwipeBar('none');
    mapIns._swipeView &&
      Object.keys(mapIns._swipeView).forEach((item) => {
        mapIns._swipeView[item]._swipeViewLayerFlag && mapIns.remove(mapIns._swipeView[item]);
      });
    mapIns._swipeView = {};
    return;
  }

  if (!map3dTypeFlag) {
    mapIns.setSwipeBar(swipDirect);
  } else if (!mapIns._rollerShades) {
    mapIns._rollerShades = new YunliMap3D.RollerShades({
      map: mapIns,
      firstTilesetsList: [],
      secondTilesetsList: [],
      firstLayersList: [],
      secondLayersList: [],
    });
  }

  const leftLayers = handleSwipView({
    mapIns,
    mapLayers,
    map3dTypeFlag,
    layers: leftLayerVal,
    splitDirect: leftSplitDirect,
  });
  const rightLayers = handleSwipView({
    mapIns,
    mapLayers,
    map3dTypeFlag,
    layers: rightLayerVal,
    splitDirect: rightSplitDirect,
  });

  if (map3dTypeFlag && mapIns?._rollerShades) {
    const firstLayersArr = getTilesetLayer({ layers: leftLayers, mapIns });
    const secondLayersArr = getTilesetLayer({ layers: rightLayers, mapIns });
    mapIns._rollerShades.firstTilesetsList = firstLayersArr[0];
    mapIns._rollerShades.secondTilesetsList = secondLayersArr[0];
    mapIns._rollerShades.firstLayersList = firstLayersArr[1];
    mapIns._rollerShades.secondLayersList = secondLayersArr[1];
    // mapIns._rollerShades.close();
    mapIns._rollerShades.open();
  }

  const layersArr = [...leftLayers, ...rightLayers];
  mapIns._swipeView &&
    Object.keys(mapIns._swipeView).forEach((item) => {
      if (!layersArr.includes(item)) {
        mapIns._swipeView[item]._swipeViewLayerFlag && mapIns.remove(mapIns._swipeView[item]);
        delete mapIns._swipeView[item];
      }
    });
};

const handleSwipView = (opts = {}) => {
  const { mapIns, mapLayers, map3dTypeFlag, layers, splitDirect } = opts;
  !mapIns._swipeView && (mapIns._swipeView = {});
  const swipeView = mapIns._swipeView;
  const retLayerArr = [];
  if (!Array.isArray(layers)) {
    return retLayerArr;
  }

  layers.forEach((itemLayer) => {
    let layerCodeDirect = itemLayer.layerCode + '#' + splitDirect;
    if (!swipeView[layerCodeDirect] && itemLayer.hasOwnProperty('layerKey')) {
      layerCodeDirect = itemLayer.layerKey + '#' + splitDirect;
      const existLayer = mapLayers.find((item) => item.key == itemLayer.layerKey);
      const subLayerIns = existLayer.instance.deleteComponent;
      if (Array.isArray(subLayerIns) && subLayerIns.length > 0) {
        mapIns._swipeView[layerCodeDirect] = subLayerIns[0];
      }
    } else if (!swipeView[layerCodeDirect] && itemLayer.hasOwnProperty('layerCode')) {
      const layerConfig = {
        layerCode: itemLayer.layerCode,
        //splitDirection: splitDirect,
        zIndex: itemLayer.zIndex ? itemLayer.zIndex : 9,
      };
      let layerHandleFun = undefined;
      if (!map3dTypeFlag) {
        layerConfig.splitDirection = splitDirect;
        layerHandleFun = YunliMap.Layer;
      } else {
        layerHandleFun = YunliMap3D.Layer;
      }
      const layerIns = new layerHandleFun(layerConfig);
      layerIns._swipeViewLayerFlag = true;
      mapIns.add(layerIns);
      mapIns._swipeView[layerCodeDirect] = layerIns;
    } else if (!map3dTypeFlag) {
      mapIns._swipeView[layerCodeDirect].setSplitDirection(splitDirect);
    }
    retLayerArr.push(layerCodeDirect);
  });
  return retLayerArr;
};

const getTilesetLayer = (opts = {}) => {
  const { layers, mapIns } = opts;
  const tilesetLayers = [];
  const otherLayers = [];

  layers?.forEach((item) => {
    const layer = mapIns._swipeView[item];
    if (layer.type == 'yl/datai-com-map-3D-tileset-layer') {
      tilesetLayers.push(layer);
    } else {
      otherLayers.push(layer);
    }
  });
  return [tilesetLayers, otherLayers];
};

//水位升降
export const gisDynamicWater = (opts = {}) => {
  const { data, index, customMapObj } = opts;
  const dataConfig = data.gisAction.mapDynamicWater;
  const mapIns = customMapObj._map;
  let dynamicWaterIns = null;
  let waterHeight = 0;
  const waterLayerArr = [];

  let {
    waterType = 'default',
    waterVal = [
      [116.389965, 39.912106],
      [116.389965, 39.911655],
      [116.385789, 39.911531],
      [116.385266, 39.921488],
      [116.395772, 39.921805],
      [116.396263, 39.911826],
      [116.39202, 39.911773],
      [116.392009, 39.912212],
      [116.395493, 39.912353],
      [116.395104, 39.921344],
      [116.385972, 39.920984],
      [116.386485, 39.912068],
      [116.389918, 39.912157],
    ],
    waterVariable = '',
    waterVariableExp = 'data',
    waterLayer = '',
    sysWaterLayer = '',
    heightType = 'default',
    heightVal = {
      height: 20,
    },
    heightVariable = '',
    heightVariableExp = 'data',
    heightMapField = 'height',
    waterColor,
    waterImg = getImageUrl('/assets/datai/gis/water_map.jpg'),
  } = dataConfig;

  const dynamicWaterFun = (params = {}) => {
    const { waterVal, waterHeight } = params;
    const waterOpts = {
      //waterMap: 'http://172.26.30.146:31700/gis/static/images/water_map.jpg',
      waterMap: waterImg,
      show: true,
      // color: "#5cec02", //颜色，不赋值则取默认值
      alpha: 0.7, //透明度
      frequency: 1000, //波浪的个数
      height: waterHeight,
      hierarchy: {
        positions: waterVal,
      },
    };
    if (waterColor) {
      waterOpts.color = waterColor;
    }
    dynamicWaterIns = new YunliMap3D.WaterBody(waterOpts);
    waterLayerArr.push(dynamicWaterIns);
    mapIns.add(dynamicWaterIns);
  };

  if (heightType == 'refer') {
    heightVal = getExpDataByKey(heightVariable, heightVariableExp);
    globalEventEmitter.on(heightVariable, () => {
      heightVal = getExpDataByKey(heightVariable, heightVariableExp);
      waterLayerArr.forEach((waterLayer) => {
        waterLayer.height = heightVal[heightMapField];
      });
    });
  }
  waterHeight = heightVal[heightMapField];

  if (waterType == 'refer') {
    waterVal = getExpDataByKey(waterVariable, waterVariableExp);
  } else if (waterType == 'base-map' || waterType == 'sys-map') {
    const layerCode = waterType == 'base-map' ? waterLayer : sysWaterLayer;
    YunliMap3D.getFeatureByFilter({
      filter: {},
      layerCode: layerCode,
      needPolygon: true,
      callback: (data) => {
        //console.log('dynamicWaterFun*****data******', data);
        Array.isArray(data) &&
          data.forEach((item) => {
            const coordinates = item.coordinates[0][0];
            if (Array.isArray(item.coordinates) && item.coordinates.length > 1) {
              item.coordinates.forEach((coordinate) => {
                dynamicWaterFun({ waterVal: coordinate[0], waterHeight });
              });
            } else {
              dynamicWaterFun({ waterVal: coordinates, waterHeight });
            }
          });
      },
    });
    return;
  }
  dynamicWaterFun({ waterVal, waterHeight });
};

// v6.19 绘制线
// v8.6.0 新增支持GL地图
export const gisMapDrawLine = (opts = {}) => {
  const { data, customMapObj, gisDataCache } = opts;
  const dataConfig = data.gisAction.mapDrawLine;
  const { mapType } = data;
  const mapIns = customMapObj._map;
  const {
    borderColorSw = 'default', // 边框颜色类型
    borderColorVal = 'rgba(0,255,255,1)', // 边框颜色填写值
    borderColorVariable = '', // 边框颜色引用变量
    borderColorVariableExp = 'data', //边框颜色引用变量表达式

    borderWidthSw = 'default', //边框宽度类型
    borderWidthVal = 5, // 边框宽度填写值
    borderWidthVariable = '', // 边框宽度引用变量
    borderWidthVariableExp = 'data', // 边框宽度引用变量表达式
    //
    isRes = true, //是否返回数据
    queryLineVariable, //保存数据变量
    // 删除折线id
    deleteLineVariable,
    dataParams = [],
    saveParams = [],
  } = dataConfig;

  let bc, bw;
  if (dataParams.length) {
    const objData = getMapData(opts, dataParams);
    bc = objData.borderColorVal;
    bw = objData.borderWidthVal;
  }
  // console.log('deleteLineVariable', deleteLineVariable);
  // 边框颜色
  let borderColor =
    borderColorSw == 'default'
      ? borderColorVal
      : dataParams.length
      ? bc
      : getExpDataByKey(borderColorVariable, borderColorVariableExp);
  borderColor = String(borderColor);
  //边框宽度
  let borderWidth =
    borderWidthSw == 'default'
      ? borderWidthVal
      : dataParams.length
      ? bw
      : getExpDataByKey(borderWidthVariable, borderWidthVariableExp);
  borderWidth = isNaN(parseInt(borderWidth)) ? 5 : parseInt(borderWidth);
  if (mapType === 'Map3DBasicLayer' || mapType === 'Map3DFoundationPlan') {
    handleDrawToolMap3D({
      customMapObj,
      gisDataCache,
      drawType: YunliMap3D.enumToolType.draw.polyline,
      drawOpts: {
        borderColor,
        borderWidth,
      },
      isRes,
      queryVariable: queryLineVariable,
      deleteVariable: deleteLineVariable,
      saveParams,
    });
  } else if (mapType === 'MapGlFoundationPlan') {
    handleDrawToolMapGL({
      customMapObj,
      gisDataCache,
      drawType: 'polyline',
      drawOpts: {
        borderColor,
        borderWidth,
      },
      isRes,
      queryVariable: queryLineVariable,
      deleteVariable: deleteLineVariable,
      saveParams,
    });
  } else {
    // 2d 绘制线
    mapIns.drawFeature('LineString', {
      style: {
        // 绘制中样式
        borderColor: borderColor,
        borderWidth: borderWidth,
      },
      endStyle: {
        // 绘制完成样式
        borderColor: borderColor,
        borderWidth: borderWidth,
      },
      start: function () {
        // 开始绘制
      },
      end: function (e) {
        // console.log(e);
        e.stopDraw(); //结束绘制
        const key = e.key;
        // 创建可访问的折线，
        const mapFn = window.YunliMap;
        let infowindow;
        const polyline = new mapFn.Polyline({
          coordinates: e.coordinates,
          style: {
            color: borderColor,
            lineWidth: borderWidth,
          },
        });

        const mouseoverPolyline = (e) => {
          // console.log('e', e);
          // 生成提示框
          infowindow = new mapFn.InfoWindow({
            content: deleteButton,
          });
          // 添加提示框
          mapIns.add(infowindow);
          infowindow.setPosition(e.coordinate);
          infowindow.show();
          infowindow.setOffset([0, 14]);
        };
        const mouseoutPolyline = () => {
          infowindow.hide();
        };
        const removePolyline = (mapIns, key, mapType, polyline, infowindow, mouseoverPolyline, mouseoutPolyline) => {
          if (mapType == 'Map3DBasicLayer' || mapType == 'Map3DFoundationPlan') {
            //
          } else {
            mapIns.clearDraw({
              draw_key: key,
            });
            polyline && polyline.removeTo(mapIns);
            polyline.off('mouseover', mouseoverPolyline);
            polyline.off('mouseout', mouseoutPolyline);
            polyline = null;
            infowindow && mapIns.remove(infowindow);
            infowindow = null;
          }
        };
        //生成删除按钮
        let deleteButton = convertElementToDomString(
          <Button
            type='primary'
            size='small'
            danger
            onClick={() => {
              removePolyline(mapIns, key, mapType, polyline, infowindow, mouseoverPolyline, mouseoutPolyline);
            }}
          >
            删除
          </Button>,
        );
        // // 生成提示框
        // infowindow = new mapFn.InfoWindow({
        //   content: deleteButton
        // });
        // // 添加提示框
        // mapIns.add(infowindow);
        // 添加鼠标监听事件
        polyline.on('mouseover', mouseoverPolyline);
        polyline.on('mouseout', mouseoutPolyline);
        // 添加折线
        polyline.addTo(mapIns);

        // 是否支持返回数据
        if (isRes) {
          // 更新全局存储的变量数据
          const obj = {
            coordinates: e.coordinates || [],
          };

          saveParams.length
            ? setMapData(opts, saveParams, obj)
            : queryLineVariable && setStoreData(queryLineVariable, obj);
        }
        // 删除之前的折线
        let timer = setTimeout(() => {
          mapIns.clearDraw({
            draw_key: key,
          });
          timer && clearTimeout(timer);
          timer = null;
        }, 20);
        //监听清零
        if (deleteLineVariable) {
          const EventEmitter = window.globalEventEmitter;
          EventEmitter.on(deleteLineVariable, () => {
            const deleteLineVar = getExpDataByKey(deleteLineVariable, 'data');
            if (deleteLineVar == 0) {
              removePolyline(mapIns, key, mapType, polyline, infowindow, mouseoverPolyline, mouseoutPolyline);
            }
          });
        }
      },
    });
  }
};
/**
 * 删除绘制线
 */
// export const removeGisMapDrawLine = (mapIns, mapType, key) => {
//   if (mapType == 'Map3DBasicLayer' || mapType == 'Map3DFoundationPlan') {
//     //
//   } else {
//     key &&
//       mapIns.clearDraw({
//         draw_key: key
//       });
//   }
// };
/**
 * 删除绘制线
 */

/**
 * 三维标绘
 * @param {*} opts
 */
const handleDrawToolMap3D = (opts = {}) => {
  const { customMapObj, gisDataCache, drawType, drawOpts } = opts;
  const { borderWidth, borderColor, background } = drawOpts;
  const clampToGround = false;
  const drawToolManager = initDrawToolManager(opts);
  const toolOpts = {
    type: drawType,
    style: {
      drawing: {
        clampToGround: clampToGround,
      },
      drawend: {
        material: Cesium.Color.fromCssColorString('#FF9900'),
      },
    },
  };
  const reStyle = {};
  switch (drawType) {
    case YunliMap3D.enumToolType.draw.polyline:
      reStyle.drawend = {
        width: Number(borderWidth),
        material: Cesium.Color.fromCssColorString(borderColor),
      };
      reStyle.drawing = reStyle.drawend;
      break;
    case YunliMap3D.enumToolType.draw.circle:
    case YunliMap3D.enumToolType.draw.rectangle:
    case YunliMap3D.enumToolType.draw.polygon:
      reStyle.drawend = {
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString(borderColor),
        outlineWidth: Number(borderWidth),
        material: Cesium.Color.fromCssColorString(background),
      };
      reStyle.drawing = reStyle.drawend;
      break;
  }
  toolOpts.style = Object.assign({}, toolOpts.style, reStyle);
  //console.log('toolOpts****', toolOpts, drawOpts);
  //customMapObj._map.depthTestAgainstTerrain = true;
  drawToolManager.enableTool(toolOpts);
};
const initDrawToolManager = (opts = {}) => {
  console.log('333');
  const { customMapObj, gisDataCache, deleteVariable, customMapPlan, saveParams } = opts;
  const mapIns = customMapObj._map;
  gisDataCache.drawToolOpts = opts;

  //清零
  if (!gisDataCache.hasOwnProperty('drawClearListenVar')) {
    gisDataCache.drawClearListenVar = {};
  }
  if (deleteVariable && !gisDataCache.drawClearListenVar.hasOwnProperty(deleteVariable)) {
    const EventEmitter = window.globalEventEmitter;
    EventEmitter.on(deleteVariable, () => {
      const deleteDrawVar = getExpDataByKey(deleteVariable, 'data');
      //&& gisDataCache['drawToolManager'].clearDraw();
      if (deleteDrawVar == 0 && Array.isArray(gisDataCache.drawClearListenVar[deleteVariable])) {
        gisDataCache.drawClearListenVar[deleteVariable].forEach((entity) => {
          // entity.show = false;
          entity.csEntity.show = false;
          // entity.removeTo(mapIns);
        });
        removeDataCache(mapIns, customMapPlan, gisDataCache);
        gisDataCache.drawClearListenVar[deleteVariable] = [];
      }
    });
    //gisDataCache['drawClearListenFlag'] = true;
    gisDataCache.drawClearListenVar[deleteVariable] = [];
  }
  if (gisDataCache.drawToolManager) {
    return gisDataCache.drawToolManager;
  }

  const drawToolManager = new YunliMap3D.ToolManager(mapIns);
  //drawToolManager.on(YunliMap3D.enumDrawStepType.finish, function (data) {
  // drawToolManager.disableTool();
  //});
  drawToolManager.on(YunliMap3D.enumDrawStepType.finish, function (data) {
    //console.log('监听到了finishDraw', data, drawToolManager.toolEnabled.type);

    const EventEmitter = window.globalEventEmitter;
    const variableKeyObj = saveParams.filter((item) => item.paramItemId === 'all')[0];
    // if (!variableKeyObj) return;
    if (variableKeyObj) {
      const { variableKey = '', expression = 'data' } = variableKeyObj;
      if (opts.isRes && !gisDataCache.isVariable3D) {
        // const { deleteVariable } = opts;
        gisDataCache.isVariable3D = true;
        const listenFn = () => {
          let data = getExpDataByKey(variableKey, expression);
          if (data.isDraw) return;
          handleCreate3D(data, mapIns, opts);
        };
        EventEmitter.on(variableKey, listenFn);
      }
    }

    const { isRes, queryVariable, deleteVariable } = gisDataCache.drawToolOpts;
    const variable = {};
    switch (drawToolManager.toolEnabled.type) {
      case YunliMap3D.enumToolType.draw.polyline:
        variable.coordinates = data._positions;
        break;
      case YunliMap3D.enumToolType.draw.circle:
        //variable['coordinates'] = data.getLngLats('polygon');
        variable.radius = data.radius;
        variable.coordinates = data.position;
        variable.type = 'circle';
        break;
      case YunliMap3D.enumToolType.draw.rectangle:
        const [minx, miny, maxx, maxy] = data?.coordinates;
        //let {south,west,north,east} = data.rectangle.coordinates.getValue()
        variable.coordinates = [
          [minx, miny],
          [maxx, miny],
          [maxx, maxy],
          [minx, maxy],
          [minx, miny],
        ];
        variable.type = 'polygon';
        break;
      case YunliMap3D.enumToolType.draw.polygon:
        data.hierarchy.positions.push(data.hierarchy.positions[0]);
        variable.coordinates = data.hierarchy.positions;
        variable.type = 'polygon';
        break;
    }
    // 是否支持返回数据
    if (isRes) {
      variable.key = data?.csEntity.id;
      variable.isDraw = true;
      saveParams.length
        ? setMapData(opts, saveParams, variable)
        : queryVariable && setStoreData(queryVariable, variable);
    }

    if (Array.isArray(gisDataCache.drawEntity)) {
      gisDataCache.drawEntity.push(data);
    } else {
      gisDataCache.drawEntity = [];
    }
    YunliMap3D.Entity.fromCesiumEntity(data);

    data.clampToGround = true;
    deleteVariable && gisDataCache.drawClearListenVar[deleteVariable].push(data);
    mapIns.mapEvent.enablePointMove = true;
    data.on('mouseover', function (e) {
      // console.log('toolmanger***mouseover***', data, e);
      gisDataCache.drawCurEntity = data;
      const curInfo = gisDataCache.drawDelInfowindow;
      //let center = e.feature?.getGraphicCenter();
      const hoverCoordinates = mapIns.pixelToCartesian(e.pixel.x, e.pixel.y);
      curInfo.setPosition(hoverCoordinates);
      curInfo.show = true;
      //curInfo.setOffset([0, 14]);
    });
    data.on('mouseout', function () {
      //console.log('toolmanger***mouseout***', data);
      gisDataCache.drawCurEntity = null;
      const curInfo = gisDataCache.drawDelInfowindow;
      curInfo.show = false;
    });
    drawToolManager.disableTool();
  });

  //生成删除按钮
  const deleteButton = convertElementToDomString(
    <Button
      type='primary'
      size='small'
      danger
      onClick={() => {
        if (gisDataCache.drawCurEntity) {
          gisDataCache.drawCurEntity.csEntity.show = false;
          // drawToolManager.removeOneEntity(gisDataCache['drawCurEntity']);
          removeSpaceQuery(gisDataCache.drawCurEntity?.csEntity.id, gisDataCache.layerIndex, customMapPlan);
        }
        if (gisDataCache.drawDelInfowindow) {
          gisDataCache.drawDelInfowindow.show = false;
        }
        gisDataCache.drawCurEntity = null;
      }}
    >
      删除
    </Button>,
  );
  const infowindow = new YunliMap3D.InfoWindow({
    content: deleteButton,
    show: false,
  });
  mapIns.add(infowindow);

  gisDataCache.drawToolManager = drawToolManager;
  gisDataCache.drawDelInfowindow = infowindow;
  return drawToolManager;
};
// 获取经纬度串
const pixelToCoordinate = (map_instance, pixel) => {
  const coordinates = map_instance?.pixelToCoordinate(pixel);
  return coordinates;
};

/**
 * 通过变量获取的数据生成圆矩形多边形
 * @param {object} data 图形数据，坐标，半径
 * @param {object} mapIns 地图实例
 * @param {opts} 图形样式，缓存对象
 */
const handleCreate3D = (data, mapIns, opts) => {
  const { gisDataCache, drawOpts, customMapPlan, index, deleteVariable } = opts;
  const { borderWidth, borderColor, background } = drawOpts;
  let { coordinates, type, radius, key } = data;

  if (Array.isArray(gisDataCache.drawClearListenVar[deleteVariable])) {
    gisDataCache.drawClearListenVar[deleteVariable].forEach((entity) => (entity.csEntity.show = false));
    gisDataCache.drawClearListenVar[deleteVariable] = [];
  }
  removeDataCache(mapIns, customMapPlan, gisDataCache);

  const obj = {
    fillColor: background,
    outline: true,
    outlineColor: borderColor,
    outlineWidth: borderWidth,
    show: true,
  };
  if (type === 'circle') {
    obj.position = coordinates;
    obj.radius = radius;
  }
  if (type === 'rectangle') {
    obj.coordinates = window.YunliMap3D.GeometryUtil.extentFromCoordinates(coordinates);
  }
  if (type === 'polygon') {
    obj.hierarchy = {
      positions: coordinates,
    };
  }
  const feaType = type.charAt(0).toUpperCase() + type.slice(1);
  const feature = new YunliMap3D[feaType](obj);
  //  添加区域;
  feature.addTo(mapIns);

  let infowindow, deleteButton;
  const mouseoverPolygon = (e) => {
    // 生成提示框
    if (!infowindow) {
      infowindow = new YunliMap3D.InfoWindow({
        content: deleteButton,
        // offset: [-24, -14],
        zIndex: 10000,
        stopEvents: true,
      });
      // 添加提示框;
      mapIns.add(infowindow);
    }
    infowindow.setPosition(mapIns.pixelToCartesian(e.pixel.x, e.pixel.y));
    infowindow.show = true;
  };
  // 鼠标移出隐藏弹窗
  const mouseoutPolygon = (e) => {
    infowindow.show = false;
  };
  //生成删除按钮
  deleteButton = convertElementToDomString(
    <Button
      type='primary'
      size='small'
      danger
      onClick={() => {
        // console.log('deleteButton');
        removePolygon(mapIns, feature, infowindow, mouseoverPolygon, mouseoutPolygon);
        if (type !== 'polyline') {
          removeSpaceQuery(key, index, customMapPlan);
        }
        // EventEmitter.removeListener(deleteVariable, cleanup);
      }}
    >
      删除
    </Button>,
  );
  gisDataCache.mapFea.push({ polygon: feature, key, infowindow, mouseoverPolygon, mouseoutPolygon });
  feature.on('mouseover', mouseoverPolygon);
  feature.on('mouseout', mouseoutPolygon);
};

/**
 * v8.5.0 GL标绘
 * @param {*} opts
 */
const handleDrawToolMapGL = (opts = {}) => {
  const { drawType, isMeasure } = opts;
  const drawTool = initDrawTool(opts);
  const type = drawType.toLocaleLowerCase();
  if (isMeasure) {
    // console.log('isMeasure type', type);
    // console.log('isMeasure drawTool', drawTool);
    drawTool?.drawFeature(type, {
      isMeasure: true,
    });
  } else {
    drawTool?.drawFeature(type);
  }
};

const initDrawTool = (opts = {}) => {
  const {
    customMapObj,
    gisDataCache,
    drawType,
    drawOpts,
    customMapPlan,
    index,
    isRes,
    queryVariable,
    saveParams,
    deleteVariable,
    isMeasure,
    textStyle,
  } = opts;
  console.log('111GL');
  const { borderWidth, borderColor, background } = drawOpts;
  const mapIns = customMapObj._map;
  // 判断是否需要重新生成Draw
  // if (!_.isEqual(gisDataCache['drawOptsGL'], drawOpts)  || !gisDataCache['drawToolGL']) {
  //   gisDataCache['drawOptsGL'] = drawOpts;
  // 删除
  if (gisDataCache.drawToolGL) {
    gisDataCache.drawToolGL_handleCreate && gisDataCache.drawToolGL.off('create', gisDataCache.drawToolGL_handleCreate);
    gisDataCache.drawToolGL_handleCreate = null;
    gisDataCache.drawToolGL.removeTo(mapIns, false);
    gisDataCache.drawToolGL = null;
  }
  const style = {
    fill: background,
    lineColor: borderColor,
    lineWidth: borderWidth,
  };
  // if (drawType === 'polyline') {
  //   style = {
  //     lineColor: borderColor,
  //     lineWidth: borderWidth,
  //   };
  // }
  let drawTool;
  if (isMeasure) {
    drawTool = new YunliMapGL.Draw({
      activeStyle: style,
      staticStyle: style,
      measureTipStyle: {
        color: textStyle.color,
        font: `${textStyle.fontStyle} normal ${textStyle.fontWeight} ${textStyle.fontSize}/${textStyle.lineHeight} ${textStyle.fontFamily}`,
        border: textStyle.border,
        backgroudColor: textStyle.background,
        borderRadius: textStyle.borderWidth,
        textAlign: textStyle.textAlign,
        // padding: "4px 10px",
      },
    });
  } else {
    drawTool = new YunliMapGL.Draw({
      activeStyle: style,
      staticStyle: style,
    });
  }

  mapIns.add(drawTool);
  gisDataCache.drawToolGL = drawTool;
  // }

  // 删除监听函数，防止重复监听
  if (gisDataCache.drawToolGL_handleCreate) {
    gisDataCache.drawToolGL?.off('create', gisDataCache.drawToolGL_handleCreate);
    gisDataCache.drawToolGL_handleCreate = null;
  }
  const addEmitGL = (data) => {
    const EventEmitter = window.globalEventEmitter;
    const variableKeyObj = saveParams.filter((item) => item.paramItemId === 'all')[0];
    if (variableKeyObj) {
      const { variableKey = '', expression = 'data' } = variableKeyObj;
      if (isRes && !gisDataCache.isVariableGl) {
        gisDataCache.isVariableGl = true;
        const listenFn = () => {
          let data = getExpDataByKey(variableKey, expression);
          if (!data.isDraw) {
            removeDataCache(mapIns, customMapPlan, gisDataCache, index);
          }
          handleCreate(data, mapIns, opts);
        };
        EventEmitter.on(variableKey, listenFn);
      }
    }

    if (!variableKeyObj) {
      handleCreate(data, mapIns, opts);
    }

    // 是否支持返回数据
    if (isRes) {
      let variable = {
        key: data.id,
        coordinates: data.coordinates || [],
        radius: data.radius,
        type: data.feaType,
        isDraw: true,
      };
      if (data?.feaType === 'polyline') {
        variable = {
          key: data.id,
          coordinates: data.coordinates || [],
          type: data.feaType,
        };
      }
      saveParams.length
        ? setMapData(opts, saveParams, variable)
        : queryVariable && setStoreData(queryVariable, variable);
    }
  };
  gisDataCache.drawToolGL_handleCreate = addEmitGL;
  gisDataCache.drawToolGL.on('create', gisDataCache.drawToolGL_handleCreate);

  if (gisDataCache.drawToolGL) {
    return gisDataCache.drawToolGL;
  }
};

/**
 * 标绘完成调用
 * @param {*} data
 */
const handleCreate = (data, mapIns, opts) => {
  const {
    customMapObj,
    gisDataCache,
    drawType,
    drawOpts,
    customMapPlan,
    index,
    isRes,
    queryVariable,
    saveParams,
    deleteVariable,
    isMeasure,
    textStyle,
  } = opts;
  const { borderWidth, borderColor, background } = drawOpts;
  console.log('handleCreate data', data);
  // console.log('handleCreate isMeasure', isMeasure);
  // 创建区域实列

  let feature;
  let { coordinates, type, radius, key, feaType = '' } = data;
  if (type === 'polyline' || feaType === 'polyline') {
    feature = new YunliMapGL.Polyline({
      coordinates,
      color: borderColor,
      width: borderWidth,
      renderOrder: 0,
    });
  } else {
    if (type === 'circle' || feaType === 'circle') {
      coordinates = YunliMapGL.GeometryUtil.polygonFromCircle(coordinates, radius, 100);
    }
    feature = new YunliMapGL.Polygon({
      coordinates,
      borderColor,
      borderWidth,
      color: background,
      renderOrder: 0,
    });
  }
  //  添加区域;
  feature.addTo(mapIns);
  gisDataCache.drawToolGL?.delete(key);
  if (isMeasure) {
    // 添加地图测量feature
    if (gisDataCache.drawToolGL_measure_feature) {
      gisDataCache.drawToolGL_measure_feature.push(feature);
    } else {
      gisDataCache.drawToolGL_measure_feature = [feature];
    }
    // 是否支持返回数据
    if (isRes) {
      const variable = {
        key: data.id,
        coordinates: data.coordinates || [],
        area: data.area,
        value: data.length,
        section_value: data.segmentLength,
      };
      saveParams.length
        ? setMapData(opts, saveParams, variable)
        : queryVariable && setStoreData(queryVariable, variable);
    }
  } else {
    // 结束绘制
    setTimeout(() => {
      gisDataCache.drawToolGL.finish();
    }, 200);

    let infowindow, deleteButton;
    // 鼠标移入事件
    const mouseoverPolygon = (e) => {
      // console.log('mouseoverPolygon e:', e, 'infowindow；', infowindow, 'deleteButton', deleteButton);
      // 生成提示框
      if (!infowindow) {
        infowindow = new YunliMapGL.InfoWindow({
          content: deleteButton,
          offset: [-24, -14],
          zIndex: 10000,
          stopEvents: true,
        });
        // 添加提示框;
        mapIns.add(infowindow);
      }
      infowindow.setPosition(pixelToCoordinate(mapIns, e.pixel));
      infowindow.visible = true;
      // console.log('mouseoverPolygon infowindow；', infowindow);
    };
    // 鼠标移出隐藏弹窗
    const mouseoutPolygon = (e) => {
      // console.log('mouseoutPolygon  infowindow；', infowindow);
      const position = pixelToCoordinate(mapIns, e.pixel);
      if (YunliMapGL.GeometryUtil.isPointInsidePolygon(position, coordinates)) {
        return;
      }
      infowindow.visible = false;
    };

    // 监听清零
    const EventEmitter = window.globalEventEmitter;
    function cleanup() {
      // console.log('cleanup');
      const deleteDrawVar = getExpDataByKey(deleteVariable, 'data');
      // console.log('deleteDrawVar', deleteDrawVar);
      const polygon = feature;
      if (deleteDrawVar == 0) {
        removePolygon(mapIns, polygon, infowindow, mouseoverPolygon, mouseoutPolygon);
        if (type !== 'polyline') {
          removeSpaceQuery(key, index, customMapPlan);
        }
        EventEmitter.removeListener(deleteVariable, cleanup);
      }
    }
    // console.log('add cleanup');
    EventEmitter.on(deleteVariable, cleanup);

    //生成删除按钮
    deleteButton = convertElementToDomString(
      <Button
        type='primary'
        size='small'
        danger
        onClick={() => {
          // console.log('deleteButton');
          removePolygon(mapIns, feature, infowindow, mouseoverPolygon, mouseoutPolygon);
          if (type !== 'polyline') {
            removeSpaceQuery(key, index, customMapPlan);
          }
          EventEmitter.removeListener(deleteVariable, cleanup);
        }}
      >
        删除
      </Button>,
    );
    // 添加鼠标监听事件;

    gisDataCache.mapFea.push({ polygon: feature, key, infowindow, mouseoverPolygon, mouseoutPolygon });

    feature.on('mouseover', mouseoverPolygon);
    feature.on('mouseout', mouseoutPolygon);
    //  添加区域;
    feature.addTo(mapIns);

    // 删除之前的标绘
    // console.log('handleCreate data.id', data.id);
    // gisDataCache['drawToolGL']?.removeFeature(data.id);
    gisDataCache.drawToolGL?.delete(data.id);
    // v8.5.0 删除监听函数，防止内存泄漏
    if (gisDataCache.drawToolGL_handleCreate) {
      gisDataCache.drawToolGL?.off('create', gisDataCache.drawToolGL_handleCreate);
      gisDataCache.drawToolGL_handleCreate = null;
    }
  }
};

export const gisGetCenter = (opts = {}) => {
  const { index, data, customMapObj } = opts;
  const dataConfig = data.gisAction.mapGetCenter;
  const layerList = window.layerList || [];

  const { centerVariable, saveParams = [] } = dataConfig;
  const extent = customMapObj.compAttr?.extent ? customMapObj.compAttr.extent : customMapObj.compAttr;
  const { longitude, latitude } = extent;
  //let centerVariableData = [longitude, latitude - 0];
  const centerVariableData = customMapObj._map.getCenter();
  saveParams.length
    ? setMapData(opts, saveParams, centerVariableData, 'getCenter')
    : setStoreData(centerVariable, centerVariableData);
};

export const gisGetZoom = (opts = {}) => {
  const { index, data, customMapObj } = opts;
  const dataConfig = data.gisAction.mapGetZoom;
  // let layerList = window.layerList || [];
  const { zoomVariable, saveParams = [] } = dataConfig;
  // let zoom = customMapObj.compAttr.zoom;
  //let { value: zoomVal } = zoom;
  const zoomVal = customMapObj._map.getZoom();
  saveParams.length
    ? setMapData(opts, saveParams, zoomMapList[Math.round(zoomVal) - 1])
    : setStoreData(zoomVariable, zoomMapList[Math.round(zoomVal) - 1]);
};

//地图选点
export const gitSetPoint = (opts = {}) => {
  const { data, customMapObj, customMapPlan } = opts;
  const { mapType } = data;
  const dataConfig = data.gisAction.mapSetPoint;
  let {
    addressVariable = '',
    // 点样式默认关闭
    pointStyleVisible = false,
    isVariable1 = false,
    isVariable2 = false,
    imgSrcVariable = undefined,
    imgSrcVariableExp = 'data',
    imgSizeVariable = undefined,
    imgSizeVariableExp = 'data',
    imgSrc = '/assets/datai/icons/marker.png',
    scale = 1,
    isLocal = true,
    deleteVariable = undefined,
    saveParams = [],
    dataParams = [],
  } = dataConfig;
  if (isVariable1) {
    imgSrc = getExpDataByKey(imgSrcVariable, imgSrcVariableExp);
    if (dataParams.length) {
      const objData = getMapData(opts, dataParams);
      imgSrc = objData.imgSrc;
    }
  }
  if (isVariable2) {
    scale = getExpDataByKey(imgSizeVariable, imgSizeVariableExp);
    if (dataParams.length) {
      const objData = getMapData(opts, dataParams);
      scale = objData.scale;
    }
  }

  let winDom;
  if (customMapPlan?.englishName == mapType) {
    winDom = document.querySelector(`[data-key*="${customMapPlan.key}"]`);
    if (winDom) {
      winDom.style.cursor = `url(${getImageUrl('/assets/datai/gis/mouseIcon.ani')}), auto`; // REVIEW liuming 前端静态资源动态获取
    }
  }
  const _map = customMapObj._map;
  const mouseType = mapType == 'Map3DFoundationPlan' ? 'mousemove' : 'pointermove';
  const pointCallback = (e) => {
    let coordinate = e.position;
    if (mapType === 'MapGlFoundationPlan') {
      coordinate = [e.lngLat.lng, e.lngLat.lat];
    }
    let addressMsg = {
      lng: coordinate[0],
      lat: coordinate[1],
    };
    winDom && (winDom.style.cursor = 'default');
    let mapInstanceFn = getMapFn(mapType);
    // 获取地理位置
    mapInstanceFn.getAddress(
      {
        coordinate, //经纬度
        inputType: 'gps', //支持类型gps, gcj02, baidu
        isLocal,
      },
      function ({ address }) {
        addressMsg.name = address || '未知位置';
        saveParams.length
          ? setMapData(opts, saveParams, addressMsg)
          : setStoreData(dataConfig?.addressVariable, addressMsg);
      },
    );

    if (pointStyleVisible && imgSrc) {
      let infowindow;
      // 设置点样式
      let objMarker = {
        icon: getImageUrl(imgSrc),
        scale,
        position: [coordinate[0], coordinate[1]],
        anchor: 'center',
        rotation: 0, //旋转角度，0-360，单位:度
      };
      if (mapType === 'MapGlFoundationPlan') {
        objMarker.src = getImageUrl(imgSrc);
        delete objMarker.icon;
      }
      var marker = new mapInstanceFn.Marker(objMarker);
      _map.add(marker);
      if (mapType === 'MapGlFoundationPlan') {
        marker.visible = false;
        setTimeout(() => {
          marker.visible = true;
        }, 200);
      }

      //生成删除按钮
      let deleteButton = convertElementToDomString(
        <Button
          type='primary'
          size='small'
          danger
          onClick={() => {
            removeMarker(_map, mapType, marker, infowindow, mouseoverMarker, mouseoutMarker);
          }}
        >
          删除
        </Button>,
      );
      // 生成提示框
      infowindow = new mapInstanceFn.InfoWindow({
        content: deleteButton,
      });
      // 添加提示框
      _map.add(infowindow);
      mapType == 'Map3DFoundationPlan' ? (infowindow.show = false) : infowindow.hide();

      const mouseoverMarker = (e) => {
        infowindow.setPosition(marker.position || marker._position);
        if (mapType == 'Map3DFoundationPlan') {
          infowindow.show = true;
          infowindow.offset = [0, 14];
        } else {
          infowindow.show();
          infowindow.setOffset ? infowindow.setOffset([0, 14]) : (infowindow._offset = [-14, -14]);
        }
      };
      const mouseoutMarker = (e) => {
        mapType == 'Map3DFoundationPlan' ? (infowindow.show = false) : infowindow.hide();
      };
      const removeMarker = () => {
        infowindow && _map.remove(infowindow);
        infowindow = null;
        if (marker) {
          marker.off('mouseover', mouseoverMarker);
          marker.off('mouseout', mouseoutMarker);
          marker.removeTo(_map);
        }
        marker = null;
      };

      // 添加鼠标监听事件
      marker.on('mouseover', mouseoverMarker);
      marker.on('mouseout', mouseoutMarker);
      //主要是处理gl鼠标移入到infowindow上触发mouseout事件
      if (mapType == 'MapGlFoundationPlan') {
        infowindow.on('mouseover', mouseoverMarker);
        infowindow.on('mouseout', mouseoutMarker);
      }

      //监听清零
      const EventEmitter = window.globalEventEmitter;
      EventEmitter.on(deleteVariable, () => {
        let deleteLineVar = getExpDataByKey(deleteVariable, 'data');
        if (deleteLineVar == 0) {
          //_map.remove(marker);
          removeMarker();
        }
      });
    }
    customMapObj._map.off('click', pointCallback);
    // _map.off(mouseType, mouseStyle);
  };

  _map.on('click', pointCallback);
  // let mouseStyle = () => {
  //   if (winDom.style.cursor == 'default') {
  //     winDom.style.cursor = 'url(./assets/datai/gis/mouseIcon.ani), auto';
  //   }
  // };
  // _map.on(mouseType, mouseStyle);
};

//图层显隐
export const gisMapLayerShow = (opts = {}) => {
  const { data, customMapPlan, gisDataCache } = opts;
  !gisDataCache.mapIsShow && (gisDataCache.mapIsShow = false);
  let {
    isVariable = false,
    mapShowExpression = 'data',
    mapShowVariable = undefined,
    layerCodeVal = [],
    visibleStatus = '0',
    layerType = [],
    treeLayer,
    dataParams = [],
  } = data.gisAction.mapShow;
  // 旧参数格式
  if (isVariable) {
    layerType = getExpDataByKey(mapShowVariable, mapShowExpression);
  }
  // 新参数格式
  if (dataParams.length && isVariable) {
    const objData = getMapData(opts, dataParams);
    layerType = objData.layerType;
  }
  const mapEnglishNameArr = [
    'BasePointLayer',
    'BasePolylineLayer',
    'BasePolygonLayer',
    'BasePointLayer3D',
    'BasePolylineLayer3D',
    'BasePolygonLayer3D',
    'BaseGifLayer2D',
    'BaseGifLayer3D',
  ];
  // v8.5.0 this.visible 控制显隐
  const visibleGLEnglistNameArr = [
    'MapBreathBubbleLayer',
    'MapHotmap',
    'MapFlyList',

    'Map3DHeatMapLayer',
    // 'MapGlBasicLayerNew',
    // 'MapGlBasePointLayer',
    // 'MapGlBasePolylineLayer',
    // 'MapGLBasePolygonLayer',
    // 'MapGLPlateLayer',
    // MapGlSceneController,
    'MapGlCircle',
    'MapGlCylinder',
    'MapGlDynamicsPoint',
    'MapGlFlyLine',
    'MapGlGeoFencing',
    'MapGlHeatMap',
    'MapGlHeatMapNew',
    'MapGlBuildingLayerNew',
    'MapGlInfoWindow',
    'MapGlLineHeat',
    'MapGlPathPlanning',
    'MapGlRegionLine',
    'MapGlRegionMask',
    'MapGlRegionPlate',
    'MapGlRegionHeat',
    'MapGlRainbowLine',
    'MapGlBubbleFlyLine',
    'MapGlCubeMaps',
    'MapGlStaticSign',
    'MapGlMaskLayer',
  ];

  customMapPlan.layers?.forEach((item) => {
    if (layerType.includes(item.key || v.value)) {
      //地图初始化点位隐藏
      if (!item.createFlag) {
        dynamicLoadMapLayer({
          layer: item,
          baseMap: customMapPlan,
          gisEventType: true,
        });
      }
      // 轮询是否有地图子图层实例
      const timer = setInterval(() => {
        let { instance, englishName } = item;
        let layerIns = instance;
        if (timer > 10000) {
          clearInterval(timer);
        }
        if (!layerIns) {
          return;
        }
        clearInterval(timer);
        if (mapEnglishNameArr.includes(englishName)) {
          if (!layerIns.layer_instance) {
            return;
          }
          layerIns = instance.layer_instance;
          switch (visibleStatus) {
            case '0':
              layerIns.isTileLayer
                ? layerIns.visibleLayer({ visible: true })
                : ((layerIns.states.visible = true), (instance.compAttr.visible = true));
              break;
            case '1':
              layerIns.isTileLayer
                ? layerIns.visibleLayer({ visible: false })
                : ((layerIns.states.visible = false), (instance.compAttr.visible = false));
              break;
            case '2':
              gisDataCache.mapIsShow
                ? layerIns.isTileLayer
                  ? layerIns.visibleLayer({ visible: true })
                  : ((layerIns.states.visible = true), (instance.compAttr.visible = true))
                : layerIns.isTileLayer
                ? layerIns.visibleLayer({ visible: false })
                : ((layerIns.states.visible = false), (instance.compAttr.visible = false));
              break;
          }
        } else {
          if (visibleStatus == '2') {
            if (visibleGLEnglistNameArr.includes(englishName)) {
              gisDataCache.mapIsShow = !instance.visible;
            } else if (englishName === 'MapGlBasicLayerNew') {
              gisDataCache.mapIsShow = instance.hiddenState;
            } else {
              gisDataCache.mapIsShow = !instance.compAttr.visible;
            }
          }
          switch (visibleStatus) {
            case '0':
              instance.show();
              break;
            case '1':
              instance.hide();
              break;
            case '2':
              gisDataCache.mapIsShow ? instance.show() : instance.hide();
              break;
          }
        }
        // instance.compAttr && (instance.compAttr.visible = !instance.compAttr.visible);
      }, 100);
    }
  });
  gisDataCache.mapIsShow = !gisDataCache.mapIsShow;
};

//测量
export const gitMapMeasure = (opts = {}) => {
  const { data, customMapObj, gisDataCache } = opts;
  const { mapType } = data;
  const { stopEsc, inintToolType = true } = gisDataCache;
  const configs = JSON.parse(JSON.stringify(data.gisAction.mapMeasure));
  const {
    type = mapType === 'Map3DFoundationPlan' ? 'length' : 'LineString',
    variableVal = '',
    isClear = false,
    borderColor = '#F90', //边框颜色
    borderWidth = 1, //边框宽度
    background = 'rgba(255,255,255,.65)',
    textStyle = {
      color: {
        isGradient: false,
        color: '#fff',
        gradient: 'linear-gradient(0deg, #fff 0%, #2B86C5 100%)',
      },
      fontFamily: 'Microsoft Yahei',
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 'normal',
      lineHeight: '16',
      textAlign: 'left',
      borderWidth: 0,
      background: 'rgba(0,0,0, .65)',
      border: 'rgba(255,255,255,1)',
    },
    isRes = false,
    saveParams = [],
  } = configs;
  console.log('++++++++++++++++++++1234');
  !configs.type && (configs.type = type);
  if (mapType == 'Map3DFoundationPlan') {
    gisDataCache.configs = configs;
  }
  textStyle.border = textStyle.borderWidth + 'px' + ' ' + 'solid' + ' ' + textStyle.border;
  textStyle.lineHeight += 'px';
  textStyle.color = textStyle.color.color;
  const map = customMapObj._map;

  // 按钮清除
  if (isClear) {
    // 三维
    if (mapType === 'Map3DBasicLayer' || mapType === 'Map3DFoundationPlan') {
      if (gisDataCache.toolManager) {
        gisDataCache.toolManager.clear();
        gisDataCache.toolManager.disableTool();
        // map.depthTestAgainstTerrain = false;
      }
    } else if (mapType === 'MapGlFoundationPlan') {
      // v8.6.0 清除地图测量
      if (gisDataCache.drawToolGL) {
        if (gisDataCache.drawToolGL_measure_feature && gisDataCache.drawToolGL_measure_feature.length > 0) {
          map.remove(gisDataCache.drawToolGL_measure_feature);
          gisDataCache.drawToolGL_measure_feature = [];
        }
        gisDataCache.drawToolGL.clear();
        setTimeout(() => {
          gisDataCache.drawToolGL.finish();
        }, 200);
      }
      // map.clearDraw({onlyStop:true})
      // map.clearDraw({draw_type:'measure'})
    } else {
      stopEsc && stopEsc.stopDraw();
      map.clearDraw({ draw_type: 'measure' });
    }
    return;
  }
  // esc停止测量
  document.onkeyup = function (e) {
    if (e.key == 'Escape') {
      if (mapType === 'Map3DBasicLayer' || mapType === 'Map3DFoundationPlan') {
        if (gisDataCache.toolManager) {
          gisDataCache.toolManager.disableTool();
          // map.depthTestAgainstTerrain = false;
        }
      } else if (mapType === 'MapGlFoundationPlan') {
        // v8.6.0 结束标绘
        if (gisDataCache.drawToolGL) {
          gisDataCache.drawToolGL.finish();
        }
        // map.clearDraw({onlyStop:true})
      } else {
        stopEsc && stopEsc.stopDraw();
      }
    }
  };

  if (mapType == 'Map3DFoundationPlan') {
    if (inintToolType) {
      const params = {};
      gisDataCache.toolManager = new YunliMap3D.ToolManager(map);
      gisDataCache.inintToolType = false;
      gisDataCache.toolManager.on(YunliMap3D.enumDrawStepType.finishDraw, function (data) {
        //在这个事件中写下述语句，可以每次只绘制一次就结束
        let temp = 'polyline';
        temp = gisDataCache.configs.type.indexOf('area') > -1 ? 'polygon' : 'polyline';

        if (isRes && variableVal) {
          params.coordinates = data.getLngLats(`${temp}`);
        }
      });
      gisDataCache.toolManager.on(YunliMap3D.enumDrawStepType.finishMeasure, function (data) {
        //'angle', 面积'area'，
        //在这个事件中写下述语句，可以每次只绘制一次就结束
        let selectType = gisDataCache.configs.type;
        if (selectType.indexOf('-') > -1) {
          selectType = selectType.split('-')[0];
        }

        if (isRes) {
          params.value = data[`${selectType}`]?.toFixed(2);
          saveParams.length ? setMapData(opts, saveParams, params) : setStoreData(variableVal, params);

          console.log(params);
        }
        //兼容处理便签不显示问题
        gisDataCache.toolManager.disableTool();
        merges();
      });
    }
    function merges() {
      let clampToGroundType = true;
      let {
        type = mapType == 'Map3DFoundationPlan' ? 'length' : 'LineString',
        borderColor = '#F90', //边框颜色
        borderWidth = 1, //边框宽度
        background = 'rgba(255,255,255,.65)',
        textStyle,
      } = gisDataCache.configs;

      if (type.indexOf('-') > -1) {
        clampToGroundType = false;
        type = type.split('-')[0];
      }
      if (clampToGroundType) {
        // map.depthTestAgainstTerrain = true;
      }

      const option = {
        clampToGround: clampToGroundType,
      };

      if (type.indexOf('area') > -1) {
        option.material = Cesium.Color.fromCssColorString(background);
        option.outlineColor = Cesium.Color.fromCssColorString(borderColor);
        option.outlineWidth = borderWidth;
      } else {
        option.material = Cesium.Color.fromCssColorString(borderColor);
        option.width = borderWidth;
      }
      const { fontFamily = 'Microsoft Yahei', fontSize = '14px' } = textStyle;
      const fontStyles = fontSize + ' ' + fontFamily;
      console.log(option, 'opstins');
      gisDataCache.toolManager.enableTool({
        type: YunliMap3D.enumToolType.measure[`${type}`],
        style: {
          drawing: option,
          drawend: option,
          labelResult: {
            show: true,
            showBackground: true,
            font: fontStyles,
            fillColor: Cesium.Color.fromCssColorString(textStyle.color), //文字颜色
            backgroundColor: Cesium.Color.fromCssColorString(textStyle.background), //背景颜
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          showSegmentLabel: false, //可以在每个添加的节点上显示出具体的值
        },
      });
    }
    merges();
  } else if (mapType === 'MapGlFoundationPlan') {
    let drawType = type;
    if (type === 'LineString') {
      drawType = 'polyline';
    }
    handleDrawToolMapGL({
      customMapObj,
      gisDataCache,
      drawType,
      drawOpts: {
        borderColor,
        borderWidth,
        background,
      },
      isRes,
      queryVariable: variableVal,
      saveParams,
      isMeasure: true,
      textStyle,
    });
    // console.log('textStyle', textStyle);
    // {
    //   "color": "#fff",
    //   "fontFamily": "Microsoft Yahei",
    //   "fontSize": "14px",
    //   "fontStyle": "normal",
    //   "fontWeight": "normal",
    //   "lineHeight": "16px",
    //   "textAlign": "left",
    //   "borderWidth": 0,
    //   "background": "rgba(0,0,0, .65)",
    //   "border": "0px solid rgba(255,255,255,1)"
    // }
    // map.drawFeature(drawType.toLocaleLowerCase(), {
    //   createdStyle: {
    //     color: background,
    //     borderColor: borderColor,
    //     borderWidth: borderWidth,
    //   },
    //   drawingStyle: {
    //     color: background,
    //     borderColor: borderColor,
    //     borderWidth: borderWidth,
    //   },
    //   measureTipStyle: {
    //     color: textStyle.color,
    //     font: `${textStyle.fontStyle} normal ${textStyle.fontWeight} ${textStyle.fontSize}/${textStyle.lineHeight} ${textStyle.fontFamily}`,
    //     border: textStyle.border,
    //     backgroudColor: textStyle.background,
    //     borderRadius: textStyle.borderWidth,
    //     textAlign: textStyle.textAlign,
    //     // padding: "4px 10px",
    //   },
    //   isMeasure: true,
    //   onCreate(e) {
    //     console.log('标绘', e);
    //     // 是否支持返回数据
    //     if (isRes) {
    //       let data = {
    //         key: e.id,
    //         coordinates: e.coordinates,
    //         area: e.area,
    //         value: e.length,
    //         section_value: e.segmentLength,
    //       };
    //       saveParams.length ? setMapData(opts, saveParams, data) : setStoreData(variableVal, data);
    //     }
    //   }
    // });
  } else {
    map.drawFeature(type, {
      style: {
        borderColor: '#000',
        lineDash: [10, 8],
      },
      endStyle: {
        borderColor,
        borderWidth,
        background,
      },
      isMeasure: true,
      start: function (e) {},
      end: function (e) {
        // e.stopDraw(); //结束绘制
        gisDataCache.stopEsc = e;
        //stopKeyEsc = e;
        if (isRes) {
          const data = {
            coordinates: e.coordinates,
            area: e.area,
            value: e.length,
            section_value: e.segmentLength,
          };
          setStoreData(variableVal, data);
          saveParams.length ? setMapData(opts, saveParams, data) : setStoreData(variableVal, data);
        }
        const num = parseInt(Math.random() * 1000);
        $(customMapObj.container[0])
          .find('.tooltip-measure')
          .each((index, el) => {
            //避免样式覆盖问题
            if (el.className.indexOf('current-measure') == -1) {
              el.classList.add('current-measure' + num);
              $(customMapObj.container[0])
                .find('.current-measure' + num)
                .css({
                  ...textStyle,
                });
              $(customMapObj.container[0]).find('.tooltip-measure').addClass(`measures`); // REVIEW liuming 尽量不直接操作DOM节点

              const spans = convertElementToDomString(
                <span
                  style={{
                    borderTop: '6px solid ' + textStyle.background,
                    borderRight: '6px solid transparent',
                    borderLeft: '6px solid transparent',
                    content: '',
                    position: 'absolute',
                    bottom: '-6px',
                    marginleft: '-7px',
                    left: '44%',
                  }}
                ></span>,
              );
              $(customMapObj.container[0])
                .find('.current-measure' + num)
                .append(spans);
            }
          });
        var html = '';
        if (type == 'LineString') {
          html = e.length.toFixed(2) + 'm';
        } else if (type == 'Polygon') {
          html = e.area.toFixed(2) + 'm<sup>2</sup>';
        }
      },
    });
  }
};

// 区域绘制
export const gisMapDraw = (opts = {}) => {
  const { data, customMapObj, index, gisDataCache, customMapPlan } = opts;
  gisDataCache.layerIndex = index;
  // const dataConfig = data['gisAction']['mapDraw'];
  console.log(data, opts);
  const { mapType } = data;
  const mapIns = customMapObj._map;
  let {
    //区域类型
    drawTypeSw = 'default',
    drawTypeVal = 'Circle',
    drawTypeVariable = '',
    drawTypeVariableExp = 'data',

    borderColorSw = 'default', // 边框颜色类型
    borderColorVal = 'rgba(0,255,255,1)', // 边框颜色填写值
    borderColorVariable = '', // 边框颜色引用变量
    borderColorVariableExp = 'data', //边框颜色引用变量表达式

    borderWidthSw = 'default', //边框宽度类型
    borderWidthVal = 5, // 边框宽度填写值
    borderWidthVariable = '', // 边框宽度引用变量
    borderWidthVariableExp = 'data', // 边框宽度引用变量表达式

    //区域颜色
    backgroundSw = 'default',
    background = 'rgba(255,255,255,.65)',
    backgroundVariable = '',
    backgroundVariableExp = 'data',

    //
    isRes = true, //是否返回数据
    queryDrawVariable = undefined, //保存数据变量
    // 删除区域id
    deleteDrawVariable = undefined,
    dataParams = [],
    saveParams = [],
  } = data.gisAction.mapDraw;
  let dt, bc, bw, bg;

  if (dataParams.length) {
    const objData = getMapData(opts, dataParams);
    dt = objData.drawTypeVal;
    bc = objData.borderColorVal;
    bw = objData.borderWidthVal;
    bg = objData.background;
  }

  let drawType = drawTypeVal;
  if (drawTypeSw != 'default') {
    const s = dataParams.length ? dt : getExpDataByKey(drawTypeVariable, drawTypeVariableExp);
    if (s == '圆形区域') {
      drawType = 'Circle';
    } else if (s == '矩形区域') {
      drawType = 'Rectangle';
    } else {
      drawType = 'Polygon';
    }
  }

  const borderColor =
    borderColorSw == 'default'
      ? borderColorVal
      : dataParams.length
      ? bc
      : getExpDataByKey(borderColorVariable, borderColorVariableExp);
  // 边框宽度
  const borderWidth =
    borderWidthSw == 'default'
      ? borderWidthVal
      : dataParams.length
      ? bw
      : getExpDataByKey(borderWidthVariable, borderWidthVariableExp);

  background =
    backgroundSw == 'default'
      ? background
      : dataParams.length
      ? bg
      : getExpDataByKey(backgroundVariable, backgroundVariableExp);

  if (mapType == 'Map3DBasicLayer' || mapType == 'Map3DFoundationPlan') {
    const typeObj = {
      Circle: YunliMap3D.enumToolType.draw.circle,
      Rectangle: YunliMap3D.enumToolType.draw.rectangle,
      Polygon: YunliMap3D.enumToolType.draw.polygon,
    };
    handleDrawToolMap3D({
      customMapObj,
      gisDataCache,
      drawType: typeObj[drawType],
      drawOpts: {
        borderColor,
        borderWidth,
        background,
      },
      isRes,
      queryVariable: queryDrawVariable,
      deleteVariable: deleteDrawVariable,
      customMapPlan,
      saveParams,
    });
  } else if (mapType == 'MapGlFoundationPlan') {
    handleDrawToolMapGL({
      customMapObj,
      gisDataCache,
      drawType,
      drawOpts: {
        borderColor,
        borderWidth,
        background,
      },
      isRes,
      queryVariable: queryDrawVariable,
      deleteVariable: deleteDrawVariable,
      customMapPlan,
      saveParams,
      index,
    });
  } else {
    mapIns.drawFeature(drawType, {
      style: {
        // 绘制中样式
        borderColor,
        borderWidth,
        background,
      },
      endStyle: {
        // 绘制完成样式
        borderColor,
        borderWidth,
        background,
      },
      start: function () {
        // 开始绘制
      },
      end: function (e) {
        e.stopDraw(); //结束绘制
        const mapFn = window.YunliMap;
        const mapObj = {
          mapFn,
          mapIns,
          customMapPlan,
          gisDataCache,
          drawType,
          drawOpts: {
            borderColor,
            borderWidth,
            background,
          },
          index,
        };
        console.log('222二维');
        const EventEmitter = window.globalEventEmitter;
        //监听清零
        EventEmitter.on(deleteDrawVariable, () => {
          const deleteDrawVar = getExpDataByKey(deleteDrawVariable, 'data');
          if (deleteDrawVar == 0) {
            removeDataCache(mapIns, customMapPlan, gisDataCache, index);
          }
        });

        const variableKeyObj = saveParams.filter((item) => item.paramItemId === 'all')[0];
        // if (!variableKeyObj) return;
        if (variableKeyObj && isRes && !gisDataCache.isVariable2D) {
          const { variableKey = '', expression = 'data' } = variableKeyObj;
          gisDataCache.isVariable2D = true;
          const listenFn = () => {
            const data = getExpDataByKey(variableKey, expression);
            createPolygon({ ...mapObj, data });
          };
          EventEmitter.on(variableKey, listenFn);
        }
        drawType == 'Circle' && (e.type = 'circle');
        if (!variableKeyObj) {
          createPolygon({ ...mapObj, data: e });
        }
        // 更新全局存储的变量数据
        const variables = {
          key: e.key,
          coordinates: e.coordinates || [],
          radius: e.radius,
          type: e.type,
          isDraw: true,
        };
        saveParams.length
          ? setMapData(opts, saveParams, variables)
          : queryDrawVariable && setStoreData(queryDrawVariable, variables);
      },
    });
  }
};
/**
 * 绘制结束创建polygon,删除标签
 * @param {object} mapFn 创建图形实例
 * @param {object} mapIns 地图实例_map
 * @param {object} customMap 获取地图layers
 * @param {object} gisDataCache 缓存图形数据，当修改变量需要移除地图上面的图层
 * @param {string} dataType 图形类型，[圆形，矩形，多边形]
 * @param {object} drawOpts 图形样式
 * @param {object} data 图形数据，坐标，半径
 */
const createPolygon = (ops = {}) => {
  const {
    mapFn,
    mapIns,
    customMapPlan,
    gisDataCache,
    drawType,
    drawOpts: { borderColor, borderWidth, background },
    index,
    data,
  } = ops;
  let infowindow = null;
  if (!data.isDraw) {
    removeDataCache(mapIns, customMapPlan, gisDataCache, index);
  }
  let { coordinates, radius, type } = data;
  if (type === 'circle' || type === 'Circle') {
    coordinates = mapFn.GeometryUtil.polygonFromCircle(coordinates, radius, 100);
  }
  const polygon = new mapFn.Polygon({
    coordinates: coordinates,
    style: {
      borderColor,
      background,
      borderWidth,
    },
  });

  const mouseoverPolygon = (e) => {
    // 生成提示框
    infowindow = new mapFn.InfoWindow({
      content: deleteButton,
    });
    // 添加提示框;
    mapIns.add(infowindow);
    infowindow.setPosition(e.coordinate);
    infowindow.show();
    infowindow.setOffset([0, 14]);
  };

  //鼠标移出隐藏弹窗
  const mouseoutPolygon = () => {
    infowindow.hide();
  };
  let deleteButton = convertElementToDomString(
    <Button
      type='primary'
      size='small'
      danger
      onClick={() => {
        removePolygon(mapIns, polygon, infowindow, mouseoverPolygon, mouseoutPolygon);
        data.key && removeSpaceQuery(data.key, index, customMapPlan);
      }}
    >
      删除
    </Button>,
  );

  gisDataCache.mapFea.push({ polygon, key: data.key, infowindow, mouseoverPolygon, mouseoutPolygon });
  // 添加鼠标监听事件;
  polygon.on('mouseover', mouseoverPolygon);
  polygon.on('mouseout', mouseoutPolygon);
  //  添加区域;
  polygon.addTo(mapIns);
  setTimeout(() => {
    mapIns.clearDraw({
      draw_key: data.key,
    });
  }, 20);
};

// 删除方法
const removePolygon = (mapIns, polygon, infowindow, mouseoverPolygon, mouseoutPolygon) => {
  console.log('removePolygon polygon:', polygon, 'infowindow；', infowindow);
  infowindow && infowindow.removeTo(mapIns);
  infowindow = null;
  if (polygon) {
    polygon.off('mouseover', mouseoverPolygon);
    polygon.off('mouseout', mouseoutPolygon);
    polygon.removeTo(mapIns);
    polygon = null;
  }
};

const removeSpaceQuery = (key, index, customMapPlan) => {
  const layers = customMapPlan?.layers;
  const mapArr = [
    'BasePolygonLayer',
    'BasePolylineLayer',
    'BasePointLayer',
    'BasePolygonLayer3D',
    'BasePointLayer3D',
    'BasePolylineLayer3D',
    // v8.5.0新增删除空间查询
    'MapGlBasePointLayer',
    'MapGlBasePolylineLayer',
    'MapGLBasePolygonLayer',
  ];
  //console.log(layers, key, index);
  layers?.forEach((layer) => {
    const curLayer = layer?.instance?.layer_instance;
    if (!curLayer) return;
    // let { instance, englishName } = item;
    if (mapArr.includes(layer.englishName)) {
      //数据优化开启
      if (curLayer.isTileLayer) {
        curLayer.filterSelectLayer &&
          curLayer.filterSelectLayer({
            queryFeatures: '',
            isDeal: false,
            isRender: false,
            isFilter: false,
            isLabel: false,
            filterType: 'circle',
            filterWay: 'all',
            removeKey: key,
          });
      } else {
        curLayer.removeSpaceFeature &&
          curLayer.removeSpaceFeature({
            key,
          });
      }
    }
  });
};

const removeDataCache = (mapIns, customMapPlan, gisDataCache, index) => {
  const { mapFea = [] } = gisDataCache;
  mapFea.forEach((item) => {
    const { polygon, key, infowindow, mouseoverPolygon, mouseoutPolygon } = item;
    removePolygon(mapIns, polygon, infowindow, mouseoverPolygon, mouseoutPolygon);
    key && removeSpaceQuery(key, index, customMapPlan);
  });
};

//空间查询
export const gisMapSpaceQuery = (opts = {}) => {
  const { data, index, layers, customMapObj, customMapPlan } = opts;
  const gisSpaceDataCache = [];
  let {
    //查询图层
    layerCodeSw = 'default', //图层
    layerType = [], //图层
    layerCodeVariable = '',
    layerCodeVariableExp = 'data',
    //区域
    searchKeySw = 'default',
    searchKeyVal = {
      type: 'circle',
      coordinates: [116.38859237461351, 39.91506397945804],
      radius: 2000,
    },
    searchKeyVariable = '',
    searchKeyVariableExp = 'data',
    queryType = 'default',
    bufferRadius = 0,
    //页码
    pageNumSw = 'default', //页码
    pageNumVal = '1',
    pageNumVariable = '',
    pageNumVariableExp = 'data',
    //每页个数
    pageSizeSw = 'default', //每页数
    pageSizeVal = '20',
    pageSizeVariable = '',
    pageSizeVariableExp = 'data',

    //定位
    isLocation = false,
    isResultData = true,
    //清除数据
    deleteSpaceVariable = '',
    //数据
    isType = false,
    dataType = 'default',
    queryApiVariable = undefined,
    filterWay = 'all',
    isFilter = false,
    // dataType = 'default',
    // queryApiVariable = undefined,
    // filter = undefined //过滤条件
    dataParams = [],
    saveParams = [],
  } = data.gisAction.mapSpaceQuery;
  const { mapType } = data;
  const layerList = window.layerList || [];
  let layerCodeLocal = [];
  let layerCodeSys = [];
  const layerUid = [];
  const mapLayers = customMapPlan.layers;

  if (layerCodeSw != 'default') {
    layerCodeLocal = getExpDataByKey(layerCodeVariable, layerCodeVariableExp);
  } else {
    layerType.forEach((layer) => {
      const circleQueryLayerTmp = layer.split('#');
      if (circleQueryLayerTmp[0] == 'local') {
        layerCodeLocal.push(circleQueryLayerTmp[1]);
      } else {
        layerUid.push(circleQueryLayerTmp[1]);
      }
    });
  }
  //区域
  if (searchKeySw != 'default') {
    searchKeyVal = getExpDataByKey(searchKeyVariable, searchKeyVariableExp);
  }

  if (pageNumSw != 'default') {
    pageNumVal = getExpDataByKey(pageNumVariable, pageNumVariableExp);
  }

  if (pageSizeSw != 'default') {
    pageSizeVal = getExpDataByKey(pageSizeVariable, pageSizeVariableExp);
  }
  if (deleteSpaceVariable) {
    searchKeyVal.key = searchKeyVal.key + '-' + deleteSpaceVariable;
  }
  if (dataParams.length) {
    const objData = getMapData(opts, dataParams);
    layerCodeSw != 'default' && (layerCodeLocal = objData.layerCodeLocal);
    searchKeyVal = objData.searchKeyVal;
    pageNumVal = objData.pageNumVal;
    pageSizeVal = objData.pageSizeVal;
  }

  if (!Array.isArray(layerCodeLocal)) {
    console.error('地图周围查询-图层数据不是数组！');
    return;
  }

  //监听变量清除数据
  const EventEmitter = window.globalEventEmitter;
  EventEmitter.on(deleteSpaceVariable, () => {
    const deleteLineVar = getExpDataByKey(deleteSpaceVariable, 'data');
    console.log(deleteLineVar, 'remover', searchKeyVal);
    if (deleteLineVar == 0) {
      removeSpaceQuery(deleteSpaceVariable, index, customMapPlan);
    }
  });

  if (Object.prototype.toString.call(searchKeyVal) === '[object Object]' && !Array.isArray(searchKeyVal.coordinates)) {
    message.info('空间查询数据标格式不正确！');
    return;
  }

  if (isLocation && isResultData) {
    const circleQueryCenter = searchKeyVal.coordinates;

    const mapInstanceFn = getMapFn(mapType);
    const fitOpts = { padding: [200, 200, 200, 200] };
    if (searchKeyVal.type === 'circle') {
      customMapObj._map.setCenter(circleQueryCenter);
      const degrees = mapInstanceFn.metersToUnits(customMapObj._map.getCenter(), searchKeyVal.radius);
      fitOpts.extent = [
        circleQueryCenter[0] - degrees,
        circleQueryCenter[1] - degrees,
        circleQueryCenter[0] + degrees,
        circleQueryCenter[1] + degrees,
      ];
    } else {
      const lon = [];
      const lat = [];
      const fitCoordinates = mapType.indexOf('Map3D') > -1 ? circleQueryCenter : circleQueryCenter[0];
      fitCoordinates.forEach((item) => {
        lon.push(item[0]);
        lat.push(item[1]);
      });
      fitOpts.extent = [
        Math.min.apply(null, lon),
        Math.min.apply(null, lat),
        Math.max.apply(null, lon),
        Math.max.apply(null, lat),
      ];
    }

    let mapFitFn = 'fit';
    if (mapType == 'Map3DFoundationPlan') {
      mapFitFn = 'fitView';
      fitOpts.padding = [0.1, 0.1, 0.1, 0.1];
    }

    if (mapType == 'MapGlFoundationPlan') {
      customMapObj._map.fitExtent(fitOpts.extent, {
        padding: { top: 100, bottom: 100, left: 100, right: 100 },
      });
    } else {
      customMapObj._map[mapFitFn](fitOpts);
    }
  }
  // let isInteractLabel = isInteract && isLabel;
  // let isInteractFilter = isInteract && isFilter;
  // let isInteractDrag = isInteract && isDrag;
  //业务图层layerUid
  if (layerUid.length > 0) {
    getSysLayerListByBatch(layerUid).then((res) => {
      //console.log('getSysLayerListByBatch', res.data);
      layerCodeSys = parseSysLayerConfig(res.data);
      layerCodeLocal = layerCodeLocal.concat(layerCodeSys);
      const queryLayer = mapLayers.filter((item) => {
        return layerCodeLocal.includes(item._attr.relation_layer_code) || layerCodeLocal.includes(item.key);
      });
      querySpaceData({
        customMapObj,
        queryLayer,
        searchKeyVal,
        pageNumVal,
        pageSizeVal,
        mapType,
        isType,
        dataType,
        queryApiVariable,
        isLabel: false,
        isFilter,
        isDrag: false,
        filterWay,
        isResultData,
        gisSpaceDataCache,
        queryType,
        bufferRadius,
        customMapPlan,
        saveParams,
      });
    });
  } else {
    layerCodeLocal = layerCodeLocal.concat(layerCodeSys);
    const queryLayer = mapLayers.filter((item) => {
      return layerCodeLocal.includes(item._attr.relation_layer_code) || layerCodeLocal.includes(item.key);
    });
    querySpaceData({
      customMapObj,
      queryLayer,
      searchKeyVal,
      pageNumVal,
      pageSizeVal,
      mapType,
      isType,
      dataType,
      queryApiVariable,
      isLabel: false,
      isFilter,
      isDrag: false,
      // isLabel: isInteractLabel,
      // isFilter: isInteractFilter,
      // isDrag: isInteractDrag,
      filterWay,
      isResultData,
      gisSpaceDataCache,
      queryType,
      bufferRadius,
      customMapPlan,
      saveParams,
    });
  }
};

const querySpaceData = async (opts = {}) => {
  const {
    customMapObj,
    queryLayer,
    searchKeyVal,
    pageNumVal,
    pageSizeVal,
    isType,
    dataType,
    queryApiVariable,
    mapType,
    isLabel = true,
    isFilter,
    isDrag,
    filterWay,
    dragTarget,
    isResultData,
    gisSpaceDataCache,
    bufferRadius,
    queryType,
    customMapPlan,
    saveParams = [],
  } = opts;
  const mapInstanceFn = getMapFn(mapType);
  //mapType.indexOf('Map3D') > -1 ? add3dCircleMask(opts) : addCircleMask(opts);
  let queryFeatures = [];
  Array.isArray(queryLayer) &&
    queryLayer.forEach((layer) => {
      const relation_layer_code = layer._attr.relation_layer_code;
      let curLayer = layer?.instance?.layer_instance;

      const renderInstance = () => {
        //通过数据中layerCode来选择查询对应图层
        const idKey = layer.instance.compAttr?.filterKey?.text;
        if (!idKey) {
          message.warning('检查选中图层指定key字段是否选中！');
          return;
        }

        // console.log(searchKeyVal.coordinates,)
        let queryCoordinates = searchKeyVal.coordinates;
        let queryRadius = searchKeyVal.radius;
        if (queryType == 'buffer' && bufferRadius) {
          if (searchKeyVal.type == 'circle') {
            queryRadius += bufferRadius;
          } else {
            const bufferCoordinates = mapInstanceFn.getBuffer({
              coordinates: queryCoordinates,
              type: 'polygon',
              radius: bufferRadius,
            });
            queryCoordinates = bufferCoordinates;
          }
          /*  searchKeyVal.type == 'circle'
          ? (queryRadius += bufferRadius)
          : (queryCoordinates = bufferCoordinates); */
        }

        const queryDataParam = {
          // 查询的图层
          layerCode: relation_layer_code,
          coordinates: queryCoordinates,
          // 周边查询时传递'point'，矩形查询和多边形查询传递'polygon'
          geometryType: searchKeyVal.type == 'circle' ? 'point' : 'polygon',
          exact: true,
          // // 查询半径，周边查询时生效
          pageNum: pageNumVal,
          pageSize: pageSizeVal,
          returnGeometry: dataType == 'default' ? true : false,
        };

        if (searchKeyVal.type == 'circle') {
          queryDataParam.radius = queryRadius;
        }

        mapType.indexOf('Map3D') > -1 && (queryDataParam.exact = false);

        const apiParam = getApiParamVar(curLayer?.states?.apiParamVar || curLayer.apiParam);
        if (apiParam) {
          queryDataParam.apiParam = apiParam;
        }

        mapInstanceFn.queryDataInLayer(queryDataParam).then(function (features) {
          gisSpaceDataCache.push({
            layerCode: relation_layer_code,
            features,
          });
          if (isType) {
            queryFeatures = [...queryFeatures, ...features];
            saveParams.length
              ? setMapData(opts, saveParams, queryFeatures)
              : setStoreData(queryApiVariable, gisSpaceDataCache);
          }
          if (!isResultData) return;

          //数据优化开启
          if (curLayer.isTileLayer) {
            curLayer.filterSelectLayer &&
              curLayer.filterSelectLayer({
                queryFeatures: features,
                isDeal: true,
                isFilter,
                isLabel,
                filterType: searchKeyVal.key,
                filterWay: isFilter ? filterWay : '',
                dragTarget,
                //circleKey: searchKeyVal.key
              });
          } else {
            //console.log(searchKeyVal, isFilter, 'sdf');
            curLayer.filterQueryFeature &&
              curLayer.filterQueryFeature({
                queryFeatures: features,
                isLabel,
                isFilter,
                type: 'circle',
                filterWay: isFilter ? filterWay : '',
                dragTarget,
                circleKey: searchKeyVal.key ? searchKeyVal.key : 'noKey',
              });
          }
        });

        // if (dragTarget) {
        //   if (dragTarget.moveTimer) {
        //     clearTimeout(dragTarget.moveTimer);
        //   }
        //   dragTarget.moveTimer = setTimeout(() => {
        //     queryDataFun();
        //   }, 300);
        // } else {
        // let a = queryDataFun();
        // console.log(a, 'pppppppppppppp');
        //}
      };

      if (!layer.createFlag) {
        dynamicLoadMapLayer({
          layer: layer,
          baseMap: customMapPlan,
          gisEventType: true,
        });
      }
      //有instance
      if (curLayer) {
        renderInstance();
      } else {
        window.globalEventEmitter.on('renderLayerEvent', (layerCode) => {
          if (layerCode == relation_layer_code) {
            curLayer = layer?.instance.layer_instance;
            renderInstance();
          }
        });
      }
    });
};
//图层渲染
export const gisRenderLayers = (opts = {}) => {
  const { data, index, customMapPlan } = opts;
  const dataConfig = data.gisAction.mapRenderLayers;
  let {
    renderLayerData,
    isLabel = false,
    isLabelRadio = false,
    label,
    renderLayerVariable,
    renderLayerExpression,
    dataParams = [],
  } = dataConfig;
  console.log(isLabel, isLabelRadio, label, 'bbbbbbbbbbbbbbb');
  const layerList = window.layerList || [];
  const VariableData = getExpDataByKey(renderLayerVariable, renderLayerExpression);
  let queryStyleType;

  renderLayerData = VariableData;
  if (dataParams.length) {
    const objData = getMapData(opts, dataParams);
    renderLayerData = objData.renderLayerData;
    label = objData.label;
  }

  if ((isLabel && isLabelRadio && (label == '0' || label === 'true')) || (isLabel && !isLabelRadio)) {
    queryStyleType = true;
  }

  if (!Array.isArray(renderLayerData)) {
    // message.error('数据格式为数组，请按照图层渲染问号提示添加数据');
    console.log('数据格式为数组，请按照图层渲染问号提示添加数据');
    return;
  }
  const layerCodeList = renderLayerData.map((val) => val.layerCode);
  const layerKeyList = renderLayerData.map((val) => val.layerKey);
  const layers = customMapPlan.layers;
  layers.forEach((renderIns) => {
    if (!mapBaseLayerType.includes(renderIns.type)) return;

    const { relation_layer_code } = renderIns._attr;
    const layer_key = renderIns.key;
    console.log(layerCodeList, relation_layer_code, '555555555555555555');
    if (layerCodeList.includes(relation_layer_code) || layerKeyList.includes(layer_key)) {
      if (!renderIns.createFlag) {
        dynamicLoadMapLayer({
          layer: renderIns,
          baseMap: customMapPlan,
          gisEventType: true,
        });
      }
      const curLayer = renderIns.instance?.layer_instance;
      let dataId = [];
      const pointData = {};
      renderLayerData.forEach((item) => {
        if (item.layerCode === relation_layer_code || item.layerKey === layer_key) {
          dataId = item.dataId;
          pointData.coordinates = item.coordinates;
          pointData.props = item.props;
        }
      });
      //有instance
      if (curLayer) {
        //矢量图和瓦片图处理
        renderInstance(opts, dataId, queryStyleType, renderIns, pointData);
      } else {
        //没有instance处理
        window.globalEventEmitter.on('renderLayerEvent', (layerCode) => {
          if (layerCode == relation_layer_code) {
            renderInstance(opts, dataId, queryStyleType, renderIns, pointData);
          }
        });
      }
    }
  });
};

const renderInstance = (opts, dataId, queryStyleType, renderIns, pointData) => {
  const { data } = opts;
  const dataConfig = data.gisAction.mapRenderLayers;
  const {
    isFilter = true,
    filterWay = 'all',
    isLabel = false,
    isRadar,
    mapType,
    isLocation,
    selectType = 'selectStyle',
  } = dataConfig;
  dataConfig.pointData = pointData;
  const curLayer = renderIns.instance?.layer_instance;

  const { filterKey, relation_layer_code } = renderIns.instance.compAttr;
  const idKey = filterKey?.text;
  if (Array.isArray(pointData.coordinates)) {
  } else if (!idKey) {
    message.warning('检查选中图层指定key字段是否选中！');
    return;
  }
  //弹框关闭
  const { click } = curLayer.states || curLayer;
  if (click && click.enabled && click?.compKey) {
    const winDom = document.querySelector(`[data-key*="${click.compKey}"]`);
    if (winDom && winDom.style.display != 'none') {
      winDom.style.display = 'none';
    }
  }
  let isRender = false;
  !dataId?.length && (isRender = true);
  //数据为空处理
  //all 全部数据 query 所有数据   same 同类数据
  console.log('12345', queryStyleType);
  if (dataId?.length == 1 && dataId[0] == '') {
    if (!isFilter) return;

    switch (filterWay) {
      case 'all':
        //兼容三维点线面为瓦片图选中点位无法隐藏问题
        if (renderIns._attr.type === 'TileLayer') {
          curLayer.visibleLayer({
            visible: false,
          });
          return;
        }
        //兼容gl面图层
        curLayer.states ? (curLayer.states.visible = false) : (curLayer._visible = false);
        break;
      case 'query':
        if (renderIns._attr.type === 'TileLayer') {
          curLayer.visibleLayer({
            visible: true,
          });
        }
        curLayer.states ? (curLayer.states.visible = true) : (curLayer._visible = true);
        break;
      case 'same':
        if (curLayer.isTileLayer) {
          curLayer.filterSelectLayer({
            queryFeatures: '',
            isDeal: false,
            isRender,
            isFilter,
            isLabel: queryStyleType,
            filterType: 'render',
            filterWay,
            renderDataAll: dataConfig,
          });
        } else {
          curLayer._renderTriggerClick({
            queryFilterData: dataId,
            queryStyleType,
            isQueryFilter: isFilter,
            currentLayerCode: relation_layer_code,
            renderDataAll: dataConfig,
            filterType: 'render',
            filterWay,
            isRender,
          });
        }
        break;
    }
    return;
  }
  //数据优化
  let cqlfilter;
  if (!dataId?.length) {
    cqlfilter = '';
    isRender = true;
  } else {
    let searchArr = JSON.parse(JSON.stringify(dataId));
    searchArr.length > 300 && searchArr.splice(300, searchArr.length - 300);
    if (Array.isArray(searchArr) && searchArr.length > 0 && !/^[+-]?\d*(\.\d*)?(e[+-]?\d+)?$/.test(searchArr[0])) {
      searchArr = searchArr.map((item) => "'" + item + "'");
    }
    const newData = JSON.stringify(searchArr).replace('[', '(').replace(']', ')').replace(/\"/g, "'");
    // cqlfilter = `${idKey}` + ' in (' + searchArr.join(',') + ')';
    cqlfilter = `${idKey}` + ' ' + 'in' + ' ' + newData;
  }
  //瓦片图
  if (curLayer.isTileLayer) {
    // console.log(curLayer, curLayer.filterSelectLayer);
    if (isLocation && Array.isArray(dataId) && dataId.length) {
      const newData = JSON.stringify(dataId).replace('[', '(').replace(']', ')').replace(/\"/g, "'");
      const mapInstanceFn = mapType.indexOf('Map3D') > -1 ? YunliMap3D : YunliMap;
      const filter = `${idKey}` + ' ' + 'in' + ' ' + newData;

      const queryDataParam = {
        layerCode: relation_layer_code,
        needPolygon: true,
        // cqlfilter: `${idKey}` + ' ' + 'in' + ' ' + newData,
        cqlFilterEncrypt: encode(filter), // 广东需求，安全性处理
      };

      const apiParam = getApiParamVar(curLayer?.states?.apiParamVar || curLayer.apiParam);
      if (apiParam) {
        queryDataParam.apiParam = apiParam;
      }

      mapInstanceFn.getFeatureByFilter({
        ...queryDataParam,
        callback: (data) => {
          locationFn(isLocation, data, renderIns.instance, mapType);
        },
      });
    }

    curLayer.filterSelectLayer({
      queryFeatures: cqlfilter,
      isDeal: false,
      isRender,
      isFilter,
      isLabel,
      filterType: 'render',
      filterWay,
      renderDataAll: dataConfig,
    });
    //点图层雷达波
    if (!dataId.length) {
      curLayer.addRadarPoint &&
        curLayer.addRadarPoint({
          renderDataAll: dataConfig,
          queryFilterData: [],
        });
      return;
    }
    isRadar &&
      getRenderGisData(relation_layer_code, data.mapType, idKey, dataId, curLayer).then((y) => {
        curLayer.addRadarPoint &&
          curLayer.addRadarPoint({
            renderDataAll: dataConfig,
            queryFilterData: y,
          });
      });
  } else {
    //矢量图处理
    curLayer._renderTriggerClick({
      queryFilterData: dataId,
      queryStyleType,
      isQueryFilter: isFilter,
      currentLayerCode: relation_layer_code,
      renderDataAll: dataConfig,
      filterType: 'render',
      filterWay,
      isRender,
      isLocation,
    });
  }
};

const getRenderGisData = (layerCode, mapType, ids, data, layerIns) => {
  //获取查询后的数据保存到选中的变量中
  const newData = JSON.stringify(data).replace('[', '(').replace(']', ')').replace(/\"/g, "'");
  return new Promise((resolve) => {
    try {
      let mapFn;
      if (mapType == 'Map3DBasicLayer' || mapType == 'Map3DFoundationPlan') {
        mapFn = window.YunliMap3D;
      } else {
        mapFn = window.YunliMap;
      }
      const filter = `${ids}` + ' ' + 'in' + ' ' + newData;

      const queryDataParam = {
        filter: {},
        layerCode: layerCode,
        needPolygon: true,
        // cqlfilter: filter,
        cqlFilterEncrypt: encode(filter), // 广东需求，安全性处理
      };

      const apiParam = getApiParamVar(layerIns?.states?.apiParamVar || curLayer.apiParam);
      if (apiParam) {
        queryDataParam.apiParam = apiParam;
      }

      mapFn.getFeatureByFilter({
        ...queryDataParam,
        callback: (data) => {
          //可能地图能筛选出对应的点，数据不一定能返回对应的数据。
          resolve(data);
        },
      });
    } catch (e) {
      console.log(e);
    }
  });
};

export const gisQueryFilter = (opts = {}) => {
  const { data, index, customMapPlan } = opts;
  let {
    layerCode,
    filter,
    isType,
    isLocation,
    queryApiVariable,
    isFilter = true,
    filterWay = 'all',
    mapType,
    isLabel,
    isLabelRadio,
    label,
    layerType,
    dataParams = [],
    saveParams = [],
  } = data.gisAction.mapQuery;
  console.log('filter', filter);

  if (dataParams.length) {
    const objData = getMapData(opts, dataParams);
    filter = objData.filter;
    label = objData.label;
  }

  const mapLayers = customMapPlan.layers;
  // let layerIndex = _.findIndex(mapLayers, ['key', layerType]);
  const layerIndex = mapLayers.findIndex((layer) => layer.key === layerType);

  if (!mapLayers[layerIndex]?.createFlag) {
    dynamicLoadMapLayer({
      layer: mapLayers[layerIndex],
      baseMap: customMapPlan,
      gisEventType: true,
    });
  }
  const curLayer = mapLayers[layerIndex]?.instance?.layer_instance;

  const renderInstance = () => {
    const mapBasicFilter = mapLayers[layerIndex]?.instance;
    if (!mapBasicFilter) return;
    if (!mapBasicFilter.compAttr?.filterKey.text) {
      message.warning('检查选中图层指定key字段是否选中！');
      return;
    }
    //数据优化开启
    const layerIns = mapBasicFilter.layer_instance;
    const queryDataParam = {
      layerCode: layerCode,
      needPolygon: true,
      // cqlfilter: filter,
      cqlFilterEncrypt: encode(filter), // 广东需求，安全性处理
    };

    //layerIns.apiParamVar兼容gl面图层
    const apiParam = getApiParamVar(layerIns.apiParamVar || layerIns?.states?.apiParamVar);
    if (apiParam) {
      queryDataParam.apiParam = apiParam;
    }

    if (layerIns?.isTileLayer) {
      layerIns.filterSelectLayer &&
        layerIns.filterSelectLayer({
          queryFeatures: filter,
          isDeal: false,
          isFilter: isFilter,
          isLabel,
          filterType: 'search',
          filterWay,
        });
      const mapFn = getMapFn(mapType);
      mapFn.getFeatureByFilter({
        ...queryDataParam,
        callback: (data) => {
          const arr = data.map((item) => {
            item.layerCode = layerCode;
            return item;
          });
          setStoreData(queryApiVariable, arr);
          saveParams.length && setMapData(opts, saveParams, arr);
          locationFn(isLocation, data, mapBasicFilter, mapType);
        },
      });
      return;
    }
    const mapFn = getMapFn(mapType);
    mapFn.queryDataInLayer(queryDataParam).then(function (features) {
      const arr = features.map((item) => {
        item.layerCode = layerCode;
        return item;
      });
      setStoreData(queryApiVariable, arr);
      saveParams.length && setMapData(opts, saveParams, arr);
      let queryStyleType = false; //添加标注状态
      if ((isLabel && isLabelRadio && label == '0') || (isLabel && !isLabelRadio)) {
        queryStyleType = true;
      }
      layerIns._renderTriggerClick({
        queryFilterData: features,
        queryStyleType,
        isQueryFilter: isFilter,
        currentLayerCode: layerCode,
        filterType: 'search',
        filterWay,
      });
      locationFn(isLocation, features, mapBasicFilter, mapType);
    });
  };

  // }

  //有instance
  if (curLayer) {
    renderInstance();
  } else {
    window.globalEventEmitter.on('renderLayerEvent', () => {
      renderInstance();
    });
  }
};

const locationFn = (isLocation, data, mapBasicFilter, mapType) => {
  if (!isLocation || data.length == 0) return;
  const lon = [];
  const lat = [];
  data.forEach((s) => {
    if (s.type?.toLocaleLowerCase() == 'point') {
      const coordinate = s.extent ? s.extent : s.coordinates;
      lon.push(coordinate[0]);
      lat.push(coordinate[1]);
    } else {
      s?.coordinates.forEach((item) => {
        if (s.type?.toLocaleLowerCase() == 'linestring') {
          item?.forEach((v) => {
            lon.push(v[0]);
            lat.push(v[1]);
          });
        } else {
          item?.forEach((v) => {
            v.forEach((l) => {
              lon.push(l[0]);
              lat.push(l[1]);
            });
          });
        }
      });
    }
  });
  const extent = [
    Math.min.apply(null, lon),
    Math.min.apply(null, lat),
    Math.max.apply(null, lon),
    Math.max.apply(null, lat),
  ];
  //筛选掉fitView重新定位
  if (mapType == 'Map3DBasicLayer' || mapType == 'Map3DFoundationPlan') {
    mapBasicFilter._map.fitView({
      extent,
      padding: [0.1, 0.1, 0.1, 0.1],
    });
  } else if (mapType == 'MapGlFoundationPlan') {
    mapBasicFilter._map.fitExtent(extent, {
      padding: { top: 100, bottom: 100, left: 100, right: 100 },
    });
  } else {
    mapBasicFilter._map.fit({
      extent,
      padding: [100, 100, 100, 100],
    });
  }
};

/**
 * @description: 地图分屏对比逻辑
 * @param {Object} opts 一些参数
 * @return {*}
 */
export const gisMapSplitScreen = (opts = {}) => {
  const { data, index, customMapObj } = opts;
  const dataConfig = data.gisAction.mapSplitScreen;

  let {
    mapType,
    operationMethod = true,
    mainPosition = 'left',
    // 主屏图层
    mainVariable = undefined,
    mainVariableExp = 'data',
    mainDataType = 'default',
    mainLayerVal = [
      {
        layerCode: 'tianditu',
        zIndex: 2,
      },
    ],
    // 次屏图层
    secondVariable = undefined,
    secondVariableExp = 'data',
    secondDataType = 'default',
    secondLayerVal = [
      {
        layerCode: 'tianditu_img',
        zIndex: 2,
      },
    ],
    dataParams = [],
  } = dataConfig;

  if (mainDataType != 'default') {
    mainLayerVal = getExpDataByKey(mainVariable, mainVariableExp);
  }
  if (secondDataType != 'default') {
    secondLayerVal = getExpDataByKey(secondVariable, secondVariableExp);
  }

  if (dataParams.length) {
    const objData = getMapData(opts, dataParams);
    mainLayerVal = objData.mainLayerVal;
    secondLayerVal = objData.secondLayerVal;
  }

  let mapConstructor = window.YunliMap;
  if (mapType == 'Map3DBasicLayer' || mapType == 'Map3DFoundationPlan') {
    mapConstructor = window.YunliMap3D;
  }
  const map3dTypeFlag = mapType.indexOf('Map3D') > -1;

  const _loadLayer = (layers = [], map) => {
    if (Array.isArray(layers)) {
      !map._splitScreenLayer && (map._splitScreenLayer = {});
      const arr = [];
      layers.forEach((itemLayer) => {
        const layerConfig = {
          layerCode: itemLayer.layerCode,
          zIndex: itemLayer.zIndex ? itemLayer.zIndex : 1,
        };
        // Layer api 相同的 layerCode 不会重新发起请求，会更新属性，但是会生成新的实例，删除时要使用对应的实例！
        const layerIns = new mapConstructor.Layer(layerConfig);
        map.add(layerIns);
        const key = itemLayer.layerCode + '$$' + Math.floor(Math.random() * 10000);
        map._splitScreenLayer[key] = layerIns;
        arr.push(itemLayer.layerCode);
      });
      return arr;
    }
    return [];
  };

  // 删除不需要的图层
  const _removeLayer = (map, layerCodes = []) => {
    map._splitScreenLayer &&
      Object.keys(map._splitScreenLayer).forEach((item) => {
        const code = item.split('$$')[0];
        if (!layerCodes.includes(code)) {
          map.remove(map._splitScreenLayer[item]);
          delete map._splitScreenLayer[item];
        }
      });
  };

  // 关闭同屏对比
  const _closeSplitScreen = function (mMap) {
    const mainMap = mMap || this;
    // 删除次屏容器
    customMapObj.container.siblings().remove();
    // 样式还原
    customMapObj.container
      .css({
        width: '100%',
      })
      .parent()
      .css({
        display: 'initial',
      });
    // 删除主屏图层
    mainMap._splitScreenLayer &&
      Object.keys(mainMap._splitScreenLayer).forEach((item) => {
        mainMap.remove(mainMap._splitScreenLayer[item]);
      });
    mainMap._splitScreenLayer = {};
    delete mainMap._mapInsSecond;
  };

  const mapIns = customMapObj._map;
  const mainContainer = customMapObj.container;
  // if (mapType == 'Map2DBasicLayer') {
  if (operationMethod) {
    // 开启
    if (mainContainer.siblings().length === 0) {
      // 初始化同屏对比，只一次
      mainContainer
        .css({
          width: '50%',
          position: 'relative',
        })
        .parent()
        .css({
          display: 'flex',
          'flex-direction': 'initial',
        });
      const html = `<div data-map="true" id="second${customMapObj.compKey}" style="width: 50%; height: 100%; position: relative;"></div>`;
      if (mainPosition === 'left') {
        mainContainer.after(html);
      } else {
        mainContainer.before(html);
      }

      const mapCom = window.comList.get(data.mapKey); // 获取主屏地图配置信息
      let mapInsSecond = null;
      if (map3dTypeFlag) {
        const _compAttr = mapCom?.instance?.compAttr || {};
        // 3d 地图
        mapInsSecond = new mapConstructor.Map({
          container: `second${customMapObj.compKey}`,
          center: [_compAttr.longitude, _compAttr.latitude],
          zoom: _compAttr.zoom,
          pitch: _compAttr.pitch,
        });
      } else {
        // 2d 地图
        mapInsSecond = new mapConstructor.Map({
          container: `second${customMapObj.compKey}`,
        });
      }
      // 挂在主屏地图实例上，方便更新图层和使用 hook
      mapIns._mapInsSecond = mapInsSecond;
      // 同步地图
      mapConstructor.syncMultiMap(mapIns, mapIns._mapInsSecond, {
        cursor: {},
      });
      // 地图次屏和主屏底图需要保持一样
      if (!map3dTypeFlag) {
        loadSecondGaudByMain(mapCom, mapIns._mapInsSecond);
      } else {
        loadSecondGaudByMain3D(mapCom, mapIns._mapInsSecond);
      }
    } else {
      const parentEle = mainContainer.parent();
      if (mainContainer.next().length) {
        // 初始主屏在左
        if (mainPosition === 'left') {
          parentEle.css({
            'flex-direction': 'initial',
          });
        } else {
          parentEle.css({
            'flex-direction': 'row-reverse',
          });
        }
      } else {
        // 初始主屏在右
        if (mainPosition === 'left') {
          parentEle.css({
            'flex-direction': 'row-reverse',
          });
        } else {
          parentEle.css({
            'flex-direction': 'initial',
          });
        }
      }
    }
    // 两边叠加或更新图层
    const codes1 = _loadLayer(mainLayerVal, mapIns);
    const codes2 = _loadLayer(secondLayerVal, mapIns._mapInsSecond);
    _removeLayer(mapIns, codes1);
    _removeLayer(mapIns._mapInsSecond, codes2);
    // 暴露给业务方，方便在 hook 里退出同屏对比模式（需要用到的话）
    mapIns.closeSplitScreen = _closeSplitScreen;
  } else {
    // 关闭
    if (mapIns.closeSplitScreen && mapIns._mapInsSecond) {
      mapIns.closeSplitScreen();
    }
  }
  // }
};

/**
 * 二维地图获取主屏底图配置进而给次屏设置同样的底图
 * @param {Object} mapCom 主屏地图组件
 * @returns
 */
const loadSecondGaudByMain = (mapCom, mapInsSecond) => {
  if (mapCom && Array.isArray(mapCom.layers) && mapCom.layers.length) {
    // 找到在线底图子组件
    const gaudLayer = mapCom.layers.find(
      (item) => item.compName === '在线底图' || item.englishName === 'MapGaudOnline',
    );
    if (!gaudLayer || !gaudLayer.instance) return;
    // console.log('gaudLayer==>', gaudLayer);
    const gaudIns = gaudLayer.instance;
    const compAttr = gaudIns.compAttr;
    const loadLayerMap = {
      // 高德在线底图
      0: () => {
        let mapStyle = compAttr.styleTemplate;
        if (compAttr.styleBool) {
          mapStyle = compAttr.mapStyleId;
        }

        const amap = new YunliMap.AMapLayer({
          key: compAttr.gaudKey, //唯一的key值
          features: [
            //北京、道路、建筑物、标注
            compAttr.backgroundBool ? 'bg' : '',
            compAttr.roadBool ? 'road' : '',
            compAttr.buildBool ? 'building' : '',
            compAttr.taggingBool ? 'point' : '',
          ],
          mapStyle: mapStyle,
          traffic: compAttr.trafficBool, // 是否显示路况信息
        });
        mapInsSecond.add(amap); // 图层添加到地图
      },
      // 天地电子图
      1: () => {
        mapInsSecond.add(new YunliMap.Layer({ layerCode: 'tianditu' }));
      },
      // 天地影像图
      2: () => {
        mapInsSecond.add(new YunliMap.Layer({ layerCode: 'tianditu_img' }));
      },
      // 天地地形图
      3: () => {
        mapInsSecond.add(new YunliMap.Layer({ layerCode: 'tianditu_dem' }));
      },
      // 百度在线
      4: () => {
        let mapStyle = compAttr.styleTemplate;
        if (compAttr.styleBool) {
          mapStyle = compAttr.mapStyleId;
        }

        const amap = new YunliMap.BMapLayer({
          version: '1.0',
          key: '6ZZiXSUiQNxUnZ6o0fFeFG6ato2OYif6', // 这个值不能变
          mapStyle: mapStyle,
          // gpsCoordinates:false //是否将gps坐标矫正为百度坐标
        });
        mapInsSecond.add(amap); // 图层添加到地图
      },
      // 自定义
      5: () => {
        const { customMapType, customMapUrl } = compAttr;
        let opts = {};
        let layerFun = null;
        opts.url = customMapUrl;
        if (customMapType == 'xyz') {
          layerFun = YunliMap.XYZLayer;
        } else if (customMapType == 'arcgis') {
          layerFun = YunliMap.ArcGISLayer;
        } else if (customMapType == 'wms') {
          layerFun = YunliMap.WMSLayer;
        } else if (customMapType == 'wmts') {
          const wmtsOpts = {
            //layer: 'ChinaOnlineCommunity',
            matrixSet: 'default028mm',
            format: 'image/png',
            style: 'default',
            wrapX: true,
          };
          opts = Object.assign({}, opts, wmtsOpts);
          layerFun = YunliMap.WMTSLayer;
        } else {
          return;
        }
        const customMap = new layerFun(opts);
        mapInsSecond.add(customMap);
      },
    };
    loadLayerMap[compAttr.mapType]?.();
    return mapInsSecond;
  }
};

/**
 * 三维获取主屏底图配置进而给次屏设置同样的底图
 * @param {Object} mapCom 主屏地图组件
 * @returns
 */
const loadSecondGaudByMain3D = (mapCom, mapInsSecond) => {
  if (mapCom && Array.isArray(mapCom.layers) && mapCom.layers.length) {
    // 找到在线底图子组件
    const gaudLayer = mapCom.layers.find(
      (item) => item.compName === '3d基础底图' || item.englishName === 'Map3DBasicLayer',
    );
    if (!gaudLayer || !gaudLayer.instance) return;
    const gaudIns = gaudLayer.instance;
    const compAttr = gaudIns.compAttr;
    const loadLayerMap = {
      // 天地图
      tianditu: () => {
        mapInsSecond.add(new YunliMap3D.Layer({ layerCode: 'tianditu' }));
      },
      // 天地影像图
      default_img: () => {
        mapInsSecond.add(new YunliMap3D.Layer({ layerCode: 'default_img' }));
      },
      // 天地地形图
      tianditu_dem: () => {
        mapInsSecond.add(new YunliMap3D.Layer({ layerCode: 'tianditu_dem' }));
      },
      // 高德地图
      amap: () => {
        mapInsSecond.add(new YunliMap3D.Layer({ layerCode: 'amap' }));
      },
      // 高德地图
      amap_img: () => {
        mapInsSecond.add(new YunliMap3D.Layer({ layerCode: 'amap_img' }));
      },
      // 自定义
      thirdPartyLayers: () => {
        const { thirdPartyLayerType, thirdPartyLayerUrl, WMTSProps } = compAttr;
        let opts = {};
        let layerFun = null;
        opts.url = thirdPartyLayerUrl;
        if (thirdPartyLayerType == 'XYZ') {
          layerFun = YunliMap3D.XYZLayer;
        } else if (thirdPartyLayerType == 'ArcGIS') {
          layerFun = YunliMap3D.ArcGISLayer;
        } else if (thirdPartyLayerType == 'WMS') {
          layerFun = YunliMap3D.WMSLayer;
          let _WMTSProps = {};
          if (WMTSProps) {
            try {
              _WMTSProps = JSON.parse(WMTSProps);
            } catch (err) {
              console.error(err);
            }
          }
          opts = {
            ...opts,
            ..._WMTSProps,
          };
        } else if (thirdPartyLayerType == 'WMTS') {
          let _WMTSProps = {};
          if (WMTSProps) {
            try {
              _WMTSProps = JSON.parse(WMTSProps);
            } catch (err) {
              console.error(err);
            }
          }
          const wmtsOpts = {
            tileMatrixSetID: 'default028mm',
            format: 'image/png',
            style: 'default',
            ..._WMTSProps,
          };
          opts = Object.assign({}, opts, wmtsOpts);
          layerFun = YunliMap3D.WMTSLayer;
        } else {
          return;
        }
        const customMap = new layerFun(opts);
        mapInsSecond.add(customMap);
      },
    };
    if (compAttr.layerType === 'defaultLayers') {
      // 默认图层
      loadLayerMap[compAttr.defaultLayerType]?.();
    } else if (compAttr.layerType === 'thirdPartyLayers') {
      // 第三方图层
      loadLayerMap.thirdPartyLayers();
    }
    return mapInsSecond;
  }
};

/**
 * 三维-粒子特效，见 http://172.26.30.146:31800/#/js_3dapi?menu=reservoirflood
 */
export const gisMapParticleEffects = (opts = {}) => {
  const { data, index, customMapObj } = opts;
  const dataConfig = data.gisAction.mapParticleEffects;
  const mapIns = customMapObj._map;
  if (!mapIns._particleSystems) mapIns._particleSystems = [];

  // console.log('mapParticleEffects==>', opts, dataConfig);

  let {
    posDataType = 'default',
    positionVal = {
      lon: 103.273298,
      lat: 36.058203,
      height: 1610,
      scale: 1.5,
      show: 1,
    },
    positionVariable = undefined,
    positionVariableExp = 'data',
    lonMapField = 'lon',
    latMapField = 'lat',
    heightMapField = 'height',
    scaleMapField = 'scale',
    showMapField = 'show',
    initStartColor = 'rgba(224,255,255,0.3)',
    initEndColor = 'rgba(255,255,255,0.0)',
    initStartScale = 2,
    initEndScale = 4,
    minimumParticleLife = 1.1,
    maximumParticleLife = 3.1,
    minimumSpeed = 4.0, // 设置以米/秒为单位的最小界限，超过该最小界限，随机选择粒子的实际速度。
    maximumSpeed = 16.0, // 设置以米/秒为单位的最大界限，超过该最大界限，随机选择粒子的实际速度。
    emissionRate = 200.0, // 每秒要发射的粒子数。
    lifetime = 8.0,
    transX = 2, // X轴方向上的偏离距离（单位：米）
    gravity = -15, //重力因子
    maxHeight = 2000, // 超出该高度后不显示粒子效果
    directionNorth = 101.5, // x轴 ：北向，y轴：东向，z轴：上方向
    directionEast = 113.6,
    directionUp = 84.2,
    imgSrc = getImageUrl('/assets/datai/gis/smoke.png'),
  } = dataConfig;

  if (posDataType == 'varible') {
    positionVal = getExpDataByKey(positionVariable, positionVariableExp);
  }

  const position = Cesium.Cartesian3.fromDegrees(
    positionVal[lonMapField],
    positionVal[latMapField],
    positionVal[heightMapField],
  );
  // 将度转成弧度再 cos
  const x = Math.cos((directionNorth * Math.PI) / 180);
  const y = Math.cos((directionEast * Math.PI) / 180);
  const z = Math.cos((directionUp * Math.PI) / 180);
  const target = new Cesium.Cartesian3(x, y, z);

  // 添加粒子特效
  const addWaterGate = () => {
    const particleSystem = new YunliMap3D.ParticleSystem({
      id: Math.floor(Math.random() * 10000),
      position: position, // 位置
      style: {
        image: imgSrc,
        imageSize: new Cesium.Cartesian2(1.5, 1.5),
        sizeInMeters: true, //是否粒子大小以米为单位
        startColor: Cesium.Color.fromCssColorString(initStartColor), // 粒子出生时的颜色
        endColor: Cesium.Color.fromCssColorString(initEndColor), // 当粒子死亡时的颜色
        startScale: initStartScale * positionVal[scaleMapField], // 粒子出生时的比例，相对于原始大小
        endScale: initEndScale * positionVal[scaleMapField], // 粒子在死亡时的比例
        minimumParticleLife,
        maximumParticleLife,
        minimumSpeed,
        maximumSpeed,
        emissionRate,
        lifetime,
      },
      transX,
      gravity,
      target: target, // 粒子的方向
      maxHeight,
    });
    mapIns._particleSystems.push(particleSystem);
    mapIns.add(particleSystem);
    //监听清除
    if (positionVariable) {
      const EventEmitter = window.globalEventEmitter;
      EventEmitter.on(positionVariable, () => {
        const positionVal = getExpDataByKey(positionVariable, positionVariableExp);
        if (positionVal[showMapField] == 0) {
          mapIns.remove(particleSystem);
        }
      });
    }
  };
  // 显示
  addWaterGate();
};

/**
 * 相机飞行
 * @param {*} opts
 */
export const gisMapFlyAnimate = (opts = {}) => {
  const { data, customMapObj } = opts;
  const dataConfig = data.gisAction.mapFlyAnimate;
  const {
    // isLongVar = false,
    // isLatVar = false,
    // long = undefined,
    // longVariableExp = 'data',
    // longVariable = undefined,
    // lat = undefined,
    // latVariableExp = 'data',
    // latVariable = undefined,
    locationMode = false,
    // center = undefined,
    // isCenterVariable = false,
    // centerVariableExp = 'data',
    // centerVariable = undefined,
    // zoom = undefined,
    // isZoomVar = false,
    // zoomVariableExp = 'data',
    // zoomVariable = undefined,
    dataParams = [],
    animateTypeVal = 'none',
    animateTimeVal,
  } = dataConfig;
  const mapIns = customMapObj._map;
  let lon = 116,
    lat = 39,
    zoomVal = 7,
    pitch,
    rotation;
  const mapZoom = mapIns.getZoom() || mapIns.zoom;

  if (dataParams.length) {
    let objData = getMapData(opts, dataParams);
    lon = parseFloat(objData['lon']);
    lat = parseFloat(objData['lat']);
    zoomVal = parseFloat(objData['zoom']) || mapZoom;
    pitch = parseFloat(objData['pitch']);
    rotation = parseFloat(objData['rotation']);
  }

  let centerVal = [lon, lat];
  // if (isCenterVariable) {
  //   centerVal = getExpDataByKey(centerVariable, centerVariableExp);
  // }
  if (locationMode) {
    centerVal = data.mapType === 'MapGlFoundationPlan' ? customMapObj._map?.defaultCenter : customMapObj._map?.center;
    zoomVal = mapZoom;
  } else {
    if (Number.isNaN(lon)) {
      console.error('相机飞行经度错误!');
      return;
    }
    if (Number.isNaN(lat)) {
      console.error('相机飞行纬度错误!');
      return;
    }
  }

  const animateDuration = animateTypeVal != 'none' ? parseFloat(animateTimeVal) : 0;

  if (Number.isNaN(zoomVal)) {
    console.error('相机飞行缩放级别错误!');
    return;
  }

  if (Number.isNaN(animateDuration)) {
    console.error('相机飞行动画时间错误!');
    return;
  }

  // v8.5.0 相机飞行，支持GL地图
  if (data.mapType === 'MapFoundationPlan') {
    mapIns?.animate({
      center: centerVal,
      zoom: [zoomVal],
      duration: animateDuration, //毫秒
      easing: 'flyTo', // 飞行动画
    });
  } else if (data.mapType === 'MapGlFoundationPlan') {
    // easing 默认是匀速运动
    mapIns?.flyTo({
      center: centerVal,
      zoom: zoomVal,
      duration: animateDuration,
    });
  } else if (data.mapType === 'Map3DFoundationPlan') {
    let flyObj = {
      center: centerVal,
      zoom: zoomVal,
      duration: animateDuration / 1000.0, // 秒
      easing: animateTypeVal, // 飞行动画
    };
    rotation && (flyObj.rotation = rotation);
    pitch && (flyObj.pitch = pitch);
    if (animateTypeVal === 'none') delete flyObj.easing;
    mapIns?.flyTo(flyObj);
  }
};

export const gisAnimationPoint = (opts = {}) => {
  const { data, customMapPlan } = opts;
  const animationData = data.gisAction.mapAnimationPoint;
  const { layerKey } = animationData;
  const mapLayers = customMapPlan.layers;
  const mapTreeKeyType = getMapTreeKey().includes(layerKey);

  mapLayers.forEach((layer) => {
    if (layer.key == layerKey) {
      layer._attr.radarInfo = animationData;
      mapTreeKeyType && layer?.instance?.mergeAttr({ radarInfo: animationData });
    }
  });
  //图层树包含图层就由图层树来控制显隐
  if (mapTreeKeyType) {
    return;
  }

  const layerIndex = mapLayers.findIndex((layer) => layer.key === layerKey);
  if (layerIndex == -1) {
    return;
  }
  const layer = mapLayers[layerIndex];
  const curLayer = layer?.instance?.layer_instance;
  if (curLayer) {
    curLayer.animationPoint(animationData);
  }
};

const getMapTreeKey = () => {
  const mapKeys = [];
  const deep = (list = []) => {
    list.forEach((comp) => {
      if (comp.type == 'LayerTree') {
        comp.props.layerTree[0]?.children.forEach((item) => {
          mapKeys.push(item.key);
          item.layerKey && mapKeys.push(item.layerKey);
          item?.children.forEach((v) => {
            mapKeys.push(v.key);
            v.layerKey && mapKeys.push(v.layerKey);
          });
        });
      }

      if (comp.classType === 'group' || comp?.childComList) {
        deep(comp.childComList);
      }
      // v8.17新增折叠面板
      if (comp.type === 'DynamicPanel' || comp.type === 'CollapsePanel') {
        comp.children.forEach((child) => {
          deep(child.AntdChildComponents);
        });
      }
    });
  };
  deep(layerList);
  return mapKeys.filter((key) => key.includes('@com'));
};
