/*
 * @Author: zengwei
 * @Date: 2022-05-25 10:44:50
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2023-06-14 10:56:39
 * 右键菜单所有操作
 */

import {
  removeCompInstance,
  removeGridLayoutComponent,
  getGroupChildIdx,
  getActiveDynamicChildIdx,
} from '@/utils/componentUtils';
import { Modal, message } from 'antd';
import _ from 'lodash';
import copy from 'clipboard-copy';
import { formatPosition as formatTransform } from '@/utils/transformUtils';
import { Store } from '@/store/index';

const getComponent = window.DataI.getComponentByKey;
const { layerStore, globalStore } = Store;
const { getComponentByCurrentLayerList } = layerStore;

const { confirm } = Modal;

/**
 * 根据子组件key值查找父组
 */
export const getGroupByChildKey = (key) => {
  const item = getComponent(key);
  if (item && item.groupKey) {
    return getComponent(item.groupKey);
  }
  return null;

  // function findInList(list = [], parent) {
  //   list.forEach((cp) => {
  //     if (cp.key === key) {
  //       item = parent;
  //     } else if (cp.classType === 'group' || cp?.isDragContainer) {
  //       findInList(cp.childComList || [], cp);
  //     }
  //   });
  // }
  // let comList = window.componentList || [];
  // if (globalStore.bigScreenType !== 'card') {
  //   comList = layerStore.comList;
  // }
  // findInList(comList); // 遍历查找指定组件所在的组
  // return item;
};

/**
 * 删除多个组件
 * @param {array} keys
 * @param {function} callBackFn
 */
export const DelCompByKeys = (store, keys, callBackFn) => {
  const waitRemoveComp = keys
    .map((key) => {
      const comp = getComponentByCurrentLayerList(key);
      return comp;
    })
    .filter(Boolean);

  const titleStr = '确定删除子组件吗？';
  const delStr = `关联子组件：${waitRemoveComp
    .map((vl) => {
      return vl.compName || vl.name;
    })
    .join(',')}`;
  confirm({
    getContainer: () => document.querySelector('#app'), // 弹框挂载到编辑模式
    title: titleStr,
    content: delStr,
    className: 'del-notice-modal',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      // const { screenConfig } = window;
      // if (screenConfig.isResponsive) {
      //   if (store.responsiveCompChangeKey) {
      //     waitRemoveComp.forEach((vl) => {
      //       removeGridLayoutComponent([vl.key], store.responsiveCompChangeKey);
      //     });
      //   } else {
      //     message.warning('请在编辑状态下删除选中的子组件!');
      //   }
      // } else {
      window.executeCommand('RemoveCompCommand', waitRemoveComp);
      // }
      if (callBackFn) {
        callBackFn();
      }
    },
    onCancel() {
      console.log('取消');
    },
  });
};

export const lock = (keys) => {
  const waitLockComp = keys.map((key) => {
    return getComponent(key);
  });
  waitLockComp.map((item) => {
    item.comLock = true;
    return item;
  });
};

export const unLock = (keys) => {
  const waitUnlockComp = keys.map((key) => {
    return getComponent(key);
  });
  waitUnlockComp.map((item) => {
    item.comLock = false;
    return item;
  });
};

// v8.17 新增折叠面板
const dynamicPanelToggleVisible = (waitInvisibleComp, visible) => {
  const dp = waitInvisibleComp.filter((com) => com.type === 'DynamicPanel' || com.type === 'CollapsePanel');
  if (dp.length > 0) {
    dp.forEach((item) => {
      item.children.forEach((element) => {
        element.AntdChildComponents.forEach((v) => {
          v.comInvisible = visible;
        });
      });
    });
  }
};

export const invisible = (keys) => {
  const waitInvisibleComp = keys.map((key) => {
    const comp = getComponentByCurrentLayerList(key);
    return comp;
  });
  waitInvisibleComp.map((item) => {
    item.comInvisible = true;
    return item;
  });
  dynamicPanelToggleVisible(waitInvisibleComp, true);
};

export const unInvisible = (keys) => {
  const waitInvisibleComp = keys.map((key) => {
    const comp = getComponentByCurrentLayerList(key);
    return comp;
  });
  waitInvisibleComp.map((item) => {
    item.comInvisible = false;
    return item;
  });
  dynamicPanelToggleVisible(waitInvisibleComp, false);
};

export const visibleParentLoop = (comp) => {
  if (comp.groupKey) {
    const parent = getComponentByCurrentLayerList(comp.groupKey);
    parent.comInvisible = false;
    visibleParentLoop(parent);
  }
};
export const visibleWithLoop = (comps, visible) => {
  comps.forEach((com) => {
    com.comInvisible = visible;
    // 子组件显示时，父组件应该为显示状态
    if (!visible) {
      visibleParentLoop(com);
    }

    // 隐藏组件时子组件全部隐藏(显示组件时不需要子组件显示)
    if (visible) {
      if (com.classType === 'group' || com?.isDragContainer) {
        visibleWithLoop(com.childComList, visible);
      }
      if (com.type === 'DynamicPanel' || com.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        com.children.forEach((element) => {
          visibleWithLoop(element.AntdChildComponents, visible);
        });
      }
    }
  });
};

export const visibleWithSelf = (comps, visible) => {
  comps.forEach((com) => {
    com.comInvisible = visible;
    // 隐藏组件时子组件全部隐藏(显示组件时不需要子组件显示)
    if (visible && (com.type === 'DynamicPanel' || com.type === 'CollapsePanel')) {
      // v8.17 新增折叠面板
      com.children.forEach((element) => {
        visibleWithSelf(element.AntdChildComponents, visible);
      });
    }
  });
};

// v8.17 新增折叠面板
const moveDynamicPanelChildToPre = (key, parentKey) => {
  const dynamicPanel = getComponentByCurrentLayerList(parentKey);
  // v8.17 折叠面板和动态面板区分
  const { activeKey } = dynamicPanel.props;
  let activeIndex = activeKey;
  if (dynamicPanel.type === 'CollapsePanel') {
    activeIndex = dynamicPanel.children.findIndex((child) => child.key === activeKey);
  }
  if (activeIndex !== -1) {
    const idx = getActiveDynamicChildIdx(dynamicPanel.children[activeIndex], key);
    if (idx === 0) return;
    const com = dynamicPanel.children[activeIndex].AntdChildComponents.splice(idx, 1)[0];
    com.zIndex += 1;
    dynamicPanel.children[activeIndex].AntdChildComponents.splice(idx - 1, 0, com);
    const preCom = dynamicPanel.children[activeIndex].AntdChildComponents[idx];
    preCom.zIndex -= 1;
  }
};

const moveGroupChildToPre = (key) => {
  const group = getGroupByChildKey(key);
  const idx = getGroupChildIdx(group, key);
  if (idx === 0) return;
  const com = group.childComList.splice(idx, 1)[0];
  com.zIndex += 1;
  group.childComList.splice(idx - 1, 0, com);
  const preCom = group.childComList[idx];
  preCom.zIndex -= 1;
};

// v8.17 新增折叠面板
const moveDynamicPanelChildToNext = (key, parentKey) => {
  const dynamicPanel = getComponentByCurrentLayerList(parentKey);
  // v8.17 折叠面板和动态面板区分
  const { activeKey } = dynamicPanel.props;
  let activeIndex = activeKey;
  if (dynamicPanel.type === 'CollapsePanel') {
    activeIndex = dynamicPanel.children.findIndex((child) => child.key === activeKey);
  }
  const idx = getActiveDynamicChildIdx(dynamicPanel.children[activeIndex], key);
  if (idx === dynamicPanel.children[activeIndex].AntdChildComponents.length - 1) return;
  const com = dynamicPanel.children[activeIndex].AntdChildComponents.splice(idx, 1)[0];
  com.zIndex -= 1;
  dynamicPanel.children[activeIndex].AntdChildComponents.splice(idx + 1, 0, com);
  const nextCom = dynamicPanel.children[activeIndex].AntdChildComponents[idx];
  nextCom.zIndex += 1;
};

const moveGroupChildToNext = (key) => {
  const group = getGroupByChildKey(key);
  const idx = getGroupChildIdx(group, key);
  if (idx === group.childComList.length - 1) return;
  const com = group.childComList.splice(idx, 1)[0];
  com.zIndex -= 1;
  group.childComList.splice(idx + 1, 0, com);
  const nextCom = group.childComList[idx];
  nextCom.zIndex += 1;
};

// v8.17 新增折叠面板
const moveDynamicPanelChildToTop = (key, parentKey) => {
  const dynamicPanel = getComponentByCurrentLayerList(parentKey);
  // v8.17 折叠面板和动态面板区分
  const { activeKey } = dynamicPanel.props;
  let activeIndex = activeKey;
  if (dynamicPanel.type === 'CollapsePanel') {
    activeIndex = dynamicPanel.children.findIndex((child) => child.key === activeKey);
  }
  const idx = getActiveDynamicChildIdx(dynamicPanel.children[activeIndex], key);
  if (idx === 0) return;
  const com = dynamicPanel.children[activeIndex].AntdChildComponents.splice(idx, 1)[0];
  dynamicPanel.children[activeIndex].AntdChildComponents.unshift(com);
  dynamicPanel.children[activeIndex].AntdChildComponents.forEach((comItem, curIdx) => {
    comItem.zIndex = 9999 - curIdx;
  });
};

const moveGroupChildToTop = (key) => {
  const group = getGroupByChildKey(key);
  const idx = getGroupChildIdx(group, key);
  if (idx === 0) return;
  const com = group.childComList.splice(idx, 1)[0];
  group.childComList.unshift(com);

  group.childComList.forEach((comItem, curIdx) => {
    comItem.zIndex = 9999 - curIdx;
  });
};

// v8.17 新增折叠面板
const moveDynamicPanelChildToBottom = (key, parentKey) => {
  const dynamicPanel = getComponentByCurrentLayerList(parentKey);
  // v8.17 折叠面板和动态面板区分
  const { activeKey } = dynamicPanel.props;
  let activeIndex = activeKey;
  if (dynamicPanel.type === 'CollapsePanel') {
    activeIndex = dynamicPanel.children.findIndex((child) => child.key === activeKey);
  }
  const idx = getActiveDynamicChildIdx(dynamicPanel.children[activeIndex], key);
  if (idx === dynamicPanel.children[activeIndex].AntdChildComponents.length - 1) return;
  const com = dynamicPanel.children[activeIndex].AntdChildComponents.splice(idx, 1)[0];
  dynamicPanel.children[activeIndex].AntdChildComponents.push(com);
  dynamicPanel.children[activeIndex].AntdChildComponents.forEach((comItem, curIdx) => {
    comItem.zIndex = 9999 - curIdx;
  });
};

const moveGroupChildToBottom = (key) => {
  const group = getGroupByChildKey(key);
  const idx = getGroupChildIdx(group, key);
  if (idx === group.childComList.length - 1) return;
  const com = group.childComList.splice(idx, 1)[0];
  group.childComList.push(com);
  group.childComList.forEach((comItem, curIdx) => {
    comItem.zIndex = 9999 - curIdx;
  });
};

export const MoveToPre = (key, type, parentKey) => {
  const { currentLayerComList: componentList } = layerStore;
  const idx = componentList.findIndex((vl) => vl.key === key);
  if (idx < 0) {
    if (type === 'dynamicPanel') {
      moveDynamicPanelChildToPre(key, parentKey);
    } else {
      moveGroupChildToPre(key);
    }
    return;
  }
  if (idx === 0) return;
  const com = componentList.splice(idx, 1)[0];
  com.zIndex += 1;
  componentList.splice(idx - 1, 0, com);
  const preCom = componentList[idx];
  preCom.zIndex -= 1;
  layerStore.updateCurrentLayerComList(componentList);
};

export const MoveToNext = (key, type, parentKey) => {
  const componentList = layerStore.currentLayerComList;
  const idx = componentList.findIndex((vl) => vl.key === key);
  if (idx < 0) {
    if (type === 'dynamicPanel') {
      moveDynamicPanelChildToNext(key, parentKey);
    } else {
      moveGroupChildToNext(key);
    }
    return;
  }
  if (idx === componentList.length - 1) return;
  const com = componentList.splice(idx, 1)[0];
  com.zIndex -= 1;
  componentList.splice(idx + 1, 0, com);
  const nextCom = componentList[idx];
  nextCom.zIndex += 1;

  layerStore.updateCurrentLayerComList(componentList);
};

export const MoveToTop = (key, type, parentKey) => {
  const componentList = layerStore.currentLayerComList;
  const idx = componentList.findIndex((vl) => vl.key === key);
  if (idx < 0) {
    if (type === 'dynamicPanel') {
      moveDynamicPanelChildToTop(key, parentKey);
    } else {
      moveGroupChildToTop(key);
    }
    return;
  }
  if (idx === 0) return;
  const com = componentList.splice(idx, 1)[0];
  // 获取当前组件所在图层的第一个组件索引
  const index = componentList.findIndex((v) => v.layerId === com.layerId);
  // const index = 0;
  componentList.splice(index, 0, com);
  // 当前图层所有组件重新生成zindex
  const startIndex = componentList[index].zIndex;
  componentList.forEach((comItem, curIdx) => {
    comItem.zIndex = startIndex - curIdx;
  });

  layerStore.updateCurrentLayerComList(componentList);
};

export const MoveToBottom = (key, type, parentKey) => {
  const componentList = layerStore.currentLayerComList;
  const idx = componentList.findIndex((vl) => vl.key === key);
  if (idx < 0) {
    if (type === 'dynamicPanel') {
      moveDynamicPanelChildToBottom(key, parentKey);
    } else {
      moveGroupChildToBottom(key);
    }
    return;
  }
  if (idx === componentList.length - 1) return;
  const com = componentList.splice(idx, 1)[0];
  // 获取当前组件所在图层的最后一个组件索引
  const index = componentList.length - 1 - [...componentList].reverse().findIndex((v) => v.layerId === com.layerId);
  // const index = componentList.length - 1;
  componentList.splice(index + 1, 0, com);
  const endIndex = componentList[index].zIndex;
  const { length } = componentList;
  componentList.forEach((comItem, curIdx) => {
    comItem.zIndex = endIndex + (length - 1) - curIdx;
  });
  layerStore.updateCurrentLayerComList(componentList);
};

export const shearComp = (keys) => {
  const shearCompList = keys.map((key) => {
    const comp = getComponentByCurrentLayerList(key);
    const obj = _.cloneDeep(comp);
    if (obj.styles) {
      let transform = formatTransform(obj.styles.transform);
      transform = transform.map((vl) => vl + 20);
      obj.styles.transform = `translate(${transform[0]}px, ${transform[1]}px)`;
    }
    return removeCompInstance(obj);
  });

  const json = {
    type: 'shearComp',
    code: shearCompList,
  };
  copy(JSON.stringify(json));
};

export const editChildContainer = (store) => {
  const comp = getComponentByCurrentLayerList(store.changeKeys[0]);
  const { width } = comp.styles;
  const { height } = comp.props.panelOption;
  const size = {
    width,
    height,
  };
  store.openChildContainerEdit(size);
};
