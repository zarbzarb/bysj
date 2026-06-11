import { conditionFilterDataFun, loadMapLayerRender } from '@/utils/utils';
import { getMapData, getMapFn } from './gisCommon';

// 分图层渲染
export const gisDataSplitRender = async (opts = {}) => {
  let { data, customMapPlan } = opts;
  const {
    relation_layer_code = '',
    updateApiType = false,
    updateApiTime = 10,
    compKey,
  } = data['gisAction']['mapDataSplitRender'];

  let mapFn = await getYunLiMapFn(data);
  function getData() {
    mapFn.getFeatureByFilter({
      layerCode: relation_layer_code,
      needPolygon: true,
      callback: (res) => {
        if (!res) {
          return;
        }
        filterData(res, data['gisAction']['mapDataSplitRender'], customMapPlan);
      },
    });
  }
  getData();
  if (updateApiType) {
    let mapDataTimer = setInterval(() => {
      getData();
    }, updateApiTime * 1000);
    timerTask.addTask({
      taskId: mapDataTimer,
      taskType: 'interval',
      appPageId: screenConfig.pageId,
    });
    observeDomStyleChange(mapDataTimer, compKey);
  }
};

const filterData = (data, option, customMapPlan) => {
  const {
    mapList = [
      {
        key: 123456,
        label: '图层1',
        layerKey: '',
        statusList: [
          {
            key: 123456,
            label: '状态1',
            rules: [],
          },
        ],
      },
    ],
  } = option;
  let layerData = mapList.map((v) => {
    let filterData = [];
    v.statusList.forEach((item) => {
      let s = getStatusList(data, item);
      filterData = [...filterData, ...s];
    });
    return {
      layerKey: v.layerKey,
      filData: filterData,
    };
  });

  let layerType = ['Map2DPointPolymerization', 'Map3DPointPolymerization'];
  // 初始化图层
  layerData.forEach((item) => {
    const { layerKey, filData } = item;
    let mapLayers = customMapPlan.layers;
    let layerIndex = mapLayers.findIndex((layer) => layer.key === layerKey);
    if (layerIndex < -1) return;
    let curLayer = mapLayers[layerIndex];
    curLayer._attr.filData = filData;

    // 处理不是点线面的图层
    if (layerType.includes(curLayer.englishName)) {
      otherRender(item, curLayer, customMapPlan);
      return;
    }
    let curIns = curLayer?.instance?.layer_instance;
    if (!curLayer?.createFlag && curLayer.createFlag != undefined) {
      loadMapLayerRender({
        layer: curLayer,
        baseMap: customMapPlan,
      });
      curIns ? renderInstances(curIns, filData, curLayer) : getLayerIns(curLayer, filData);
    } else {
      curIns ? renderInstances(curIns, filData, curLayer) : getLayerIns(curLayer, filData);
    }
  });
};
// 初始化不创建需要先传教图层instance然后渲染
const otherRender = (ops, curLayer, customMapPlan) => {
  const { filData } = ops;
  if (curLayer.createFlag == false) {
    curLayer.filData = filData;
    const layerCb = (layer) => {
      getLayerOtherIns(layer, layer.filData);
    };
    loadMapLayerRender({
      layer: curLayer,
      baseMap: customMapPlan,
      gisEventType: true,
      layerCb: layerCb,
    });
  } else {
    getLayerOtherIns(curLayer, filData);
  }
};

// 根据不同规则获取不同点位
const getStatusList = (data, condition) => {
  let filData = [];
  for (let j = 0; j < data.length; j++) {
    let propsData = data[j].props;
    let bool = conditionFilterDataFun(propsData, condition);
    if (bool) {
      filData.push(data[j]);
      // break;
    }
  }
  return filData;
};

// const YunLiFn = (data) => {
//   let mapFn = window.YunliMap;
//   if (data.mapType == 'Map3DBasicLayer' || data.mapType == 'Map3DFoundationPlan') {
//     mapFn = window.YunliMap3D;
//   }
//   return mapFn;
// };

const getYunLiMapFn = async (data) => {
  return new Promise((resolve) => {
    let mapFn = getMapFn(data.mapType);
    if (mapFn) {
      resolve(mapFn);
      return;
    }
    let timerLayer = setInterval(() => {
      mapFn = getMapFn(data.mapType);
      if (mapFn) {
        clearInterval(timerLayer);
        resolve(mapFn);
      }
    }, 500);
  });
};

const renderInstances = (curLayerIns, filData, layer) => {
  let timer = setTimeout(() => {
    // 主要是处理图层树后于分图层渲染执行导致点位被覆盖问题
    clearTimeout(timer);
    if (layer.type === '@yl/datai-com-map-gl-base-polygon-layer') {
      curLayerIns._clear();
      curLayerIns.layerDatas = filData;
      return;
    }
    curLayerIns._clear();
    curLayerIns._createFeatures(filData);
    curLayerIns._initInteraction();
  }, 500);
};

// 获取图层layer_instance
const getLayerIns = (layer, filData) => {
  let timerLayer = setInterval(() => {
    let curIns = layer?.instance?.layer_instance;
    if (curIns) {
      clearInterval(timerLayer);
      renderInstances(curIns, filData, layer);
    }
    if (timerLayer > 10000) {
      clearInterval(timerLayer);
    }
  }, 500);
};

// 获取点聚合instance
const getLayerOtherIns = (layer, filData) => {
  let curIns = layer?.instance;
  if (curIns) {
    renderOther(curIns, filData);
    return;
  }
  let timerLayer = setInterval(() => {
    curIns = layer?.instance;
    if (curIns) {
      clearInterval(timerLayer);
      renderOther(curIns, filData);
    }
    if (timerLayer > 10000) {
      clearInterval(timerLayer);
    }
  }, 500);
};

// 点聚合渲染
const renderOther = (curIns, filData) => {
  filData = filData.map((item) => {
    item.lon = item.coordinates[0];
    item.lat = item.coordinates[1];
    return item;
  });
  const { config } = curIns;
  config._source = 'variableRef';
  config._data = filData;
  curIns.mergeConfig(config);
};

const observeDomStyleChange = (timer, compKey) => {
  let winDom = document.querySelector(`[data-key*="${compKey}"]`);
  if (!winDom) {
    return;
  }
  let MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
  let observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.attributeName == 'style' && winDom.style.display == 'none') {
        clearInterval(timer);
        winDomObserver.disconnect();
      }
    });
  });
  let config = {
    attributes: true,
    childList: false,
    characterData: false,
  };
  observer.observe(winDom, config);
  let winDomObserver = observer;
};

// 定位
export const gisLocation = (opts = {}) => {
  let { data, customMapObj } = opts;
  let { lat, longitude, locationMode = false, dataParams = [] } = data['gisAction']['mapLocationEvent'];
  // 默认中心点
  let center = customMapObj._map?.defaultCenter ?? [customMapObj.compAttr.longitude, customMapObj.compAttr.latitude];

  if (dataParams.length > 0) {
    let objData = getMapData(opts, dataParams);
    lat = objData['lat'];
    longitude = objData['longitude'];
  }
  const type = lat && longitude;
  if (!locationMode && type) {
    center = [Number.parseFloat(longitude), Number.parseFloat(lat)];
  }

  if (data.mapType === 'MapGlFoundationPlan') {
    let zoom = customMapObj.compAttr.zoom;
    if (data.gisAction?.mapZoomEvent) {
      let { dataParams = [] } = data.gisAction?.mapZoomEvent;
      if (dataParams.length > 0) {
        let objData = getMapData(opts, dataParams);
        zoom = Number.parseFloat(objData['zoom']);
      }
      customMapObj._map?.flyTo({
        center,
        zoom,
      });
    } else {
      customMapObj._map?.flyTo({
        center,
      });
    }
  } else {
    customMapObj._map?.setCenter(center);
  }
};

// 缩放
export const gisSetZoom = (opts = {}) => {
  let { data, customMapObj } = opts;
  let { zoom, dataParams = [] } = data['gisAction']['mapZoomEvent'];
  if (dataParams.length) {
    let objData = getMapData(opts, dataParams);
    zoom = objData['zoom'];
  }
  zoom = Number.parseFloat(zoom);
  if (zoom >= 18) {
    zoom = 18.01;
  }

  if (data.mapType === 'MapGlFoundationPlan') {
    let center = [customMapObj.compAttr.longitude, customMapObj.compAttr.latitude];
    if (data.gisAction?.mapLocationEvent) {
      let { lat, longitude, locationMode = false, dataParams = [] } = data.gisAction.mapLocationEvent;

      if (locationMode) {
        center = customMapObj._map?.getCenter();
      }
      if (dataParams.length > 0) {
        let objData = getMapData(opts, dataParams);
        lat = objData['lat'];
        longitude = objData['longitude'];
      }
      const type = lat && longitude;
      if (!locationMode && type) {
        center = [Number.parseFloat(longitude), Number.parseFloat(lat)];
      }
      customMapObj._map?.flyTo({
        zoom,
        center,
      });
    } else {
      customMapObj._map?.setZoom(zoom);
    }
  } else {
    customMapObj._map?.setZoom(zoom);
  }
};

// 绕点旋转
let frameKey = null,
  rotation = 0;
export const gisLookAt = (opts = {}) => {
  let { data, customMapObj } = opts;
  console.log(opts);
  let { rotationMode = 1, dataParams = [] } = data['gisAction']['mapLookAt'];
  let { mapType } = data;
  const is3DMap = mapType.indexOf('3D') > -1 ? true : false;
  const {
    lat = '39',
    longitude = '116',
    pitch = is3DMap ? '-30' : '30',
    range = is3DMap ? '10000' : '5',
    duration = '3',
  } = getMapData(opts, dataParams);
  const map = customMapObj._map;

  // 多个交互使用先去清掉上一个动画
  if (frameKey) {
    cancelAnimationFrame(frameKey);
  }
  const stop = () => {
    if (!frameKey) return;
    if (!is3DMap) {
      // map.setRotation(rotation, false);
    } else {
      rotation = map.getRotation();
      map.lookAt();
    }
    cancelAnimationFrame(frameKey);
    frameKey = null;
  };

  if (!is3DMap) {
    map.setCenter([Number(longitude), Number(lat)], false);
    map.setPitch(Number(pitch), false);
    map.setZoom(Number(range), false);
    map.container.addEventListener('mousedown', stop);
    map.container.addEventListener('wheel', stop);
  } else {
    map.mapEvent.EventHandler.setInputAction(stop, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    map.mapEvent.EventHandler.setInputAction(stop, Cesium.ScreenSpaceEventType.WHEEL);
  }

  const start3DLooAt = (heading) => {
    map.lookAt([Number(longitude), Number(lat)], {
      heading,
      pitch: Number(pitch), // 俯仰角
      range: Number(range), // 距中心的距离，单位为米。
    });
  };
  const startGlLooAt = (heading) => {
    map.setRotation(heading, false);
  };

  let startTime = performance.now();
  frameKey = requestAnimationFrame(function animate() {
    let scale = (performance.now() - startTime) / (duration * 1000);
    let heading = ((360 * scale + rotation) % 360) * -rotationMode;
    is3DMap ? start3DLooAt(heading) : startGlLooAt(heading);
    frameKey = requestAnimationFrame(animate);
  });
};
