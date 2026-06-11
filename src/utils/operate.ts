/**
 * 计算画布坐标
 */

import { cloneDeep } from 'lodash';
import { mapGetMatrixCopy as mapGetMatrix } from '@/utils/compute';
import { findTopParent } from './componentUtils';
// import DataI from './global-api';
// DataI.getComponentByKey
function getNodeMap(tree) {
  const nodeMap = {};
  const nodeParentMap = {};

  const deepMap = (arr, parent) => {
    arr.forEach((item) => {
      nodeMap[item.key] = item;
      nodeParentMap[item.key] = parent;
      if (item.childComList && item.childComList.length > 0) {
        deepMap(item.childComList, item);
      }
    });
  };
  deepMap(tree, null);
  return {
    nodeMap,
    nodeParentMap,
  };
}
function getParentList(item, nodeMap, nodeParentMap, andSelf = true) {
  const res = [];
  const getParent = (key) => {
    const self = nodeMap[key];
    let parent = nodeParentMap[key];
    if (self && andSelf) {
      res.push(self);
    }
    while (parent) {
      res.push(parent);
      parent = nodeParentMap[parent.key];
    }
  };
  getParent(item.key);
  return res;
}

// 删除自己定义的多余属性
function deepDeleteAttr(format) {
  if (format.length > 0) {
    format.forEach((item) => {
      if (item.absolutePosNew || item.absolutePos) {
        delete item.absolutePosNew;
        delete item.absolutePos;
      }
      if (item.childComList) {
        deepDeleteAttr(item.childComList);
      }
    });
  }
  return format;
}

// 获取节点绝对坐标，获取所有父节点累加
export function getNodeAbsolutePos(node, nodeMap, nodeParentMap) {
  const [left, top] = getParentList(node, nodeMap, nodeParentMap).reduce(
    (pos, item) => {
      const [l, t] = mapGetMatrix(item.styles.transform);
      return [pos[0] + l, pos[1] + t];
    },
    [0, 0],
  );
  return {
    x: left,
    y: top,
  };
}

// 处理树节点，求出每个节点的绝对坐标
export function formatTree(tree, nodeMap, nodeParentMap) {
  const fn = (nodes, parent) => {
    return nodes.forEach((item) => {
      item._accurate_update = true;
      const [x, y] = mapGetMatrix(nodeMap[item.key].styles.transform);
      const w = Number.parseInt(item.styles.width);
      const h = Number.parseInt(item.styles.height);
      if (parent) {
        item.level = parent.level + 1;
        const left = getNodeAbsolutePos(item, nodeMap, nodeParentMap).x;
        const top = getNodeAbsolutePos(item, nodeMap, nodeParentMap).y;
        item.absolutePos = {
          left,
          top,
          right: left + w,
          bottom: top + h,
          width: w,
          height: h,
        };
      } else {
        item.level = 1;
        item.absolutePos = {
          left: x,
          top: y,
          right: x + w,
          bottom: y + h,
          width: w,
          height: h,
        };
      }

      if (item.childComList) {
        fn(item.childComList, item);
      }
      return item;
    });
  };
  fn(tree, null);
  return tree;
}

// 获取当前节点在内的所有子节点
function getAllChildren(node) {
  const children = [];
  const fn = (item) => {
    children.push(item);
    if (item.childComList) {
      item.childComList.forEach((c) => {
        fn(c);
      });
    }
  };
  fn(node);
  return children;
}

// 获取节点更新之后的信息
function getNodeUpdate(node) {
  const childrenList = getAllChildren(node);
  const top = Math.min.apply(
    null,
    childrenList.map((item) => item.absolutePos.top),
  );
  const left = Math.min.apply(
    null,
    childrenList.map((item) => item.absolutePos.left),
  );
  const right = Math.max.apply(
    null,
    childrenList.map((item) => item.absolutePos.right),
  );
  const bottom = Math.max.apply(
    null,
    childrenList.map((item) => item.absolutePos.bottom),
  );
  const width = right - left;
  const height = bottom - top;
  return {
    top,
    left,
    right,
    bottom,
    width,
    height,
    childrenList,
  };
}

// 反算所有节点相对于父节点的相对坐标
export function deepUpdateChild(nodeList, newTree) {
  const { nodeParentMap } = getNodeMap(newTree);
  nodeList.forEach((item) => {
    const parent = nodeParentMap[item.key];
    let newStyle = {};
    newStyle = parent
      ? {
          transform: `translate(${item.absolutePos.left - parent.absolutePos.left}px, ${
            item.absolutePos.top - parent.absolutePos.top
          }px)`,
          width: `${item.absolutePos.width}px`,
          height: `${item.absolutePos.height}px`,
        }
      : {
          transform: `translate(${item.absolutePos.left}px, ${item.absolutePos.top}px)`,
          width: `${item.absolutePos.width}px`,
          height: `${item.absolutePos.height}px`,
        };
    item.styles = { ...item.styles, ...newStyle };
    item.cssStyle = { ...item.cssStyle, ...newStyle };
    item.shapeCss = { ...item.shapeCss, ...newStyle };
    item.initSize = {
      width: item.absolutePos.width,
      height: item.absolutePos.height,
    };

    item.level = parent ? parent.level + 1 : 1;
    item._accurate_update = true;

    if (item.childComList) {
      deepUpdateChild(item.childComList, newTree);
    }
  });
}

/**
 *
 * @param node 当拖动组件为单个时，node是节点，否则是key
 * @param target 目标节点，规则是目标位置的前一个兄弟节点，如果没有，则是目标位置的父节点，如果没有父节点，则直接将node添加到组件树的0号位。
 * @param oldTree 左侧被操作的组件树
 * @param moveSite 当这个值为childNode时，如果当前target是个组，则移动到组的子节点，否则移动到兄弟节点
 * @param unChange 当值为ture时，代表组件列表拖动到组内，此时组件位置在组的xy坐标0的位置上，v8.3.0需求
 * @returns
 */
export function newMove(node, target, oldTree, moveSite, unChange) {
  const nodeKey = typeof node === 'string' ? node : node.key;
  // 最原始的target
  const initTarget = cloneDeep(target);
  // const newTree = cloneDeep(oldTree);
  const newTree = oldTree;
  const { nodeMap, nodeParentMap } = getNodeMap(newTree);
  let idx = -1;
  let isTarget = true;
  if (!target) {
    target = newTree;
    isTarget = false;
  }
  // if (target.refComName === 'GroupBasic') {
  if (target?.classType === 'group') {
    idx = 0;
  } else {
    const parent = nodeParentMap[target.key];
    if (parent) {
      idx = nodeParentMap[target.key].childComList.findIndex((item) => item.key === target.key) + 1;
      target = nodeParentMap[target.key];
    } else {
      idx = newTree.findIndex((item) => item.key === target.key);
      target = newTree;
    }
  }
  const nodeData = nodeMap[nodeKey];
  const targetData = nodeMap[target.key];
  // const targetData = nodeMap[initTarget.key];

  // 移动组件
  const nodeParent = nodeParentMap[nodeKey];
  const format = formatTree(newTree, nodeMap, nodeParentMap);
  let index;
  if (nodeParent) {
    index = nodeParent.childComList.findIndex((item) => item.key === nodeKey);
    nodeParent.childComList.splice(index, 1);
  } else {
    index = newTree.findIndex((item) => item.key === nodeKey);
    newTree.splice(index, 1);
  }
  // targetData.childComList = [nodeData, ...(targetData.childComList || [])];
  if (!isTarget) {
    delete nodeData.groupKey;
    newTree.unshift(nodeData);
  } else if (targetData && targetData.childComList) {
    if (moveSite !== 'childNode' && !target.isOpen && initTarget.classType === 'group') {
      const parentNode = nodeParentMap[targetData.key];
      if (parentNode) {
        // 这个if 修复 组件拖动 - 组1的组件拖出，到另一个组2下的2级组下，就会自动跑到顶级
        const currentIdx = parentNode.childComList.findIndex((item) => item.key === targetData.key);
        parentNode.childComList.splice(currentIdx + 1, 0, nodeData);
      } else {
        const currentIdx = newTree.findIndex((item) => item.key === targetData.key);
        delete nodeData.groupKey;
        newTree.splice(currentIdx + 1, 0, nodeData);
      }
    } else {
      // 需要将父节点的key变成子节点的groupkey，不然成组时组件无法找到对应的组
      nodeData.groupKey = targetData.key;
      targetData.childComList.splice(idx, 0, nodeData);
    }
  } else {
    /**
     * 当index > idx,则是从下往上移动，否则从上往下移动
     * 从上往下移动时，由于前面newTree.splice(index, 1);删除过一位元素，所以下面插入元素时idx不用变
     * 上下往上移动时，需要将idx+1，否则移动的位置就是目标位置的前一位
     */
    newTree.splice(index > idx ? idx + 1 : idx, 0, nodeData);
  }

  // 将带有置顶属性的组拖入到另一个带有置顶属性的组中时，需要关闭拖动的这个组的置顶属性
  if (nodeData.classType === 'group' && nodeData.styles?.isTop) {
    const topParent = findTopParent(nodeData);
    if (topParent.length > 0) {
      nodeData.styles.isTop = false;
    }
  }

  if (unChange) {
    return format;
  }
  // const res = formatTreeToRender(format);
  // 获取所有的父节点 - 并且倒序更新
  const targetParentList = getParentList(target, nodeMap, nodeParentMap);

  targetParentList.forEach((item) => {
    const absolutePosNew = getNodeUpdate(item);
    // const { absolutePos } = item;
    item.absolutePosNew = absolutePosNew;
    // const parent = nodeParentMap[item.key];
    item.absolutePosNew = absolutePosNew;
    item.absolutePos = absolutePosNew;
    item._accurate_update = true;
  });
  deepUpdateChild(format, format);
  const newFormat = deepDeleteAttr(format);
  console.log('$$$', newFormat);

  return newFormat;
}
