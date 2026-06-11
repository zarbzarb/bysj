import $ from 'jquery';
import DataI from '@/utils/global-api/core';
import { reRenderVisibleComp } from '@/utils/componentUtils';
import { handleAfterShowUpOrHidden, handleBeforeShowUpOrHide } from '@/EventHandlers/AnimateEvent';
import { nothing } from 'immer';

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
      if (com.type === '@yl/datai-com-map-foundationPlan') {
        mapArray.push(com);
      }
      if (com.type === '@yl/dataq-com-group-basic') {
        loop(com.childComList || []);
      }
    });
  };
  loop([comp]);

  // 包含地图，需要等待底图加载完毕后再隐藏
  if (mapArray.length > 0) {
    // 所有底图
    const foundationPlans = mapArray.map((map) => {
      const f = map.layers.find((l) => l.type === '@yl/datai-com-map-gaud-online');
      return f;
    });

    const asyncLoads = foundationPlans.map((f) => mapLoaded(f?.instance?.amap));
    p = Promise.all(asyncLoads);
  }

  return p;
};

const compatible = (key) => {
  let selector = `[data-key="${key}"]`;
  if ($(selector).length > 0 || key?.includes('@com_')) {
    return selector;
  }
  selector = `[data-key="@com_${key}"]`;
  if ($(selector).length > 0) {
    return selector;
  }
  return selector;
};

/**
 *
 * @param {string} compKey
 * @param {'0' | '1' | '2'} visible 操作类型:
 *   - '0': 显示
 *   - '1': 隐藏
 *   - '2': 切换
 * @param {boolean} initializationFlag
 * @param {unknown} screenConfig
 * @returns {void}
 */
const toggleVisible = (compKey, visible, initializationFlag, screenConfig) => {
  const comp = DataI.getComponentByKey(compKey);

  if (!comp) return console.error(compKey, '没有找到配置的显隐组件');

  if (comp && screenConfig) handleAfterShowUpOrHidden(comp, screenConfig);

  if (initializationFlag || comp.createFlag === undefined) {
    const selector = compatible(compKey);
    const el = $(selector);

    if (el.length === 0) return console.error(selector, '没有对应的组件或者表达式');

    handleBeforeShowUpOrHide(comp, visible === '0' ? 'showup' : visible === '1' ? 'hide' : 'switch', screenConfig);

    switch (visible) {
      case '0':
      case '2': {
        reRenderVisibleComp({ ...comp, compKey }, visible); // 图表组件需要重新渲染
        break;
      }

      case '1': {
        // 组件不存在 或者 在配置界面 初始化时不隐藏组件
        if (!comp || DataI.isConfigPage()) return nothing;

        // 默认先透明，避免因等待地图加载导致组件闪现消失
        el.css({
          opacity: 0,
        });

        mapHideWithInitial(comp)
          .then(() => {
            el.hide().css({
              opacity: 1,
            });
          })
          .catch((error) => console.error(error));

        if (comp && comp.ref) comp.ref.hide();
        break;
      }

      default: {
        break;
      }
    }
  } else {
    const EventEmitter = window.globalEventEmitter;
    const eventKey = `${compKey}showFlag`;
    // 触发显示事件
    setTimeout(() => EventEmitter.emit(eventKey, visible));
  }
};

export default (action, settings) => {
  let { compKey } = action.actionSettings;
  const { visiable, appPageId } = action.actionSettings;

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
          dynamicPanelCompKeys = dynamicPanelCompKeys.concat(
            dynaimc.children[Number.parseInt(arr[2])].AntdChildComponents.map((v) => v.key),
          );
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
    layers = pageInfo?.pageConfig?.layerConfig.layers; // 卡片没有图层管理的概念
  }
  // 兼容初始化显示隐藏事件
  const compEventSetings = settings?.item?.eventSetings ? settings?.item?.eventSetings : settings.item;

  let initializationFlag = false;
  // 获取初始化事件
  const initEventSetting = compEventSetings?.find((item) => item.eventType === 'initialization');
  if (initEventSetting) {
    try {
      // 获取初始化中有显示隐藏的动作组
      const visiableGroups =
        initEventSetting?.groups?.filter((ag) => ag.actions.some((act) => act.actionType === 'visiableToggle')) ?? [];
      // 当前是否执行初始化显隐操作
      initializationFlag = visiableGroups?.some((ag) =>
        ag.actions?.some((act) => act.actionKey && act.actionKey === action.actionKey),
      );
    } catch (error) {
      console.error('visiableToggle', error);
    }
  }

  compKey.forEach((key) => {
    const islayer = layers.some((v) => v.key === key);
    // 组件显隐
    if (!islayer) {
      toggleVisible(key, visiable, initializationFlag, screenConfig);
    } else if (islayer) {
      // 图层显隐
      const { layerId } = layers.find((v) => v.key === key);
      const componentList = window.layerList || [];
      const comKeylist = componentList.filter((v) => v.layerId === layerId).map((v) => v.key);

      comKeylist.forEach((v) => {
        toggleVisible(v, visiable, initializationFlag, screenConfig);
      });
    }
  });
};
