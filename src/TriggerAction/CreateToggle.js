import $ from 'jquery';

const mapLoaded = (amap) => {
  return new Promise((resolve, reject) => {
    if (!amap || amap.olView) {
      resolve();
    } else {
      amap.load(function () {
        resolve();
      });
    }
  });
};

const mapHideWithInitial = (comp) => {
  const mapArray = [];
  let p = Promise.resolve();
  // 判断组中是否包含地图
  const loop = (list) => {
    list.forEach((com) => {
      if (com.type == '@yl/datai-com-map-foundationPlan') {
        mapArray.push(com);
      }
      if (com.type == '@yl/dataq-com-group-basic') {
        loop(com.childComList || []);
      }
    });
  };
  loop([comp]);

  // 包含地图，需要等待底图加载完毕后再隐藏
  if (mapArray.length > 0) {
    // 所有底图
    const foundationPlans = mapArray.map((map) => {
      const f = map.layers.find((l) => l.type == '@yl/datai-com-map-gaud-online');
      return f;
    });

    const asyncLoads = foundationPlans.map((f) => mapLoaded(f?.instance?.amap));
    p = Promise.all(asyncLoads);
  }

  return p;
};

const compatible = (key) => {
  let selector = `[data-key="${key}"]`;
  if ($(selector).length > 0) {
    return selector;
  }
  selector = `[data-key="@com_${key}"]`;
  if ($(selector).length > 0) {
    return selector;
  }
  return selector;
};

// 递归组内报表组件重新渲染
const instanceRender = (list) => {
  list.forEach((com) => {
    com.instance && com.instance.render && com.instance.render();
    if (com.classType === 'group' || com?.isDragContainer) {
      instanceRender(com.childComList);
    } else if (com.type === 'DynamicPanel' || com.type === 'CollapsePanel') {
      com.children.forEach((child) => {
        instanceRender(child.AntdChildComponents);
      });
    }
  });
};

const toggleCreate = (compKey, createFlag) => {
  const EventEmitter = window.globalEventEmitter;
  let comp;
  if (window.comList) {
    comp = window.comList.get(compKey);
  }
  if (!comp) {
    return console.error(compKey, '没有找到配置的创建销毁组件');
  }
  const eventKey = `${compKey}createFlag`;
  EventEmitter.emit(eventKey, createFlag); // 触发创建事件
};

export default (action, settings) => {
  const { createFlag, appPageId } = action.actionSettings;
  let { compKey } = action.actionSettings;

  const screenConfig = settings.config;
  // 兼容之前大屏中单选compKey为字符串操作，后期可删除
  if (typeof compKey === 'string') {
    compKey = compKey === '' ? [] : [compKey];
  }
  // 动态面板子组件伪key
  // DynamicPanel-38uNLbxL94LB2DvUj8ezNU-0
  const dynamicPanelKey = compKey.filter((key) => key.includes('DynamicPanel'));
  // 去掉动态面板子组件伪key,提取子组件真实key
  compKey = compKey.filter((key) => !key.includes('DynamicPanel'));
  if (dynamicPanelKey.length > 0) {
    let dynamicPanelCompKeys = [];
    dynamicPanelKey.forEach((key) => {
      const arr = key.split('-');
      if (window.comList) {
        const dynaimc = window.comList.get(arr[1]);
        if (dynaimc) {
          dynamicPanelCompKeys = [
            ...dynamicPanelCompKeys,
            ...dynaimc.children[Number.parseInt(arr[2])].AntdChildComponents.map((v) => v.key),
          ];
        }
      }
    });
    if (dynamicPanelCompKeys.length > 0) {
      compKey = [...compKey, ...dynamicPanelCompKeys];
    }
  }

  let layers = [];
  const pageInfo = appPageId ? window.DataI.PAGEINFOMAP[appPageId] : window.DataI.PAGEINFOMAP[screenConfig?.pageId];
  // v7.4 防止window.screenConfig覆盖
  // TODO 8.0 layerConfig
  if (pageInfo?.pageConfig?.layerConfig || false) {
    layers = pageInfo?.pageConfig.layerConfig.layers; // 卡片没有图层管理的概念
  }
  compKey.forEach((key) => {
    const islayer = layers.some((v) => v.key === key);
    // 组件显隐
    if (!islayer) {
      toggleCreate(key, createFlag);
    } else if (islayer) {
      // 图层显隐
      const { layerId } = layers.find((v) => v.key === key);
      const componentList = window.layerList || [];
      const comKeylist = componentList.filter((v) => v.layerId === layerId).map((v) => v.key);

      comKeylist.forEach((v) => {
        toggleCreate(v, createFlag);
      });
    }
  });
};
