// import { getComponent } from '@/utils/configPageUtils';
import { Store } from '@/store';

const getComponent = window.DataI.getComponentByKey;
const LayerStore = Store.layerStore;

/**
 * 是否允许成组
 * 组最多允许嵌套1个组，不允许多级嵌套
 */
export const allowToGroup = (keys) => {
  let isAllow = true;
  // getComponent 作用是在componentList(当前屏所有的组件对象列表)获取和传入的keys匹配的组件
  const compList = keys.map((key) => getComponent(key)); // getComponent(keys);
  compList.forEach((comp) => {
    if (comp.classType === 'group') {
      comp.childComList.forEach((cc) => {
        if (cc.classType === 'group') {
          isAllow = false;
        }
      });
    }
  });
  return isAllow;
};

/**
 * 是否有地图组件成组
 */
export const allowMapToGroup = (keys) => {
  console.log(keys);
  const mapItems = new Set([
    'MapFoundationPlan', // 2d地图
    'Map3DFoundationPlan', // 3d地图
    'MapGlFoundationPlan', // gl地图
  ]);
  let isAllow = true;
  // getComponent 作用是在componentList(当前屏所有的组件对象列表)获取和传入的keys匹配的组件
  const compList = keys.map((key) => getComponent(key)); // getComponent(keys);
  const loop = (tree = []) => {
    for (const element of tree) {
      if (element?.childComList?.length) {
        loop(element?.childComList);
      } else if (element.classType === 'com' && mapItems.has(element.englishName)) {
        isAllow = false;
        return;
      }
    }
  };
  loop(compList); // 遍历组查找是否包含地图
  // isAllow = compList
  //   .filter((comp) => comp.classType === 'com')
  //   .every((comp) => mapItems.indexOf(comp.englishName) === -1);
  return isAllow;
};

export const allowLayerToGroup = (keys) => {
  // getComponent 作用是在componentList(当前屏所有的组件对象列表)获取和传入的keys匹配的组件
  const compList = keys.map((key) => getComponent(key)); // getComponent(keys);
  return compList.every((v) => v?.layerId === LayerStore.activeLayerId);
};

export const allowBasicLayerToGroup = (keys) => {
  const compList = keys.map((key) => getComponent(key));
  const basicLayer = LayerStore.layers.find((l) => l.layerName === '基础图层');
  // 业务图层的基础图层不允许成组
  return !compList.some((v) => v?.layerId === basicLayer?.layerId);
};

/**
 *
 * @param {} children
 * @description 计算鼠标悬浮在哪个元素上
 */
export const searchHoverChild = (children, rect) => {
  let dom;
  children.forEach((vl) => {
    const bound = document.querySelector(`[data-key='${vl.key}']`).getBoundingClientRect();
    // 大于做边距，小于右边距
    const isX = rect.x >= bound.x && rect.x <= bound.x + bound.width;
    const isY = rect.y >= bound.y && rect.y <= bound.y + bound.height;
    if (isX && isY) {
      dom = vl;
    }
  });
};

export const haveChildByKey = (children = [], keys) => {
  let bool = false;
  // children.findIndex((vl) => keys.indexOf(vl.key) > -1) > -1;
  function deepLoop(list) {
    if (list && Array.isArray(list)) {
      list.forEach((lt) => {
        if (lt && keys.includes(lt.key)) {
          bool = true;
        }
        if ((lt && lt.classType === 'group') || lt.isDragContainer) {
          deepLoop(lt.childComList);
        }
        if (lt && (lt.type === 'DynamicPanel' || lt.type === 'CollapsePanel')) {
          // v8.17 新增折叠面板
          const AntdChildComponents = [];
          lt.children.forEach((child) => {
            child.AntdChildComponents.forEach((AntdChild) => {
              AntdChildComponents.push(AntdChild);
            });
          });
          deepLoop(AntdChildComponents);
        }
      });
    }
  }
  deepLoop(children);
  return bool;
};
