/*
 * @Author: zengwei
 * @Date: 2022-05-25 10:13:10
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2023-06-29 14:08:56
 * 编辑页工具类方法，可以引入ComStore、LayerStore
 */
import { formatPosition as formatPositionByTransform } from '@/utils/analysis';
import { groupPosition, mapGetMatrix } from '@/utils/compute';
import { GetQueryString } from '@/utils/BrowserUtils';
import { filterDataStore, dealCopyDataStoreKey, filterCardUrl } from '@/utils/resetKeys';
import _, { cloneDeep } from 'lodash';
import { message } from 'antd';
import * as operate from '@/utils/operate';
import { Store } from '@/store/index';
import { toJS } from 'mobx';
import DataI from './global-api';

const { layerStore, globalStore } = Store;
// console.log('layerStore', layerStore);
/**
 * 根据子组件key值查找父组
 */
export const getGroupByChildKey = (key) => {
  let item = null;
  function findInList(list = [], parent) {
    list.forEach((cp) => {
      if (cp.key === key) {
        item = parent;
      } else if (cp.classType === 'group' || cp?.isDragContainer) {
        findInList(cp.childComList || [], cp);
      }
    });
  }
  // let comList = window.componentList || [];
  // if (globalStore.bigScreenType !== 'card') {
  //   comList = layerStore.comList;
  // }
  const { comList } = layerStore;
  findInList(comList); // 遍历查找指定组件所在的组
  return item;
};
/**
 * 查找组内指定key值的组件索引
 */
export const getGroupChildIdx = (item, key) => {
  const idx = item.childComList.findIndex((vl) => vl.key === key); // 查询组内组件索引
  return idx;
};

export const getActiveDynamicChildIdx = (activeDynamicPanel, key) => {
  const idx = activeDynamicPanel.AntdChildComponents.findIndex(
    (vl) => vl.key === key, // 查询动态面板内antd组件索引
  );
  return idx;
};
// 是否允许移动组件层级
export const isAllowSort = (changeKeys, type, parentKey, optType) => {
  if (changeKeys.length === 0) {
    message.warning('请选择一个组件进行移动！');
    return false;
  }
  if (changeKeys.length > 1) {
    message.warning('位移不支持批量操作！');
    return false;
  }
  const key = changeKeys[0];
  let componentList = layerStore.currentLayerComList;
  let idx = componentList.findIndex((vl) => vl.key === key);
  if (idx < 0) {
    if (type === 'dynamicPanel') {
      // v8.17 新增折叠面板
      const dynamicPanel = layerStore.getComponentByCurrentLayerList(parentKey);
      // v8.17 折叠面板和动态面板区分
      const { activeKey } = dynamicPanel.props;
      let activeIndex = activeKey;
      if (dynamicPanel.type === 'CollapsePanel') {
        activeIndex = dynamicPanel.children.findIndex((child) => child.key === activeKey);
      }
      componentList = dynamicPanel.children[activeIndex].AntdChildComponents;
      idx = getActiveDynamicChildIdx(dynamicPanel.children[activeIndex], key);
    } else {
      const group = getGroupByChildKey(key);
      componentList = group.childComList;
      idx = getGroupChildIdx(group, key);
    }
  }

  switch (optType) {
    case 'UpSeat': {
      if (idx === 0) {
        message.warning('已经是当前列表第一个组件！');
        return false;
      }
      break;
    }
    case 'NextSeat': {
      if (idx === componentList.length - 1) {
        message.warning('已经是当前列表最后一个组件！');
        return false;
      }
      break;
    }
    case 'ToTop': {
      if (idx === 0) {
        message.warning('已经是当前列表第一个组件！');
        return false;
      }
      break;
    }
    case 'ToBottom': {
      if (idx === componentList.length - 1) {
        message.warning('已经是当前列表最后一个组件！');
        return false;
      }
      break;
    }
    default: {
      break;
    }
  }

  return true;
};

export const getAllIds = () => {
  const item = [];
  function findInList(list = []) {
    list.forEach((cp) => {
      item.push(cp.key);
      if (cp.classType === 'group') {
        findInList(cp.childComList || []);
      }
    });
  }
  findInList(layerStore.comList || []); // 遍历查找所有的组件key
  return item;
};

/**
 * 查找一级组索引
 */
export const getGroupIndex = (key) => {
  const groupIdx = layerStore.currentLayerComList.findIndex(
    (vl) => vl.key === key && vl.classType === 'group', // 查询组索引
  );
  return groupIdx;
};

export function deepBackUnGroupCom(list, position) {
  position = formatPositionByTransform(position); // martrix
  list.forEach((vl, i) => {
    destroyInstance(vl);

    const transform = formatPositionByTransform(vl.styles.transform); // martrix
    transform[0] += position[0];
    transform[1] += position[1];
    // 删除父组的信息
    vl.groupKey = undefined;
    vl.styles.transform = `translate(${transform[0]}px, ${transform[1]}px)`;
    // 嵌套组的组件,仅处理第一次就好
    if (vl.classType === 'group' || vl?.isDragContainer) {
      // 不处理位置，仅销毁实例
      vl.childComList.forEach((ch) => {
        destroyInstance(ch);
      });
    }
  });
}

// 取消成组
export function splitGroupByItem(groupItem = {}) {
  if (groupItem.classType !== 'group') {
    return;
  }
  const groupChildren = groupItem.childComList || [];
  // 取消组时，子组件的level改为被取消组的level，即level-1
  groupChildren.forEach((v) => (v.level = groupItem.level));

  deepBackUnGroupCom(groupChildren, groupItem.styles.transform);

  const parent = getGroupByChildKey(groupItem.key);
  if (parent) {
    const idx = getGroupChildIdx(parent, groupItem.key);
    // 删除被取消的组
    removeComponentByCurrentLayerList(groupItem.key);
    // 将取消组的子组件的groupKey赋值为父组的key
    groupChildren.forEach((v) => (v.groupKey = parent.key));
    // 向被取消的组的父组中放入被取消组的子组件
    parent.childComList.splice(idx, 0, ...groupChildren);
    parent._accurate_update = true;
    layerStore.updateComponent(parent);
  } else {
    const idx = getGroupIndex(groupItem.key);
    const componentList = layerStore.currentLayerComList;
    componentList.splice(idx, 1, ...groupChildren);
    layerStore.updateCurrentLayerComList(componentList);
  }
  return groupChildren.map((v) => v.key);
}

// 销毁item的instance
export function destroyInstance(item) {
  if (Array.isArray(item.layers)) {
    item.layers.forEach((child, index) => {
      if (child.instance) {
        child._attr = child.instance.compAttr;
        child._data = child.instance._data;
        child._shape = child.instance.shapeCss;
        child._config = child.instance.config;
        child._visible = child.instance.visible;
      }
      try {
        child?.instance?.destroy && child.instance.destroy();
      } catch (error) {
        console.error(error);
      }
      delete child.instance;
      delete child.initCom;
      delete child.CssPage;
    });
  }

  if (item.instance) {
    if (item.classType != 'antd') {
      item.preAttr = {
        _attr: JSON.parse(JSON.stringify(item.instance.compAttr)),
        _config: JSON.parse(JSON.stringify(item.instance.config)),
        _data: JSON.parse(JSON.stringify(item.instance._data)),
        _shap: JSON.parse(JSON.stringify(item.instance.shapeCss)),
      };
    }
    item.instance.destroy && item.instance.destroy();
    if (item.classType != 'group') item.instance = undefined;
  }
  if (item.instance && item.instance.chart) {
    item.instance = undefined;
  }
  if (item.instance && item.instance.compKey) {
    // item.instance._map = null;
    item.instance = undefined;
  }

  if (item.instance && item.instance.copyDestroy) {
    item.instance.copyDestroy();
  }

  if (item.instance && item.instance.judgeTime) {
    item.instance.judgeTime();
  }

  item && (item._accurate_update = true);
}

// 删除组件
export const removeComponent = (keys, list) => {
  if (typeof keys === 'string') {
    keys = [keys];
  }
  let newComList = [];
  const removedList = [];

  function filterList(list) {
    return list.filter((l) => {
      if (_.indexOf(keys, l.key) > -1) {
        removedList.push(l);
        return false;
      }
      if (l.classType === 'group') {
        l.childComList = filterList(l.childComList);
      }
      if (l.type === 'DynamicPanel' || l.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        l.children.forEach((child) => {
          child.AntdChildComponents = filterList(child.AntdChildComponents);
        });
      }
      return true;
    });
  }
  newComList = filterList(list);

  // const type = GetQueryString('type');
  // if (type === 'card') {
  //   window.componentList = newComList;
  // } else {
  //   layerStore.updateCurrentLayerComList(newComList);
  // }
  layerStore.updateCurrentLayerComList(newComList);

  return removedList;
};

export const removeComponentByCurrentLayerList = (keys) => {
  // const type = GetQueryString('type');
  // let list = window.componentList;
  // if (type !== 'card') {
  //   list = layerStore.currentLayerComList;
  // }
  const list = layerStore.currentLayerComList;
  return removeComponent(keys, list);
};

export const getComponentByCurrentLayerList = (keys) => {
  // const type = GetQueryString('type');
  // let list = window.componentList;
  // if (type !== 'card') {
  //   list = layerStore.currentLayerComList;
  // }
  const list = layerStore.currentLayerComList;
  return layerStore.getComponent(keys, list);
};

export const getComponent = (key, comList) => {
  let list = comList;
  // const type = GetQueryString('type');
  if (!comList) {
    list = layerStore.comList;
  }
  // 临时处理
  // if (type === 'card' && !comList) {
  //   return DataI.getComList(key, window.componentList)[0];
  // }
  return key ? DataI.getComList(key, list)[0] : null;
};

// todo: 快捷键回退时需要重新处理，此处逻辑较乱
// 处理左侧树形列表的拖拽事件
// source可以是单个节点，或者多个节点key的集合
export function handleDragDrop(source, target, store, moveSite) {
  console.log('目标组件:', target, '被拖动组件:', source);

  const isForbidden = dragForbidden(source, target);
  if (isForbidden) {
    message.error('父组无法向子孙组中拖动!');
    return false;
  }
  if (!source) {
    message.error('拖动发生异常');
    return false;
  }

  /**
   * 重写拖拽画布坐标显示方法
   */
  if (source) {
    const sourceList = Object.prototype.toString.call(source) === '[object Object]' ? [source] : source;
    sourceList.forEach((node) => {
      const newList = operate.newMove(node, target, layerStore.currentLayerComList, moveSite);
      newList.forEach((item) => {
        deepDestoryInstance(item);
      });
      layerStore.updateCurrentLayerComList(newList);
    });

    // updateDragComps(newList);
    /** 同步 DataI.COMINFOMAP 的值，解决组件拖动到组的时候，右侧数据不更新的问题 */
    // DataI.addComKeyMap(newList);
    return;
  }

  const type = GetQueryString('type');
  let keys = [];
  keys = Array.isArray(source) ? source : [source.key];

  /**
   * targe 存在4种情况
   * 1. null 表示拖到组件列表最上面
   * 2. targe存在但是groupKey不存在 拖动到某个组件下面
   * 3. targe存在但是groupKey不存在,而且targe类型是组，说明是一级组，会拖到组内
   * 4. targe存在而且groupKey存在,说明是拖入到组内
   */

  // 一、拖动到组件列表最上面
  if (!target) {
    const componentList = layerStore.currentLayerComList;
    // 获取被拖动组件
    const sourceComs = keys.map((v) => DataI.getComponentByKey(v));
    const { groupKey } = sourceComs[0];
    // groupKey存在说明是从组内拖动到最外层
    if (groupKey) {
      // 获取被拖动组件的父级组
      const parent = DataI.getComponentByKey(groupKey);
      parent._accurate_update = true;
      if (parent && parent.childComList.length > 0) {
        const pathLength = store.editModePaths.length;
        // 判断是否是在卡片、组编辑界面拖动
        if (pathLength > 0) {
          const rootGroup = getComponent(store.editModePaths[pathLength - 1]);
          const removedList = updateDragComps(parent.childComList, rootGroup, keys);
          computeDragSize(rootGroup, parent, removedList);
          return;
        }
        const removedList = updateDragComps(parent.childComList, null, keys);
        computeDragSize(null, parent, removedList);
        componentList.splice(0, 0, ...removedList);
      }
    } else {
      // groupKey不存在说明是列表中正常拖动
      const removedList = updateDragComps(componentList, null, keys);
      componentList.splice(0, 0, ...removedList);
    }
    layerStore.updateCurrentLayerComList(componentList);
    return;
  }

  // 组内
  if (target) {
    let targetGroup = null;
    let idx = -1;
    if (target.classType === 'group') {
      // 组内组下面()
      targetGroup = DataI.getComponentByKey(target.key);
    } else if (target.groupKey) {
      // 组内组件下面
      targetGroup = DataI.getComponentByKey(target.groupKey);
    } else {
      const componentList = layerStore.currentLayerComList;
      idx = componentList.findIndex((child) => child.key === target.key);
    }
    if (target.groupKey || target.classType === 'group') {
      idx = targetGroup.childComList.findIndex((child) => child.key === target.key);
    }
    // 获取被拖动组件
    const sourceComs = keys.map((v) => DataI.getComponentByKey(v));
    const { groupKey } = sourceComs[0];
    if (groupKey) {
      // 获取被拖动组件的父级组
      const parent = DataI.getComponentByKey(groupKey);
      if (parent && parent.childComList.length > 0) {
        // 组内拖动排序
        if (parent.key === targetGroup.key) {
          // 获取被拖动组件的index
          const sourceIdx = targetGroup.childComList.findIndex((child) => child.key === sourceComs[0].key);
          // 如果被拖动组件的index大于目标index,是从后向前拖动,这种情况对顺序无影响
          // 如果被拖动组件的index小于目标index,是从前向后拖动,这种情况由于前面的组件被删除，会影响后续插入组件时的index
          if (idx > sourceIdx) {
            // 插入的位置需要减掉被删除的组件个数
            idx -= sourceComs.length;
          }
        }

        // 更新被拖动组件
        const removedList = updateDragComps(parent.childComList, targetGroup, keys);
        // 计算新组和原组的位置、大小
        computeDragSize(targetGroup, parent, removedList, idx);

        if (target.classType !== 'group' && !target.groupKey) {
          // 放到目标组件下方
          componentList.splice(idx + 1, 0, ...removedList);
          layerStore.updateCurrentLayerComList(componentList);
        }
      }
    } else {
      // 外层正常拖动
      const componentList = layerStore.currentLayerComList;
      const sourceIdx = componentList.findIndex((child) => child.key === keys[0]);
      // 更新被拖动组件的位置、层级、groupKey
      const removedList = updateDragComps(componentList, targetGroup, keys);

      // 如果被拖动组件的index大于目标index,是从后向前拖动,这种情况对顺序无影响
      // 如果被拖动组件的index小于目标index,是从前向后拖动,这种情况由于前面的组件被删除，会影响后续插入组件时的index
      if (idx > sourceIdx) {
        // 插入的位置需要减掉被删除的组件个数
        idx -= keys.length;
      }

      if (target.classType !== 'group' && !target.groupKey) {
        // 放到目标组件下方
        componentList.splice(idx + 1, 0, ...removedList);
      } else {
        // 计算组件位置
        computeDragSize(targetGroup, null, removedList, idx);
      }
      layerStore.updateCurrentLayerComList(componentList);
    }
    return;
  }
}

/**
 *
 * @param {被拖动组件所在列表} componentList
 * @param {目标组} targetGroup
 * @param {被拖动组件key} keys
 * @returns 被拖动的组件
 */
function updateDragComps(componentList, targetGroup, keys) {
  // 1. 获取被拖动组件
  const removedList = componentList.reduce((pre, cur) => {
    if (keys.includes(cur.key)) {
      pre.push(cur);
    }
    return pre;
  }, []);

  // 2. 从原位置删除被拖动组件
  for (const element of removedList) {
    componentList.splice(
      componentList.findIndex((child) => child.key === element.key),
      1,
    );
  }

  // 3. 将被拖出组件还原为绝对位置
  computeComPos(removedList);

  // 4. 删除组件的父组key、
  removedList.forEach((com) => {
    com.level = targetGroup ? targetGroup.level + 1 : 1;
    com.groupKey = targetGroup ? targetGroup.key : undefined;
    com._accurate_update = true;
    deepDestoryInstance(com);
  });

  return removedList;
}

/**
 *
 * @param {拖入组件的目标组} targetGroup
 * @param {被拖动组件的父组} sourceParent
 */
function computeDragSize(targetGroup, sourceParent, removedList, idx = -1) {
  if (targetGroup) {
    // 1. 组内原组件还原为绝对位置
    targetGroup.childComList.forEach((child) => {
      computeComPos(child);
      child._accurate_update = true;
    });
    // 2. 添加拖入的组件
    targetGroup.childComList.splice(idx + 1, 0, ...removedList);
    // 3. 重新计算组的大小位置和组内组件的相对位置
    computeGroupPosWithLoop(targetGroup);
    // 4. 重新更新组件位置需要重新渲染
    targetGroup._accurate_update = true;
  }

  // 5. 被拖动组件的父组(从组内拖出组件)
  if (sourceParent) {
    sourceParent._accurate_update = true;
    sourceParent.childComList.forEach((child) => {
      child._accurate_update = true;
      // 组内组件还原为绝对位置
      computeComPos(child);
    });
    // 重新计算组内组件的相对位置
    computeGroupPosWithLoop(sourceParent);
  }
}

// 任意组件拖动时还原为绝对位置
function computeComPos(comps) {
  let target = comps;
  if (comps.length > 0) {
    target = comps[0];
  }
  // 已经是绝对位置
  if (!target.groupKey) return;

  const parents = [];
  const loop = (key) => {
    const parent = getComponent(key);
    parents.push(parent);
    if (parent.groupKey) {
      loop(parent.groupKey);
    }
  };
  // 获取目标组所有父组
  if (target.groupKey) {
    loop(target.groupKey);
  }

  // 从顶级父组开始还原位置
  const { px, py } = parents.reverse().reduce(
    (pre, cur) => {
      const transform = mapGetMatrix(cur.styles.transform);
      const px = transform[0];
      const py = transform[1];

      pre.px += px;
      pre.py += py;

      return pre;
    },
    { px: 0, py: 0 },
  );

  const targetTransform = mapGetMatrix(target.styles.transform);
  targetTransform[0] += px;
  targetTransform[1] += py;
  target.styles.transform = `translate(${targetTransform[0]}px, ${targetTransform[1]}px)`;
}

/**
 *
 * @param {目标组} target
 * @param {拖动组件列表} dragList
 */
function dragComputeGroupPos(target, dragList) {
  const parents = [target];
  const loop = (key) => {
    const parent = getComponent(key);
    parents.push(parent);
    if (parent.groupKey) {
      loop(parent.groupKey);
    }
  };
  // 获取目标组所有父组
  if (target.groupKey) {
    loop(target.groupKey);
  }

  // 从顶级父组开始还原位置
  parents.reverse().forEach((p) => {
    restoreChildrenPos(p);
  });

  target.childComList = [...target.childComList, ...dragList];

  // 重新计算相对位置
  parents.reverse().forEach((p) => {
    computeGroupPos(p);
  });

  dragList.forEach((item) => {
    item.groupKey = target.key;
    item.level = target.level + 1;
    item._accurate_update = true;
    deepDestoryInstance(item);
  });
  // 递归更新拖拽后子组的层级
  changeComponentLevel(dragList, target.level + 1);

  target.childComList.forEach((child) => {
    child._accurate_update = true;
  });

  parents.forEach((p) => {
    p.childComList.forEach((child) => {
      child._accurate_update = true;
    });
  });
}

function dragForbidden(source, target) {
  const s = getComponent(source.key);
  let isForbidden = false;
  function findInList(list = []) {
    list.forEach((child) => {
      if (child.key === target.key) {
        isForbidden = true;
      } else if (child.classType === 'group') {
        findInList(child.childComList);
      }
    });
  }
  // 如果被拖动的是组，需要判断是否向子孙组中拖动
  if (target && source.classType === 'group') {
    findInList(s.childComList);
  }
  return isForbidden;
}

/**
 * 计算组的宽高位置
 * @param {组对象} group
 */
export function computeGroupPos(group) {
  // 计算组的位置和大小(找出最小left,top)
  const position = groupPosition(group.childComList);
  const { left, top, initSize } = position;

  // 重新计算子组件相对组组件的位置
  changeChildrenPos(group.childComList, left, top);

  delete position.left;
  delete position.top;
  delete position.initSize;

  group.initSize = initSize;
  group.cssStyle = position;
  group.shapeCss = position;
  group.styles = { ...group.styles, ...position };
}

// 递归重新计算每个父组的宽高位置
export function computeGroupPosWithLoop(group) {
  computeGroupPos(group);
  if (group.groupKey) {
    const parent = DataI.getComponentByKey(group.groupKey);
    computeGroupPosWithLoop(parent);
  }
}
/**
 *
 * @param {组} targetParent
 * @param {组内组件} com
 * 将组内指定组件的位置还原成相对编辑区的位置
 */
function restoreComponentPos(targetParent, com) {
  let tpx = 0;
  let tpy = 0;
  // 查找当前targetParent是否还有父组，如果存在说明是从二级组中向外拖，还原位置时还需要加上父组位置
  const groups = window.componentList.filter((g) => g.classType === 'group');
  const parent = groups.filter((g) => {
    return g.childComList.some((c) => c.key === targetParent.key);
  });
  if (parent && parent.length > 0) {
    const transform = mapGetMatrix(parent[0].styles.transform);
    tpx = transform[0];
    tpy = transform[1];
  }
  // 获取当前组的left,top值
  const transform = mapGetMatrix(targetParent.styles.transform);
  const px = transform[0];
  const py = transform[1];
  // 组内原有组件的left,top还原为相对编辑区的位置（组内组件的位置在成组时已经变成相对于组的位置）
  const childs = Array.isArray(com) ? com : [com];
  childs.forEach((child) => {
    const comTransform = mapGetMatrix(child.styles.transform);
    comTransform[0] = comTransform[0] + px + tpx;
    comTransform[1] = comTransform[1] + py + tpy;
    child.styles.transform = `translate(${comTransform[0]}px, ${comTransform[1]}px)`;
  });

  // 拖出一个组件时重新计算组的位置
  // 组中所有组件位置还原为相对编辑区位置
  restoreChildrenPos(targetParent);
  // 重新计算组的位置宽高
  computeGroupPos(targetParent);
}

/**
 *
 * @param {*} targetParent 组
 * 将组内组件的位置还原成相对编辑区的位置
 */
function restoreChildrenPos(targetParent) {
  // 获取当前组的left,top值
  const transform = mapGetMatrix(targetParent.styles.transform);
  const px = transform[0];
  const py = transform[1];
  targetParent.childComList.forEach((com) => {
    // 组内原有组件的left,top还原为相对编辑区的位置（组内组件的位置在成组时已经变成相对于组的位置）
    const comTransform = mapGetMatrix(com.styles.transform);
    comTransform[0] += px;
    comTransform[1] += py;
    com.styles.transform = `translate(${comTransform[0]}px, ${comTransform[1]}px)`;
  });
}

function changeChildrenPos(list, left, top) {
  list.forEach((vl, i) => {
    const transform = mapGetMatrix(vl.styles.transform);
    transform[0] -= left;
    transform[1] -= top;
    vl.styles.transform = `translate(${transform[0]}px, ${transform[1]}px)`;

    if (vl.classType == 'group') {
      // return changeChildrenPos(vl.childComList, left, top);
    }
  });
}

export function deepDestoryInstance(item) {
  destroyInstance(item);
  if (item.children && item.children.length > 0) {
    item.children.forEach((child) => {
      child.AntdChildComponents.forEach((AntdChild) => {
        destroyInstance(AntdChild);
        if (AntdChild.children && AntdChild.children.length > 0) {
          deepDestoryInstance(AntdChild);
        }
        if (AntdChild.childComList && AntdChild.childComList.length > 0) {
          deepDestoryInstance(AntdChild);
        }
      });
    });
  }
  if (item.childComList && item.childComList.length > 0) {
    item.childComList.forEach((comItem) => {
      destroyInstance(comItem);
      if (comItem.children && comItem.children.length > 0) {
        deepDestoryInstance(comItem);
      }
      if (comItem.childComList && comItem.childComList.length > 0) {
        deepDestoryInstance(comItem);
      }
    });
  }
}

// 更改组件层级
export function changeComponentLevel(comList, level) {
  comList.forEach((com) => {
    com.level = level;
    if (com.classType == 'group') {
      changeComponentLevel(com.childComList || [], com.level + 1);
    }
  });
}

export const getNowSelectInKey = (compKeys) => {
  const nowFirstSelectKey = compKeys[0] ?? null;
  if (_.isNull(nowFirstSelectKey)) return null;

  const nowFirstSelect = getComponentByCurrentLayerList(nowFirstSelectKey) ?? null;
  if (_.isNull(nowFirstSelect)) return null;

  const nowFirstSelectGroupKey = nowFirstSelect.groupKey ?? null;
  if (_.isNull(nowFirstSelectGroupKey)) return null;

  return nowFirstSelectGroupKey;
};

/**
 * 获取一个组件相对画布的绝对位置
 * @param {any} comp Component //TODO
 * @returns {[number, number]} [Left, Top]
 */
export const getCompOffset = (comp) => {
  const [thisL, thisT] = mapGetMatrix(comp.styles.transform);

  const parent = DataI.getComponentByKey(comp.groupKey);
  if (!parent) return [thisL, thisT];

  const [parentL, parentT] = getCompOffset(parent);

  return [thisL + parentL, thisT + parentT];
};

/**
 * 遍历一个组件及其依赖链
 * @param {any} comp Component //TODO
 * @param {(comp) => void} f
 * @returns {void}
 * @example
 * // 如果我们有这个一个组件树
 * // R
 * // |\
 * // A E
 * // |\
 * // C D
 *
 * // 对`C`进行遍历
 * forParentChain(C, c => console.log(c.name));// C, A, R
 *
 * // 对`E`进行遍历
 * forParentChain(E, c => console.log(c.name));// E, R
 */
export const forParentChain = (comp, f) => {
  const parent = DataI.getComponentByKey(comp?.groupKey);

  f(comp);

  if (!parent) return;

  forParentChain(parent, f);
};

export const concatDataStore = (copyDataStore, invalidVariableKeys = []) => {
  copyDataStore.forEach((copy) => {
    // 1. 查找dataStore中是否存在当前变量组
    const copyData = window.dataStore.find((store) => copy.key === store.key);
    // 2. 存在变量组
    if (copyData) {
      copy.children.forEach((child) => {
        // 3. 判断变量组中变量是否存在
        if (
          copyData.children.findIndex((c) => c.key === child.key) === -1 &&
          !invalidVariableKeys.includes(child.key)
        ) {
          // 3.1 变量组中当前变量不存在，放入当前变量组
          copyData.children.push(child);
        }
      });
    } else {
      // 4. 变量组不存在则放入dataStore
      // 4.1 变量组不存在，且该变量组未被删除，则加入dataStore
      if (!invalidVariableKeys.includes(copy.key)) {
        window.dataStore.push(copy);
      }
    }
  });
};

export const askReadPermission = async () => {
  try {
    const { state } = await navigator.permissions.query({
      name: 'clipboard-read',
    });
    return state === 'granted';
  } catch {
    return false;
  }
};

export const askWritePermission = async () => {
  try {
    const { state } = await navigator.permissions.query({
      name: 'clipboard-write',
    });
    return state === 'granted';
  } catch {
    return false;
  }
};

// 8.5.0 新增地图子图层复制
export const setMapLayer = async (item, mapType, bigScreenId, bigScreenType) => {
  // 删除子图层实例，保存相关数据
  const obj = _.cloneDeep(item);
  if (item.instance) {
    obj._attr = item.instance.compAttr;
    obj._data = item.instance._data;
    obj._shape = item.instance.shapeCss;
    obj._config = item.instance.config;
    obj._visible = item.instance.visible;
  }
  delete obj.instance;
  delete obj.initCom;
  delete obj.CssPage;

  // 转化json字符串
  const crossScreenCopyStr = JSON.stringify(obj);

  // 筛选出被选择组件所依赖的变量
  const copyDataStore = filterDataStore(window.dataStore, crossScreenCopyStr);

  // 存储对象
  const copyLayer = {
    mapType,
    crossScreenId: bigScreenId,
    crossScreenType: bigScreenType,
    crossScreenCopy: JSON.parse(crossScreenCopyStr),
    crossScreenCopyDataStore: copyDataStore,
  };

  // 保存到localStorage
  window.localStorage.setItem('copyLayer', JSON.stringify(copyLayer));

  // 保存到剪贴板
  const permission = await askWritePermission();
  if (permission) {
    await navigator.clipboard.writeText(JSON.stringify(copyLayer));
    message.success('复制成功');
  } else {
    message.success('复制成功');
    console.warn('需要跨域复制粘贴请开启剪贴板权限');
  }
  return true;
};

export const getMapLayer = async (mapType, bigScreenId, bigScreenType, ossPathInfo) => {
  // 获取地图子组件
  let clipText = (await askReadPermission())
    ? await navigator.clipboard.readText()
    : window.localStorage.getItem('copyLayer');
  let copyLayer = {};
  try {
    copyLayer = JSON.parse(clipText);
  } catch {
    clipText = window.localStorage.getItem('copyLayer');
    copyLayer = JSON.parse(clipText);
  }
  const {
    mapType: oldMapType,
    crossScreenId,
    crossScreenType,
    crossScreenCopy, // 地图子组件
    crossScreenCopyDataStore, // 数据变量列表
  } = copyLayer;

  if (!crossScreenCopy || !oldMapType) {
    message.error('粘贴数据非法！');
    return null;
  }
  if (oldMapType !== mapType) {
    message.error('地图类型不符合！');
    return null;
  }
  // 备份
  let copyStr = JSON.stringify(crossScreenCopy);
  // 修改变量key
  if (crossScreenId !== bigScreenId) {
    // 替换跨屏复制出的变量key，每次粘贴都要换key，防止不同应用出现相同的变量
    const onlyOnce = crossScreenType === 'page' && bigScreenType === 'page';
    copyStr = dealCopyDataStoreKey(onlyOnce, bigScreenId, crossScreenCopyDataStore, copyStr);
    // 添加数据变量
    concatDataStore(crossScreenCopyDataStore);
  }
  // 迁移非本屏目录下的资源
  // console.log('filterCardUrl');
  const filteredDataJson = filterCardUrl(copyStr, ossPathInfo, bigScreenType);
  if (filteredDataJson.fileCopy !== 'copyed') {
    filteredDataJson.fileCopy;
  }
  // 解析
  const pasteThings = JSON.parse(copyStr) ?? null;
  return pasteThings;
};
