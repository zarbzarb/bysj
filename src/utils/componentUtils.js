/**
 * 编辑态和预览态公用的工具文件（注意不能引入用到了 store 的文件）
 */
import shortId from 'short-uuid';
import { formatPosition as formatPositionByTransform } from '@/utils/analysis';
import _, { isPlainObject } from 'lodash';
import { message, Modal } from 'antd';
import { groupPosition, mapGetMatrix, getCompOffset } from '@/utils/compute';
import { mapBaseLayerTypeRelation, mapBaseLayer2dType } from '@/staticJson/MapBasic';
import DataI from './global-api';
import { unique } from './common';

const { confirm } = Modal;

// 筛选出被选择组件所依赖的变量
export const filterDataStore = (dataStore, comListStr) => {
  const copyDataStore = JSON.parse(JSON.stringify(dataStore));
  return copyDataStore
    .map((group) => {
      for (let index = group.children.length - 1; index >= 0; index--) {
        const variable = group.children[index];
        if (!comListStr.includes(variable.key)) {
          group.children.splice(index, 1);
        }
      }
      return group;
    })
    .filter((group) => group.children.length > 0);
};

/** 是否有子孙组件选中 */
export const hasChildActive = (keys, comp) => {
  let isActive = false;
  const getChildActive = (curKeys, curComp) => {
    if (curComp.childComList && curComp.childComList.length > 0) {
      curComp.childComList.forEach((child) => {
        if (curKeys.includes(child.key)) {
          isActive = true;
        } else if (child.childComList && child.childComList.length > 0) {
          getChildActive(curKeys, child);
        }
      });
    }
  };
  getChildActive(keys, comp);
  return isActive;
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
  findInList(window.componentList || []); // 遍历查找所有的组件key
  return item;
};

export const getAllDynamicPanel = () => {
  let items = [];
  const item = window.componentList.filter((vl) => {
    // v8.17 新增折叠面板
    return vl.type === 'DynamicPanel' || vl.type === 'CollapsePanel';
  });
  const group = window.componentList.filter((vl) => {
    return vl.classType === 'group';
  });
  const groupItems = [];
  group.forEach((groupItem) => {
    groupItem.childComList.forEach((child) => {
      if (child.type === 'DynamicPanel' || child.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        groupItems.push(child);
      }
    });
  });
  items = [...items.concat(item), ...groupItems]; // 查找所有的动态面板
  return items;
};

export const getComponentByGroup = (groupKey, key) => {
  return getGroup(groupKey).childComList.find((vl) => {
    return vl.key === key; // 查找指定组内的指定组件
  });
};

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
  findInList(window.componentList || []); // 遍历查找指定组件所在的组

  return item;
};

export const getGroupIndex = (key) => {
  const groupIdx = window.componentList.findIndex(
    (vl) => vl.key === key && vl.classType === 'group', // 查询组索引
  );
  return groupIdx;
};

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

export const getResponsiveCom = (key) => {
  const componentList = window.gridLayoutList;
  const comp = componentList.find((item) => {
    return item.key === key; // 查询响应式组件
  });
  return comp;
};

export const getResponsiveChildIdx = (responsiveCom, key) => {
  const idx = responsiveCom.gridLayoutComponentList.findIndex(
    (vl) => vl.key === key, // 查询响应式组件索引
  );
  return idx;
};

// 根据key获取对象
export const getComponent = (key, list = []) => {
  // let componentList = [];
  // componentList = window.componentList || list;
  let componentList = list;
  if (!list) {
    componentList = window.componentList;
  }

  if (key === undefined) {
    return;
  }

  if (typeof key === 'object' && !Array.isArray(key) && key.key) {
    key = key.key;
  }
  let isString = false;
  if (typeof key === 'string') {
    isString = true;
    key = [key];
  }

  let comp = [];
  function findInList(list = []) {
    list.forEach((cp, idx) => {
      if (key.includes(cp.key)) {
        cp.idx = idx; // 索引赋值
        comp.push(cp);
      } else if (cp.classType === 'group') {
        findInList(cp.childComList || []);
      } else if (cp.layers) {
        // 判断
        findInList(cp.layers || []);
      } else if (cp.type === 'DynamicPanel' || cp.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        cp.children.forEach((child) => {
          findInList(child.AntdChildComponents);
        });
      }
    });
  }
  findInList(componentList); // 遍历查找指定的组件

  if (isString && comp.length === 0) {
    comp = null;
  }
  if (isString && comp && comp.length > 0) {
    comp = comp[0];
  }
  return comp;
};

// 根据key获取group对象
export const getGroup = getComponent;

// 销毁group中子对象的instance
const destroyGroup = (group = {}) => {
  group.childComList &&
    group.childComList.forEach((child) => {
      // child.instance && child.instance.destroy();
      destroyInstance(child);
      if (child.classType === 'group') {
        destroyGroup(child);
      }
    });
  // group.childComList = [];
};

// 根据key从全局对象中移除group对象
const removeGroupByKey = (key) => {
  let removedItem = null;
  function filtList(list) {
    return list.filter((lt) => {
      if (lt.key === key) {
        removedItem = lt;
        return false;
      }
      if (lt.classType === 'group') {
        lt.childComList = filtList(lt.childComList);
      }
      return true;
    });
  }
  window.componentList = filtList(window.componentList); // 更新组件列表
  return removedItem;
};
// 从全局对象中移除group对象
export const removeGroup = (group) => {
  // destroyGroup(group)
  return removeGroupByKey(group.key);
};

// 根据id移除组内的元素
export const removeGroupChild = (item, keys) => {
  if (typeof keys === 'string') {
    keys = [keys];
  }
  function findInList(list) {
    return list.filter((vl) => {
      if (_.indexOf(keys, vl.key) > -1) {
        return false;
      }
      if (vl.classType === 'group') {
        vl.childComList = findInList(vl.childComList);
      }
      return true;
    });
  }
  findInList(item.childComList);
};

// 根据组和元素id移除组内的元素
export const removeComponentByGroup = (key, groupKey) => {
  const com = getComponent(groupKey);
  removeGroupChild(com, key);
};

export const getComponentByIds = (keys) => {
  if (typeof keys === 'string') {
    keys = [keys];
  }
  const coms = [];

  function findInList(list) {
    list.forEach((c) => {
      if (_.indexOf(keys, c.key) > -1) {
        coms.push(c);
      }
      if (c.classType === 'group') {
        findInList(c);
      }
    });
  }

  findInList(window.componentList);

  return coms;
};

export const removeComponent = (keys, keepOrigin) => {
  if (typeof keys === 'string') {
    keys = [keys];
  }
  // let componentList = _.cloneDeep(window.componentList);
  let newComList = [];
  const removedList = [];

  function filterList(list) {
    return list.filter((l) => {
      if (_.indexOf(keys, l.key) > -1) {
        if (l.classType === 'group' && !keepOrigin) {
          destroyGroup(l);
        }
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
  newComList = filterList(window.componentList || []);

  window.componentList = newComList; // 更新组件列表

  return removedList;
};

export const removeGridLayoutComponent = (keys, responsiveCompChangeKey) => {
  if (typeof keys === 'string') {
    keys = [keys];
  }
  const removedList = [];

  function filterList(list) {
    return list.filter((l) => {
      if (_.indexOf(keys, l.key) > -1) {
        if (l.classType === 'group') {
          destroyGroup(l);
        }
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
  let activeGridLayout;
  let activeIndex = 0;
  window.gridLayoutList.forEach((item, index) => {
    if (item.key === responsiveCompChangeKey) {
      activeIndex = index;
      activeGridLayout = item.gridLayoutComponentList;
    }
  });
  window.gridLayoutList[activeIndex].gridLayoutComponentList = filterList(activeGridLayout || []);
  return removedList;
};

export function deepBackUnGroupCom(list, position) {
  position = formatPositionByTransform(position); // martrix
  list.forEach((vl, i) => {
    destroyInstance(vl);

    const transform = formatPositionByTransform(vl.styles.transform); // martrix
    transform[0] += position[0];
    transform[1] += position[1];
    // 删除父组的信息
    vl.groupKey = null;
    vl.styles.transform = `translate(${transform[0]}px, ${transform[1]}px)`;
    // 嵌套组的组件,仅处理第一次就好
    if (vl.classType === 'group') {
      // 不处理位置，仅销毁实例
      vl.childComList.forEach((ch) => {
        destroyInstance(ch);
      });
    }
  });
}

export function replaceKey(list, groupKey) {
  list.forEach((item, idx) => {
    let uid = shortId.generate();
    if (item.key.includes('group_')) {
      uid = `group_${uid}`;
    }
    if (item.key.includes('store_')) {
      uid = `store_${uid}`;
    }
    if (item.key.includes('@com_')) {
      uid = `@com_${uid}`;
    }
    item.key = uid;
    // 复制粘贴时替换所有子组件的groupKey为父组件key
    if (groupKey) {
      item.groupKey = groupKey;
    }
    if (item.classType === 'group' || item?.childComList) {
      replaceKey(item.childComList || [], item.key);
    }
  });
}

// componentList上的组件level为 1
// 子组件和多级分组level依次递增
export function resetComponentLevel(componentList) {
  componentList.forEach((com) => com.groupKey && delete com.groupKey);
  let level = 0;
  const loopAddLevel = (list) => {
    level++;
    list.forEach((child) => {
      // componentList上的组件没有groupKey,level为1
      if (child.groupKey) {
        const parent = getComponent(child.groupKey, componentList);
        if (parent) {
          child.level = parent.level + 1;
        } else {
          child.level = 1;
          console.warn(`组件: ${child.key} 父组件未知!`);
        }
      } else {
        level = 1;
        child.level = level;
      }

      if (child.classType === 'group') {
        loopAddLevel(child.childComList);
      }
    });
  };
  loopAddLevel(componentList);

  // 兼容老大屏组件上没有level，导致二级组同层级level在递增
  // 同层级分组level取第一个分组的level
  const loopReplaceLevel = (list) => {
    list.forEach((com) => {
      if (com.classType === 'group' && com.childComList.length > 0) {
        const firstLevel = com.childComList[0].level;
        com.childComList.forEach((child) => (child.level = firstLevel));
        loopReplaceLevel(com.childComList);
      }
    });
  };
  loopReplaceLevel(componentList);
}

export function removeCompInstance(item) {
  if (item.classType === 'com') {
    if (item.instance) {
      item._attr = item.instance.compAttr;
      item._data = item.instance._data;
      item._shape = item.instance.shapeCss;
      item._config = item.instance.config;
      item._visible = item.instance.visible;
    }

    delete item.initCom;
    delete item.instance;
    delete item.idx;
    delete item.CssPage;
  } else if (item.classType === 'group' || item?.childComList) {
    item.childComList.forEach((child, key) => {
      removeCompInstance(child);
    });

    if (item.instance) {
      item._attr = item.instance.compAttr;
      item._data = item.instance._data;
      item._shape = item.instance.shapeCss;
      item._config = item.instance.config;
      item._visible = item.instance.visible;
    }

    delete item.initCom;
    delete item.instance;
    delete item.idx;
    delete item.CssPage;
  } else if (item.type === 'DynamicPanel' || item.type === 'CollapsePanel') {
    // v8.17 新增折叠面板
    item.children.forEach((child) => {
      child.AntdChildComponents.forEach((AntdChild) => {
        removeCompInstance(AntdChild);
      });
    });
  }
  return item;
}

// 取消成组
export function splitGroupByItem(groupItem = {}) {
  if (groupItem.classType !== 'group') {
    return;
  }
  const { idx } = groupItem;
  const groupChildren = groupItem.childComList || [];
  // 取消组时，子组件的level改为被取消组的level，即level-1
  groupChildren.forEach((v) => {
    v.level = groupItem.level;
  });

  deepBackUnGroupCom(groupChildren, groupItem.styles.transform);

  const parent = getGroupByChildKey(groupItem.key);
  removeGroup(groupItem);
  if (parent) {
    parent.childComList.splice(groupItem.idx, 0, ...groupChildren);
  } else {
    window.componentList.splice(groupItem.idx, 0, ...groupChildren);
  }
  return groupChildren.map((v) => v.key);
}

function checkForbidden(sourceKeys, target) {
  // 判断该次拖拽是否会超出二级组,超出则该次拖拽无效
  let isForbidden = false;

  // 源类型: groupIngroup group  Com
  // 多个以最高级别为准
  let sourceType = 'com';
  const sourceList = getComponent(sourceKeys);
  function checkSourceList(list) {
    list.forEach((com) => {
      if (com.classType === 'group') {
        // groupInGroup不能被覆盖
        if (sourceType !== 'groupInGroup') {
          sourceType = 'group';
        }
        com.childComList.forEach((ch) => {
          if (ch.classType === 'group') {
            sourceType = 'groupInGroup';
          }
        });
      }
    });
  }
  checkSourceList(sourceList);

  // 目标的类型：group groupInGroup com
  let targetType = 'com';
  const targetParent = getGroupByChildKey(target.key);
  // 有父组件
  if (targetParent) {
    targetType = 'group';
    const targetParentTop = getGroupByChildKey(targetParent.key);
    if (targetParentTop) {
      targetType = 'groupInGroup';
    }
  } else {
    // 无父组件
    console.log('无父组件');
    if (target.classType === 'group') {
      targetType = 'group';

      if (target.childComList) {
        target.childComList.forEach((tch) => {
          if (tch.classType === 'group') {
            targetType = 'groupInGroup';
          }
        });
      }
    }
  }

  if (target.classType === 'group' && targetParent) {
    targetType = 'groupInGroup';
  }
  if (
    (sourceType === 'group' && targetType === 'groupInGroup') ||
    (sourceType === 'groupInGroup' && (targetType === 'group' || targetType === 'groupInGroup'))
  ) {
    isForbidden = true;
  }

  return isForbidden;
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
  if (source.classType === 'group') {
    findInList(s.childComList);
  }
  return isForbidden;
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
    if (item.classType !== 'antd') {
      item.preAttr = {
        _attr: JSON.parse(JSON.stringify(item.instance.compAttr)),
        _config: JSON.parse(JSON.stringify(item.instance.config)),
        _data: JSON.parse(JSON.stringify(item.instance._data)),
        _shap: JSON.parse(JSON.stringify(item.instance.shapeCss)),
      };
    }
    try {
      item?.instance?.destroy && item.instance.destroy();
    } catch (error) {
      console.error(error);
    }
    if (item.classType !== 'group') item.instance = undefined;
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
}

// todo: 快捷键回退时需要重新处理，此处逻辑较乱
// 处理左侧树形列表的拖拽事件
// source可以是单个节点，或者多个节点key的集合
export function handleDragDrop(source, target, store) {
  console.log('---------', source, target);
  let keys = [];
  keys = Array.isArray(source) ? source : [source.key];
  // console.log(source, target);
  // 判断该次拖拽是否会超出二级组,超出则该次拖拽无效
  // let isForbidden = checkForbidden(keys, target);
  // if (isForbidden) {
  //   message.error('目前仅支持二级组嵌套');
  //   return false;
  // }

  const isForbidden = dragForbidden(source, target);
  if (isForbidden) {
    message.error('父组无法向子孙组中拖动!');
    return false;
  }

  const mapItems = [
    'MapFoundationPlan', // 2d地图
    'Map3DFoundationPlan', // 3d地图
    'MapGlFoundationPlan', // gl地图
  ];
  // 目标是组，加入该组，放到最后(直接拖到组上，即没有展开组)
  if (target.classType === 'group') {
    if (source.classType === 'com' && mapItems.includes(source.englishName)) {
      message.warning('地图组件不允许成组!');
      return;
    }
    let removedList = []; // removeComponent(keys, true);
    // 从二级组内拖到外层组
    if (source.parentKey) {
      const parent = getComponent(source.parentKey);
      if (parent && parent.childComList.length > 0) {
        const index = parent.childComList.findIndex((com) => com.key === source.key);
        removedList = parent.childComList.splice(index, 1);
        restoreComponentPos(parent, removedList[0]);
      }
    } else {
      removedList = removeComponent(keys); // removeComponent(keys, true);
    }

    const targetParent = getComponent(target.key);
    if (targetParent) {
      // 将组内组件相对组的位置变成相对编辑区位置
      restoreChildrenPos(targetParent);
      // 将拖动的组件添加到组内
      targetParent.childComList = [...targetParent.childComList, ...removedList];
      removedList.forEach((item) => {
        item.groupKey = targetParent.key;
        item.level = targetParent.level + 1;
        // destroyInstance(item);
        deepDestoryInstance(item);
      });
      // 递归更新拖拽后子组的层级
      changeComponentLevel(removedList, targetParent.level + 1);
    }
    computeGroupPos(targetParent);
    // 拖入到二级组中
    if (target.parentKey) {
      // 获取二级组的父组
      const parentGroup = getComponent(target.parentKey);
      // 父组中所有组件位置还原
      restoreChildrenPos(parentGroup);
      computeGroupPos(parentGroup);
    }
    return;
  }

  // 将组展开后拖入组件
  if (target.parentKey) {
    // console.log('2222');
    let removedList = []; // removeComponent(keys, true);
    if (source.parentKey) {
      const group = getComponent(source.parentKey);
      if (group && group.childComList.length > 0) {
        const index = group.childComList.findIndex((com) => com.key === source.key);
        removedList = group.childComList.splice(index, 1);
        restoreComponentPos(group, removedList[0]);
      }
    } else {
      removedList = removeComponent(keys); // removeComponent(keys, true);
    }
    const parent = getComponent(target.parentKey);
    if (parent && parent.childComList) {
      restoreChildrenPos(parent);
      parent.childComList.forEach((ch, i) => {
        if (ch.key === target.key) {
          parent.childComList.splice(i + 1, 0, ...removedList);
          // 子组件保存父组件的key值
          removedList.forEach((com) => {
            com.groupKey = parent.key;
            com.level = parent.level + 1;
            deepDestoryInstance(com);
          });
          // 递归更新拖拽后子组的层级
          changeComponentLevel(removedList, parent.level + 1);
        }
      });
      // 计算组的位置宽高
      computeGroupPos(parent);
    } else if (
      parent &&
      parent.children &&
      parent.children.length > 0 &&
      (parent.type === 'DynamicPanel' || parent.type === 'CollapsePanel')
    ) {
      // v8.17 新增折叠面板
      // v8.17 折叠面板和动态面板区分
      const { activeKey } = parent.props;
      let activeIndex = activeKey;
      if (parent.type === 'CollapsePanel') {
        activeIndex = parent.children.findIndex((child) => child.key === activeKey);
      }
      parent.children[activeIndex].AntdChildComponents.forEach((AntdChildComp, i) => {
        if (AntdChildComp.key === target.key) {
          parent.children[activeIndex].AntdChildComponents.splice(i + 1, 0, ...removedList);
        }
      });
    }
  } else {
    // console.log('3333', target, source);
    let removedList = [];
    if (!target.parentKey && source.parentKey) {
      // console.log('拖到最外层');
      const parent = getComponent(source.parentKey);
      if (parent && parent.childComList.length > 0) {
        const index = parent.childComList.findIndex((com) => com.key === source.key);
        // 从组中删除被拖出的组件
        removedList = parent.childComList.splice(index, 1);
        // 重新计算组的位置宽高
        restoreComponentPos(parent, removedList[0]);
      }
    }
    const { componentList } = window;
    componentList.forEach((cm, j) => {
      // 将从组中拖出的组件插入到组件列表指定位置
      if (cm.key === target.key) {
        componentList.splice(j + 1, 0, ...removedList);
        // 删除组件的父组key
        removedList.forEach((com) => {
          com.level = 1;
          if (com.groupKey) {
            delete com.groupKey;
          }
          // destroyInstance(com);
          deepDestoryInstance(com);
        });
      }
    });
  }
}

/**
 * 计算组的宽高位置
 * @param {组对象} group
 */
export function computeGroupPos(group) {
  // 计算组的位置和大小(找出最小left,top)
  const position = groupPosition(group.childComList);
  // 重新计算子组件相对组组件的位置
  changeChildrenPos(group.childComList, position.left, position.top);
  delete position.left;
  delete position.top;
  group.initSize = position.initSize;
  delete position.initSize;
  group.cssStyle = position;
  group.styles = { ...group.styles, ...position };
  group.shapeCss = position;
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
  const comTransform = mapGetMatrix(com.styles.transform);
  comTransform[0] = comTransform[0] + px + tpx;
  comTransform[1] = comTransform[1] + py + tpy;
  com.styles.transform = `translate(${comTransform[0]}px, ${comTransform[1]}px)`;

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

    if (vl.classType === 'group') {
      // return changeChildrenPos(vl.childComList, left, top);
    }
  });
}

// 删除instance数据用做保存为json格式
// 删除instance数据用做保存为json格式
// 添加activeLayerId参数，回退选中图层的zIndex
export function destroyForJson(componentList, activeLayerId = null, from) {
  // console.log('activeLayerId', activeLayerId);
  function deepCopy(list) {
    return list?.map((item) => {
      const newItem = { ...item };
      if (newItem.instance) {
        newItem._attr = item.instance.compAttr;
        newItem._data = item.instance._data;
        newItem._shape = item.instance.shapeCss;
        newItem._config = item.instance.config;
        newItem._visible = item.instance.visible;

        delete newItem.instance;
        delete newItem.idx;
        delete newItem.initCom;
        delete newItem.CssPage;
      }
      if (newItem.CssPage || newItem.initCom) {
        delete newItem.initCom;
        delete newItem.CssPage;
      }
      // 添加activeLayerId参数，回退选中图层的zIndex
      // console.log('item', item);
      // console.log('item.layerId', item.layerId);
      // console.log('item.zIndex1', item.zIndex);
      if (!!activeLayerId && activeLayerId === newItem.layerId && newItem.zIndex > 10000) {
        newItem.zIndex -= 1000;
      }
      // console.log('item.zIndex2', item.zIndex);

      if (newItem.layers) {
        newItem.layers = newItem.layers.map((child) => {
          const newChild = { ...child };
          if (newChild.instance) {
            newChild._attr = newChild.instance.compAttr;
            newChild._data = newChild.instance._data;
            newChild._shape = newChild.instance.shapeCss;
            newChild._config = newChild.instance.config;
            newChild._visible = newChild.instance.visible;
          }
          delete newChild.instance;
          delete newChild.idx;
          delete newChild.initCom;
          delete newChild.CssPage;
          // 添加activeLayerId参数，回退选中图层的zIndex
          // console.log('child', child);
          // console.log('child.layerId', child.layerId);
          // console.log('child.zIndex1', child.zIndex);
          if (!!activeLayerId && activeLayerId == newChild.layerId && newChild.zIndex > 10000) {
            newChild.zIndex -= 1000;
          }
          // console.log('child.zIndex2', child.zIndex);
          return newChild;
        });
      }

      if (newItem.children) {
        newItem.children = newItem.children.map((child) => {
          const currentChild = { ...child };
          const currentAntdChildComponents = currentChild.AntdChildComponents.map((AntdChild) => {
            const newAntdChild = { ...AntdChild };
            if (newAntdChild.instance) {
              newAntdChild._attr = newAntdChild.instance.compAttr;
              newAntdChild._data = newAntdChild.instance._data;
              newAntdChild._shape = newAntdChild.instance.shapeCss;
              newAntdChild._config = newAntdChild.instance.config;
              delete newAntdChild.instance;
              delete newAntdChild.initCom;
              delete newAntdChild.CssPage;
            }
            // 添加activeLayerId参数，回退选中图层的zIndex
            // console.log('AntdChild', AntdChild);
            // console.log('AntdChild.layerId', AntdChild.layerId);
            // console.log('AntdChild.zIndex1', AntdChild.zIndex);
            if (!!activeLayerId && activeLayerId == newAntdChild.layerId && newAntdChild.zIndex > 10000) {
              newAntdChild.zIndex -= 1000;
            }
            // console.log('AntdChild.zIndex2', AntdChild.zIndex);
            if (newAntdChild?.childComList) {
              newAntdChild.childComList = deepCopy(newAntdChild.childComList);
            }
            return newAntdChild;
          });
          currentChild.AntdChildComponents = currentAntdChildComponents;
          return currentChild;
        });
      }

      if (newItem.classType === 'group' || newItem?.childComList) {
        newItem.childComList = deepCopy(newItem.childComList || []);
      }
      return newItem;
    });
  }
  if (from === 'save') {
    // 只有保存到后台服务器时，当前的componentList还需要用到，所以深拷贝做修改
    // componentList = _.cloneDeep(componentList); // 复杂屏递归拷贝很影响性能，暂时加上修复保存后地图子组件无法添加问题
    // v8.10.0 保存时，当前componentList实例不能删，只要数据可以用map
    // console.log('save destroyForJson start', Date.now());
    const newComponentList = deepCopy(componentList || []);
    // console.log('save destroyForJson end', Date.now());
    return newComponentList;
  }

  // v8.10 非保存，需要删除当前的componentList实例
  function destroyDeep(list) {
    list?.forEach((item, key) => {
      if (item.instance) {
        item.preAttr = {
          _attr: JSON.parse(JSON.stringify(item.instance.compAttr)),
          _config: JSON.parse(JSON.stringify(item.instance.config)),
          _data: JSON.parse(JSON.stringify(item.instance._data)),
          _shap: JSON.parse(JSON.stringify(item.instance.shapeCss)),
          _visible: item.instance.visible,
        };
        item._attr = item.instance.compAttr;
        item._data = item.instance._data;
        item._shape = item.instance.shapeCss;
        item._config = item.instance.config;
        item._visible = item.instance.visible;

        delete item.instance;
        delete item.idx;
        delete item.initCom;
        delete item.CssPage;
      }
      if (item.CssPage || item.initCom) {
        delete item.initCom;
        delete item.CssPage;
      }
      // 添加activeLayerId参数，回退选中图层的zIndex
      // console.log('item', item);
      // console.log('item.layerId', item.layerId);
      // console.log('item.zIndex1', item.zIndex);
      if (!!activeLayerId && activeLayerId === item.layerId && item.zIndex > 10000) {
        item.zIndex -= 1000;
      }
      // console.log('item.zIndex2', item.zIndex);

      if (item.layers) {
        item.layers.forEach((child, index) => {
          if (child.instance) {
            child.preAttr = {
              _attr: JSON.parse(JSON.stringify(child.instance.compAttr)),
              _config: JSON.parse(JSON.stringify(child.instance.config)),
              _data: JSON.parse(JSON.stringify(child.instance._data)),
              _shap: JSON.parse(JSON.stringify(child.instance.shapeCss)),
              _visible: child.instance.visible,
            };
            child._attr = child.instance.compAttr;
            child._data = child.instance._data;
            child._shape = child.instance.shapeCss;
            child._config = child.instance.config;
            child._visible = child.instance.visible;
          }
          delete child.instance;
          delete child.initCom;
          delete child.CssPage;
          // 添加activeLayerId参数，回退选中图层的zIndex
          // console.log('child', child);
          // console.log('child.layerId', child.layerId);
          // console.log('child.zIndex1', child.zIndex);
          if (!!activeLayerId && activeLayerId == child.layerId && child.zIndex > 10000) {
            child.zIndex -= 1000;
          }
          // console.log('child.zIndex2', child.zIndex);
        });
      }

      if (item.children) {
        item.children = item.children.map((child) => {
          const currentChild = child;
          const currentAntdChildComponents = currentChild.AntdChildComponents.map((AntdChild) => {
            if (AntdChild.instance) {
              AntdChild.preAttr = {
                _attr: JSON.parse(JSON.stringify(AntdChild.instance.compAttr)),
                _config: JSON.parse(JSON.stringify(AntdChild.instance.config)),
                _data: JSON.parse(JSON.stringify(AntdChild.instance._data)),
                _shap: JSON.parse(JSON.stringify(AntdChild.instance.shapeCss)),
              };
              AntdChild._attr = AntdChild.instance.compAttr;
              AntdChild._data = AntdChild.instance._data;
              AntdChild._shape = AntdChild.instance.shapeCss;
              AntdChild._config = AntdChild.instance.config;
              delete AntdChild.instance;
              delete AntdChild.initCom;
              delete AntdChild.CssPage;
            }
            // 添加activeLayerId参数，回退选中图层的zIndex
            // console.log('AntdChild', AntdChild);
            // console.log('AntdChild.layerId', AntdChild.layerId);
            // console.log('AntdChild.zIndex1', AntdChild.zIndex);
            if (!!activeLayerId && activeLayerId == AntdChild.layerId && AntdChild.zIndex > 10000) {
              AntdChild.zIndex -= 1000;
            }
            // console.log('AntdChild.zIndex2', AntdChild.zIndex);
            if (AntdChild?.childComList) {
              destroyDeep(AntdChild.childComList);
            }
            return AntdChild;
          });
          currentChild.AntdChildComponents = currentAntdChildComponents;
          return currentChild;
        });
      }

      if (item.classType === 'group' || item?.childComList) {
        destroyDeep(item.childComList);
      }
    });
  }

  destroyDeep(componentList);

  return componentList;
}

export const handleData = (componentList, activeLayerId = null, from) => {
  componentList = destroyForJson(componentList, activeLayerId, from);
  return componentList;
};

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

// antd属性面板滚动监听
export function listerAttrWraperScroll() {
  const providerEle = document.querySelector('.ConfigProvider');
  if (providerEle) {
    const selectInputEle = $(providerEle).find('.ant-select-selection-search > input[aria-expanded="true"]');
    $.each(selectInputEle, function (i) {
      // $(selectEle[i]).removeClass('ant-select-open');
      $(selectInputEle[i]).trigger('blur');
    });
  }
}
// datai属性面板滚动监听(二级属性面板)
export function listerDataiAttrScoll() {
  const compSelectListEle = document.querySelectorAll('.yl-comp-config .icon.icon-arrow.open');
  $.each(compSelectListEle, function (i) {
    const parentEle = $(compSelectListEle[i]).parent();
    if (parentEle && parentEle[0]?.dataset.name === 'compSelect') {
      $(parentEle[0]).trigger('click');
    }
  });
}
// 查找某一类组件
export function findCompOfSameType(condition, list) {
  let filter = 'type';
  let match = condition;
  if (typeof condition === 'object') {
    filter = condition.filter;
    match = condition.match;
  }
  let sameCompArr = [];
  if (!Array.isArray(list)) {
    return sameCompArr;
  }
  for (let i = 0, len = list.length; i < len; i++) {
    if (list[i][filter] === match) {
      sameCompArr.push(list[i]);
    }
    const childTmp = findCompOfSameType(condition, list[i].childComList);
    Array.isArray(childTmp) && (sameCompArr = sameCompArr.concat(childTmp));
  }
  return sameCompArr;
}

// 查找GIS图层
export function findGISLayers(componentList, currentVersion) {
  const refInfoList = [];
  const loop = (componentList) => {
    componentList.forEach((item) => {
      if (
        item.englishName === 'MapFoundationPlan' ||
        item.englishName === 'Map3DFoundationPlan' ||
        item.englishName === 'MapGlFoundationPlan'
      ) {
        const { layers = [] } = item; // 没加子图层时 layers属性不存在
        layers.forEach((layer) => {
          if (mapBaseLayerTypeRelation.includes(layer.type)) {
            const { _attr } = layer;
            const { group_id, relation_layer_code } = _attr;
            if (!!group_id && !!relation_layer_code) {
              const refScreenId = `${group_id}-with-${relation_layer_code}`;
              const idArr = refInfoList.map((refInfo) => refInfo.refScreenId); // 大屏页面存在多次引用需过滤
              if (!idArr.includes(refScreenId)) {
                const obj = {
                  refScreenType: _attr.source === 'cim' ? 6 : 5,
                  refScreenId,
                };
                if (currentVersion) obj.version = currentVersion;
                refInfoList.push(obj);
              }
            }
          }
        });
      }
    });
  };
  loop(componentList);
  return refInfoList;
}

// v8.10 新版是页面维度滤镜
export const getFilterStyle = (filter) => {
  filter = JSON.parse(JSON.stringify(filter));

  let filterStyle = '';
  if (filter.switchVal) {
    Object.keys(filter).forEach((item) => {
      if (!filter[item] || item === 'switchVal') return;

      switch (item) {
        case 'hueRotate': {
          filterStyle += `hue-rotate(${filter[item]}deg)`;
          break;
        }
        case 'saturation': {
          filterStyle += `saturate(${filter[item]}%)`;
          break;
        }
        case 'brightness': {
          filterStyle += `brightness(${filter[item]}%)`;
          break;
        }
        case 'contrastRatio': {
          filterStyle += `contrast(${filter[item]}%)`;
          break;
        }
        default: {
          filterStyle += `opacity(${filter[item]}%)`;
          break;
        }
      }
    });
  } else {
    filterStyle = '';
  }

  return filterStyle;
};

// export const getFilterStyle = (filter) => {
//   /*
//     滤镜格式
//     filter:{
//       3467874345678:{
//         switchVal:'',
//         hueRotate:'',
//         saturation:''
//       }
//     }
//   */
//   filter = JSON.parse(JSON.stringify(filter));
//   const filterObj = {};
//   for (const key in filter) {
//     let filterStyle = '';
//     if (filter.hasOwnProperty(key)) {
//       const layer = filter[key];
//       // console.log(layer, key, '-------------');
//       if (layer.switchVal) {
//         Object.keys(layer).forEach((item) => {
//           if (!layer[item] || item == 'switchVal') return false;
//           switch (item) {
//             case 'hueRotate':
//               filterStyle += `hue-rotate(${layer[item]}deg)`;
//               break;
//             case 'saturation':
//               filterStyle += `saturate(${layer[item]}%)`;
//               break;
//             case 'brightness':
//               filterStyle += `brightness(${layer[item]}%)`;
//               break;
//             case 'contrastRatio':
//               filterStyle += `contrast(${layer[item]}%)`;
//               break;
//             default:
//               filterStyle += `opacity(${layer[item]}%)`;
//               break;
//           }
//         });
//       } else {
//         filterStyle = '';
//       }

//       filterObj[key] = filterStyle;
//     }
//   }
//   // console.log(filterObj);
//   return filterObj;
// };

export const listenSubLayerVariable = (vl) => {
  const EventEmitter = window.globalEventEmitter;
  // 热力图更新数据 v8.10新增GL热力图、白模、地理围栏
  if (
    vl.type.includes('@yl/datai-com-map-hotmap') ||
    vl.type.includes('@yl/datai-com-map-gl-heat-map-new') ||
    vl.type.includes('@yl/datai-com-map-gl-geo-fencing-new') ||
    vl.type.includes('@yl/datai-com-map-gl-buiding-layer-new') ||
    vl.type.includes('@yl/datai-com-map-3D-heatMap-layer') ||
    vl.type.includes('@yl/datai-com-map-3D-geo-fencing') ||
    vl.type.includes('@yl/datai-com-map-2d-point-polymerization') ||
    vl.type.includes('@yl/datai-com-map-3d-point-polymerization')
  ) {
    const { config } = vl.instance;
    const hotVariable = config?._variable;

    if (hotVariable) {
      const listenFn = (data) => {
        if (config._source == 'variableRef' && config._variable != '') {
          const data = getDataByKey(hotVariable);
          if (Array.isArray(data)) {
            config._data = data;
            vl.instance.mergeConfig(config);
          }
        }
      };
      EventEmitter.on(hotVariable, listenFn);
    }
  } else if (
    vl.type.includes('@yl/datai-com-map-interpolation') ||
    vl.type.includes('@yl/datai-com-map-3D-interpolation') ||
    vl.type.includes('@yl/datai-com-map-contour') ||
    vl.type.includes('@yl/datai-com-map-3D-contour')
  ) {
    // 插值面和等值线面监听数据源引用变量
    const { compAttr, config } = vl.instance;
    const { dataType, dataVariable, boundingVariable, dataModel, colorVariable } = compAttr;
    if (dataType == 'variableRef' && dataVariable != '') {
      const listenDataFn = (data) => {
        vl.instance.render();
      };
      EventEmitter.on(dataVariable, listenDataFn);
    }
    if (config._source == 'variableRef' && boundingVariable != '') {
      const listenBoundingFn = (data) => {
        vl.instance.render();
      };
      EventEmitter.on(boundingVariable, listenBoundingFn);
    }
    if (dataModel == 'refer' && colorVariable != '') {
      const listenColorDataFn = (data) => {
        vl.instance.render();
      };
      EventEmitter.on(colorVariable, listenColorDataFn);
    }
  }
  // api图层参数变量监听
  if (mapBaseLayer2dType.includes(vl.type)) {
    const { compAttr, config } = vl.instance;
    const { apiParamVar = {} } = compAttr;
    let listenFn;
    let variableKey;
    if (apiParamVar.type == 'variableRef' && apiParamVar.layerType?.includes('API')) {
      variableKey = apiParamVar?.dataVariable ? apiParamVar?.dataVariable : vl?._attr?.apiParamVar?.dataVariable;
    }
    //! !variableKey && (variableKey += '_mapapi');
    listenFn = () => {
      // 主要处理图层默认隐藏，使用图层显隐交互，图层中syncVisible没有改变导致图层没有显示问题
      const { compAttr } = vl.instance;
      // console.log(compAttr, '+++++++++++++++++++++++');
      compAttr.visible ? vl.instance.show() : vl.instance.hide();
      // vl.instance.mergeAttr({});
    };
    listenFn && variableKey && EventEmitter.on(variableKey, listenFn);
  }

  // v8.4GL板块图过滤参数变量监听
  if (vl.type == '@yl/datai-com-map-gl-plate-layer') {
    const { compAttr, config } = vl.instance;
    const { pidParamVar = {} } = compAttr;
    let listenFn;
    let variableKey;
    if (pidParamVar.type == 'variableRef') {
      variableKey = pidParamVar?.dataVariable ? pidParamVar?.dataVariable : vl?._attr?.pidParamVar?.dataVariable;
    }
    //! !variableKey && (variableKey += '_mapapi');
    listenFn = () => {
      vl.instance.mergeAttr({});
    };
    listenFn && variableKey && EventEmitter.on(variableKey, listenFn);
  }
};

function computetEleCoordinate(ele, groups) {
  const moveEleStyle = computedCompRect(ele);
  const moveEleTransform = formatPositionByTransform(moveEleStyle.transform);
  // v7.5计算组件相对于编辑画布的偏移,防止自定义列表拖拽的相关组件偏移量相对于组；
  let tpx = moveEleTransform[0];
  let tpy = moveEleTransform[1];
  let parentKey = ele.groupKey;
  while (parentKey) {
    const parent = groups.filter((g) => {
      return g.key === parentKey;
    });
    if (parent && parent.length > 0) {
      parentKey = parent[0].groupKey;
      const transform = mapGetMatrix(parent[0].styles.transform);
      tpx += transform[0];
      tpy += transform[1];
    } else {
      parentKey = undefined;
    }
  }
  const moveEleHeight = Number(moveEleStyle.height.replace('px', ''));
  const moveEleWidth = Number(moveEleStyle.width.replace('px', ''));
  const curDragPosition = [
    [tpx, tpy],
    [tpx + moveEleWidth, tpy],
    [tpx + moveEleWidth, tpy + moveEleHeight],
    [tpx, tpy + moveEleHeight],
  ];
  return curDragPosition;
}
function computedElesIsAssociate(ele1, ele2) {
  let ret = false;
  if (!Array.isArray(ele1) || !Array.isArray(ele2)) {
    return ret;
  }
  for (let i = 0; i < 4; i++) {
    if (
      ele2[i][0] > ele1[0][0] &&
      ele2[i][1] > ele1[0][1] &&
      ele2[i][0] < ele1[1][0] &&
      ele2[i][1] > ele1[1][1] &&
      ele2[i][0] < ele1[2][0] &&
      ele2[i][1] < ele1[2][1] &&
      ele2[i][0] > ele1[3][0] &&
      ele2[i][1] < ele1[3][1]
    ) {
      ret = true;
      break;
    }
  }
  return ret;
}
function computedCompRect(item) {
  if (!item.styles) {
    return {
      position: 'absolute',
      width: '0px',
      height: '0px',
      transform: 'translate(0px, 0px)',
    };
  }

  return {
    position: 'absolute',
    width: item.styles.width,
    height: item.styles.height,
    transform: item.styles.transform,
  };
}

function computetEleTransform(ele) {
  const moveEleStyle = computedCompRect(ele);
  const moveEleTransform = formatPositionByTransform(moveEleStyle.transform);
  return moveEleTransform;
}

const replaceCompLevel = (list, level) => {
  list.forEach((child) => {
    child.level = level;
    if (child.classType === 'group' || child?.isDragContainer) {
      replaceCompLevel(child.childComList, child.level + 1);
    }
  });
};

// 组件移入自定义列表内
export const handleDomIsInContainer = (comp, opts = {}) => {
  const { layerStore, comStore } = opts;
  const { bigScreenType } = comStore.rootStore.GlobalStore;
  const comOfEngObj = { CustomList: '自定义列表', MapInfoWin: '地图标牌', CustomCell: '自定义单元格' };
  const enabledDragComType = ['Text', 'Images', 'MediaImageDynamic', 'MediaImageBasic', 'Statistic', 'ProgressBar'];
  let supportFlag = false;
  // console.log('handleDomIsInContainer******');
  // 编辑模式下不操作
  if (comStore.editModePaths.length === 1) {
    return;
  }
  // 自定义列表支持的组件

  if (enabledDragComType.includes(comp?.type) || enabledDragComType.includes(comp?.englishName)) {
    supportFlag = true;
  }

  // if (
  //   comp?.type === 'Text' ||
  //   comp?.type === 'Images' ||
  //   comp?.englishName === 'MediaImageDynamic' ||
  //   comp?.englishName === 'MediaImageBasic'
  // ) {
  //   supportFlag = true;
  // }
  /* if (!supportFlag) {
    return;
  } */
  const componentList = layerStore.currentLayerComList;
  // if (comStore.bigScreenType == 'card') {
  //   componentList = window.componentList;
  // }
  const groups = findCompOfSameType('@yl/dataq-com-group-basic', componentList);
  const curDragCoord = computetEleCoordinate(comp, groups);
  const customListArr = findCompOfSameType({ filter: 'isDragContainer', match: true }, componentList);
  customListArr.forEach((ele) => {
    const customListCoord = computetEleCoordinate(ele, groups);
    const isAssociate = computedElesIsAssociate(customListCoord, curDragCoord);
    if (isAssociate) {
      if (ele.type === 'MapInfoWin') {
        supportFlag = true;
      }
      if (
        ele.type === 'CustomList' &&
        ele.props.supportDynamicApi &&
        (comp?.type === 'Statistic' || comp?.englishName === 'ProgressBar')
      ) {
        // v8.5 新的自定义列表组件（有supportDynamicApi字段），支持拖入指标文本和进度条
        supportFlag = true;
      }
      const tipMsg = `确定拖动到${comOfEngObj[ele.type]}组件吗？`;
      // console.log('handleDomIsContainer**isAssociate**', isAssociate);
      if (supportFlag) {
        confirm({
          getContainer: () => document.querySelector('#app'), // 弹框挂载到编辑模式
          title: '提示',
          content: tipMsg,
          className: 'del-notice-modal',
          okText: '确定',
          cancelText: '取消',
          onOk() {
            let tmpCompList = componentList;
            console.log('handleDomIsInContainer bigScreenType', bigScreenType);
            if (bigScreenType === 'card' && Array.isArray(componentList) && componentList.length > 0) {
              tmpCompList = componentList[0].childComList;
            }
            // v7.5 需要修改，要考虑被拖拽组件和自定义列表在组内
            if (comp.groupKey) {
              const tmpParent = groups.filter((g) => {
                return g.key === comp.groupKey;
              });
              if (tmpParent && tmpParent.length > 0) {
                tmpCompList = tmpParent[0].childComList || [];
              }
            }
            const dragIndex = tmpCompList.findIndex((v) => v.key === comp.key);
            if (dragIndex > -1) {
              const dragComp = tmpCompList.splice(dragIndex, 1);
              // let targetIndex = tmpCompList.findIndex((v) => v.key == ele.key);
              // let targetComp = tmpCompList[targetIndex];
              const targetComp = ele;
              !Array.isArray(targetComp.childComList) && (targetComp.childComList = []);
              // dragComp[0].styles.backdropFilter = 0;
              let transformX = curDragCoord[0][0] - customListCoord[0][0];
              transformX = transformX > 0 ? transformX : 0;
              let transformY = curDragCoord[0][1] - customListCoord[0][1];
              transformY = transformY > 0 ? transformY : 0;
              dragComp[0].styles.transform = `translate(${transformX}px, ${transformY}px)`;
              dragComp[0].isCustomListChild = true;
              dragComp[0].groupType = targetComp.type;
              dragComp[0].groupKey = targetComp.key;
              dragComp[0]._accurate_update = true;
              // dragComp[0]?.instance && destroyInstance(dragComp[0]);
              if (dragComp[0].instance) {
                dragComp[0]._attr = dragComp[0].instance.compAttr;
                dragComp[0]._data = dragComp[0].instance._data;
                dragComp[0]._shape = dragComp[0].instance.shapeCss;
                dragComp[0]._config = dragComp[0].instance.config;
                dragComp[0]._visible = dragComp[0].instance.visible;
                dragComp[0].instance = undefined;
              }
              if (ele.type === 'CustomCell' || (ele.type === 'CustomList' && ele.props.supportDynamicApi)) {
                const customListData = targetComp.dataset._data;
                if (dragComp[0].classType === 'com') {
                  dragComp[0]._config.dynamic.dataFromParent = [customListData[0]];
                } else {
                  dragComp[0].dataset.dynamic.dataFromParent = [customListData[0]];
                }
              }
              targetComp.childComList.unshift(dragComp[0]); // REVIEW liuming 最后拖入的放到最上面
              replaceCompLevel([targetComp], targetComp.level);
              console.log('targetComp', targetComp);
              layerStore.updateCurrentLayerComList(componentList);
              comStore.forceUpdate();
            }
            // callBackFn();
          },
          onCancel() {},
        });
      }
    }
  });
};

// 自定义列表内组件移出
export const handleDomIsOutContainer = (comp, opts = {}) => {
  const { layerStore, comStore } = opts;
  const { bigScreenType } = comStore.rootStore.GlobalStore;
  if (!comp?.isCustomListChild) {
    return;
  }
  const componentList = layerStore.currentLayerComList;
  // if (comStore.bigScreenType == 'card') {
  //   componentList = window.componentList;
  // }
  const curDragTransform = computetEleTransform(comp);
  // const { groupKey } = comp;
  const customListArr = findCompOfSameType({ filter: 'isDragContainer', match: true }, componentList);
  const customEle = customListArr.find((v) => v.key === comp.groupKey);
  const customEleWidth = Number(customEle.styles.width.replace('px', ''));
  const customEleHeight = Number(customEle.styles.height.replace('px', ''));

  if (
    curDragTransform[0] < 0 ||
    curDragTransform[1] < 0 ||
    curDragTransform[0] > customEleWidth ||
    curDragTransform[1] > customEleHeight
  ) {
    let tmpCompList = componentList;
    // console.log('handleDomIsOutContainer bigScreenType', bigScreenType);
    if (bigScreenType === 'card' && Array.isArray(componentList) && componentList.length > 0) {
      tmpCompList = componentList[0].childComList;
    }
    const customListEle = tmpCompList?.find((v) => v.key === comp.groupKey);
    const curDragIndex = customListEle.childComList.findIndex((item) => item.key === comp.key);
    const curDragComp = customListEle.childComList.splice(curDragIndex, 1);
    curDragComp[0].isCustomListChild = false;
    curDragComp[0].groupType = undefined;
    curDragComp[0].groupKey = undefined;
    curDragComp[0].comCreated = true;
    const customListTransform = computetEleTransform(customListEle);
    const transformX = curDragTransform[0] + customListTransform[0];
    const transformY = curDragTransform[1] + customListTransform[1];
    curDragComp[0].styles.transform = `translate(${transformX}px, ${transformY}px)`;
    curDragComp[0]?.instance && destroyInstance(curDragComp[0]);
    curDragComp[0].level = tmpCompList && tmpCompList.length > 0 ? tmpCompList[0].level : 1;
    curDragComp[0]._accurate_update = true;
    customListEle._accurate_update = true;
    tmpCompList.unshift(curDragComp[0]);
    layerStore.updateCurrentLayerComList(componentList);
    comStore.forceUpdate();
  }
};

const compatibleComKey = (key) => {
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

const instanceRender = (list) => {
  list.forEach((com) => {
    com.instance && com.instance.render && com.instance.render();
    if (com.classType === 'group') {
      instanceRender(com.childComList);
    } else if (com.type === 'DynamicPanel' || com.type === 'CollapsePanel') {
      // v8.17 新增折叠面板
      com.children.forEach((child) => {
        instanceRender(child.AntdChildComponents);
      });
    }
  });
};

const changeCompVisible = (el, visible) => {
  if (typeof visible === 'number') {
    visible += '';
  }
  switch (visible) {
    case '0': {
      el.show();
      // v7.7.1将动画隐藏的组件显示出来
      const visibility = $(el).css('visibility');
      if (visibility === 'hidden') {
        $(el).css({ visibility: 'visible' });
      }
      const opacity = $(el).css('opacity');
      if (opacity == 0) {
        $(el).css({ opacity: 1 });
      }
      break;
    }
    case '1': {
      el.hide();
      break;
    }
    case '2': {
      el.toggle();
      break;
    }
  }
};

// 图表组件初始隐藏，切换到显示状态时需要重新render一下
export const reRenderVisibleComp = (comp = {}, visible) => {
  let { compKey } = comp;
  if (!compKey) {
    compKey = comp.key;
  }
  // console.log('reRenderVisibleComp******', comp, visible);
  const selector = compatibleComKey(compKey);
  const el = $(selector);
  visible !== undefined && changeCompVisible(el, visible);
  if (comp && comp.classType === 'group') {
    instanceRender(comp.childComList);
  } else {
    // 未成组报表组件重新渲染
    (comp && comp.render && comp.render()) || (comp && comp.instance && comp.instance.render && comp.instance.render());

    // 处理显隐底图不显示问题
    if (comp && comp.type === '@yl/datai-com-map-foundationPlan' && comp.showFlag && Array.isArray(comp.layers)) {
      console.log('sssssssssss');
      const mapIndex = comp.layers.findIndex((item) => item.type === '@yl/datai-com-map-gaud-online');
      mapIndex > -1 && comp.layers[mapIndex]?.instance.render();
    }
  }
  // 组件的关联DOM,目前兼容iframe组件的遮罩，遮罩不在组件内部
  if (comp && comp.ref) {
    visible !== undefined && changeCompVisible(comp.ref, visible);
  }
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

// 判断是否存在鼠标事件(单击、双击)
export const hasMouseEvent = (comp = {}) => {
  if (!comp.eventSetings || comp.eventSetings.length === 0) return false;
  const events = new Set(['click', 'doubleClick', 'mouseleave', 'mouseenter']);
  return comp.eventSetings.some((evt) => events.has(evt.eventType));
};

/**
 * 历史配置的事件交互转换为事件动作组(低版本事件变为高版本事件动作组)
 * 注意: 该方法中的 delete 之所以注释是因为 需要考虑到高版本大屏导入到低版本大屏时，事件能够正常执行
 * @param {*} eventSettings
 * @returns eventSettings
 */
export const compatibleEventSettings = (eventSettings = []) => {
  return eventSettings
    .filter((evt) => isPlainObject(evt))
    .filter((evt) => Object.keys(evt)?.length > 0)
    .map((event) => {
      if (!Array.isArray(event.groups)) {
        event.groups = [
          {
            key: shortId.generate(),
            actions: event.actions ?? [],
            conditions: event.conditions ?? [],
          },
        ];
        event.activeIdx = 0;

        // 监听变量的变量列表放到动作组下面
        if (event.eventType === 'listenVariable') {
          event.groups[0].variables = event.variables;
          // delete event.variables;

          if (!event.variables && event.variableKey) {
            event.groups[0].variables = [
              {
                variableKey: event.variableKey,
                conditions: [],
                expression: 'data',
                conditionType: 1,
              },
            ];
          }
        }

        // 监听事件的监听信息放到动作组下面
        if (event.eventType === 'monitoringEvent') {
          event.groups[0].eventListenKey = event.eventListenKey;
          event.groups[0].eventListenWithDataInjectVariable = event.eventListenWithDataInjectVariable;
          event.groups[0].dataParams = event.dataParams;
          // delete event.eventListenKey;
          // delete event.eventListenWithDataInjectVariable;
          // delete event.dataParams;
        }

        // 单击系列、单击图例、选中值、单击表格行、单击操作项、分页的变量放到动作组下面
        if (
          ['clickSeries', 'clickLegend', 'changeValue', 'tableRowClick', 'tableColumnClick', 'tablePagination'].indexOf(
            event.eventType,
          ) &&
          event.variable
        ) {
          event.groups[0].variable = event.variable;
          // delete event.variable;
        }
        if (event.eventType === 'tableColumnClick' && event.actionKey) {
          // 单击操作项
          event.groups[0].actionKey = event.actionKey;
          // delete event.actionKey;
        }

        // 选中值表达式
        if (event.eventType === 'changeValue' && event.expression) {
          event.groups[0].expression = event.expression;
        }

        // delete event.actions;
        // delete event.conditions;
      }
      return event;
    });
};

// 事件动作组转换为事件交互(兼容高版本大屏导入到低版本，需要将高版本事件动作组变为低版本事件，只取第一个动作组)
export const restoreEventSettings = (eventSettings = []) => {
  try {
    const evts = eventSettings.filter(Boolean).map((event) =>
      event.groups?.slice(0, 1).map((ag) => ({
        ...event,
        ..._.omit(ag, ['key']),
      })),
    );
    return evts.flat();
  } catch (error) {
    console.error('restoreEventSettings', error);
    return eventSettings;
  }
};

/**
 * 查找当前组带有置顶属性的父组
 * @param {*} com
 * @returns 当前组所有带有置顶属性的父组
 */
export const findTopParent = (com) => {
  let parents = [];
  const findParent = (com) => {
    if (com.groupKey) {
      // 获取置顶组的父组
      const parent = DataI.getComponentByKey(com.groupKey);
      findParent(parent);
    }
    if (com.styles.isTop) {
      parents.push(com);
    }
  };
  findParent(com);
  parents = unique(parents, 'key').filter((p) => p.key !== com.key);
  return parents;
};

/**
 * 查找设置了置顶属性的组
 * @param {*} componentList
 */
export const findTopGroupList = (componentList) => {
  const topGroupList = [];
  DataI.each(componentList, (com) => {
    if (com.classType === 'group' && com.styles.isTop) {
      if (com.groupKey) {
        // 计算在页面中的绝对位置
        const transform = getCompOffset(com);
        com.styles.transform = `translate(${transform[0]}px, ${transform[1]}px)`;
      }

      if (topGroupList.findIndex((group) => group.key === com.key) === -1) {
        topGroupList.unshift(com);
      }
    }
  });

  return topGroupList;
};
