import shortid from 'short-uuid';
import { groupPosition, mapGetMatrix } from '@/utils/compute';
import { destroyInstance } from '@/utils/componentUtils';
import DataI from '@/utils/global-api';

const getComponent = DataI.getComponentByKey;
/**
 * @returns
 * true 表示选中组件都有groupKey且groupKey相同，说明是在组下成组，则新组加到选中组件的父组下
 * false 表示选中组件没有父组或者父组不相同，则新成的组加入到componentList下
 */
const isAllEqualGroupKey = (array) => {
  // 判断是否都存在groupKey
  if (array.every((value) => value.groupKey)) {
    // 判断groupKey是否都一样
    return !array.some((value) => value.groupKey !== array[0].groupKey);
  }
  return false;
};

function replaceCompLevel(list, level) {
  list.forEach((v) => {
    v.level = level;
    if (v.classType === 'group' || v?.isDragContainer) {
      replaceCompLevel(v.childComList, v.level + 1);
    }
  });
}

function destroyComDeep(list) {
  const arr = [];
  function deepLoop(oList) {
    oList.forEach((vl) => {
      destroyInstance(vl);
      arr.push(vl);
      if (vl.classType === 'group' || vl?.isDragContainer) {
        deepLoop(vl.childComList);
      }
    });
  }
  deepLoop(list);
  return arr;
}

// 仅改变一级子组件的位置
function changeChildrenPos(list, left, top) {
  list.forEach((vl) => {
    const transform = mapGetMatrix(vl.styles.transform);
    transform[0] -= left;
    transform[1] -= top;
    vl.styles.transform = `translate(${transform[0]}px, ${transform[1]}px)`;
  });
}

// 成组
export const bunchFn = (
  LayerStore,
  PageTabsStore,
  bigScreenType,
  keys,
  undoGroupKey,
  position,
  undoGroupParentKey,
  groupName = '组',
) => {
  const { config, index } = window.GroupBasic; // config（组件配置项） index(组件渲染方法)
  const newGroup = {
    version: '0.0.1',
    author: '邵逸之',
    displayState: true,
    classType: 'group',
    instance: undefined, // 实例组件后的对象
    initCom: index, // 初始化组件的方法 => 单独组件的index.js （构造函数）
    CssPage: config, // 组件的css样式界面 => 单独组件的config.js （样式操作界面）
    key: undoGroupKey || `group_${shortid.generate()}`, // undoGroupKey 只有手动取消成组后再执行回退操作才会传入undoGroupKey,用于保证回退时重新成的组和取消成组前的组是相同的组
    imgUrl: '',
    type: '@yl/dataq-com-group-basic',
    refComName: 'GroupBasic',
    englishName: 'GroupBasic',
    name: groupName,
    title: '组',
    cssStyle: {},
    styles: {},
    childComList: [],
    layerId: LayerStore.activeLayerId,
    appPageId: bigScreenType === 'page' ? PageTabsStore.selectedKey : undefined,
    comCreated: true, // 编辑态是否创建
  };
  let child = keys.map((key) => LayerStore.getComponentByCurrentLayerList(key));
  // console.log(child, 'child');

  const isEqual = isAllEqualGroupKey(child);
  // console.log('isEqual', isEqual);
  // 记录需要成组组件的父组key
  let parentGroup = null;
  if (isEqual && child.length > 0) {
    parentGroup = LayerStore.getComponentByCurrentLayerList(child[0].groupKey);
  }

  // 地图组件不允许成组
  const mapItems = new Set([
    // 'MapFoundationPlan', // 2d地图
    // 'Map3DFoundationPlan', // 3d地图
    // 'MapGlFoundationPlan' // gl地图
  ]);
  child = child.filter((item) => {
    if (mapItems.has(item.englishName)) {
      return false;
    }
    // if (bigScreenType !== 'card') {
    //   item.layerId = newGroup.layerId;
    // }
    item.layerId = newGroup.layerId;

    item.groupKey = newGroup.key;
    item.classType = item.classType || 'com';
    item.index = child.length;
    return true;
  });
  if (child.length === 0) {
    return;
  }
  // 删除组件下的instance实例
  destroyComDeep(child);
  if (position) {
    // 取消组后回退使用原来的位置信息
    const transform = mapGetMatrix(position.transform);
    position.left = transform[0];
    position.top = transform[1];
    position.initSize = {
      width: Number.parseInt(position.width),
      height: Number.parseInt(position.height),
    };
  } else {
    position = groupPosition(child); // 获取组组件的定位和宽高
  }
  changeChildrenPos(child, position.left, position.top); // 重新计算子组件相对组组件的位置
  delete position.left;
  delete position.top;
  newGroup.initSize = position.initSize;
  // delete position.initSize;
  newGroup.cssStyle = position;
  newGroup.styles = position;
  newGroup.shapeCss = position;
  newGroup.childComList = child;

  // 当前组件成组前所在的索引,后面成组时便与替换相应位置
  let componentCurrentIndex = 0;
  if (undoGroupParentKey) {
    componentCurrentIndex = parentGroup.childComList.findIndex((item) => child[0].key === item.key);
  } else if (isEqual) {
    componentCurrentIndex = parentGroup.childComList.findIndex((item) => child[0].key === item.key);
  } else {
    componentCurrentIndex = LayerStore.currentLayerComList.findIndex((item) => child[0].key === item.key);
  }

  // 删除成组前的组件
  LayerStore.removeComponentByCurrentLayerList(keys);

  // 加入新成的组
  if (undoGroupParentKey) {
    // 父级组中右键取消组后回退操作
    parentGroup = getComponent(undoGroupParentKey); // 撤销时不能从当前图层获取，因为有可能在离开了当前图层再去做撤销操作
    newGroup.level = parentGroup.level + 1; // 子组层级在父组层级上+1
    // 右键成组后，将当前组下所有子组件层级递增
    replaceCompLevel(newGroup.childComList, newGroup.level + 1);
    // parentGroup.childComList.splice(0, 0, newGroup);
    parentGroup.childComList.splice(componentCurrentIndex, 0, newGroup);

    LayerStore.updateComponent(parentGroup);
  } else if (isEqual) {
    // 父级组中右键成组操作
    // console.log('父级组中右键成组操作');
    newGroup.level = parentGroup.level + 1; // 子组层级在父组层级上+1
    // 右键成组后，将当前组下所有子组件层级递增
    replaceCompLevel(newGroup.childComList, newGroup.level + 1);
    newGroup.groupKey = parentGroup.key;
    // parentGroup.childComList.splice(0, 0, newGroup);
    parentGroup.childComList.splice(componentCurrentIndex, 0, newGroup);

    // if (bigScreenType !== 'card') {
    //   LayerStore.updateComponent(parentGroup);
    // }
    LayerStore.updateComponent(parentGroup);
  } else {
    // 普通成组
    newGroup.level = 1; // componentList上的全部为一级组
    // 右键成组后，将当前组下所有子组件层级递增
    replaceCompLevel(newGroup.childComList, newGroup.level + 1);
    // 获取当前图层组件列表
    let { componentList } = window;
    // if (bigScreenType !== 'card') {
    //   componentList = LayerStore.currentLayerComList;
    //   componentList.splice(0, 0, newGroup);
    //   LayerStore.updateCurrentLayerComList(componentList);
    // } else {
    //   componentList.splice(0, 0, newGroup);
    // }
    componentList = LayerStore.currentLayerComList;
    // componentList.splice(0, 0, newGroup);
    componentList.splice(componentCurrentIndex, 0, newGroup);
    LayerStore.updateCurrentLayerComList(componentList);
  }

  return newGroup;
};
