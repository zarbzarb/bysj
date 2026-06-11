import DataI from '@/utils/global-api/core';
import React from 'react';
import { TreeSelect } from 'antd';
const { TreeNode } = TreeSelect;
import { mapBaseLayerType } from '@/staticJson/MapBasic';

function extractTransformValues(transformString) {
  const match = transformString.match(/\(([^)]+)\)/);
  if (match) {
    return match[1].split(',').map((item) => item.trim());
  }
  return [];
}

//替换地图交互事件的layercode（切换图层数据源时触发）
export const handleActionSettings = (params) => {
  let { preVal, nextVal, actionSettings } = params;
  let { mapAction, layerCodeAll } = actionSettings;
  Array.isArray(layerCodeAll) &&
    layerCodeAll.forEach((item, index) => {
      layerCodeAll[index] = item.replace(preVal, nextVal);
    });
  layerCodeAll && (actionSettings['layerCodeAll'] = layerCodeAll);

  Array.isArray(mapAction) &&
    mapAction.forEach((item) => {
      let actionSettingsField = '';
      switch (item.actionType) {
        case 'mapCircleQuery':
          actionSettingsField = 'circleQueryLayer';
          break;
        case 'mapEsQuery':
          actionSettingsField = 'layerCodeVal';
          break;
        case 'mapQuery':
          actionSettingsField = 'layerCode';
          break;
        case 'mapRoutePath':
          actionSettingsField = 'routePathLayer';
          break;
        case 'mapDynamicWater':
          actionSettingsField = 'waterLayer';
          break;
      }
      if (!!actionSettingsField) {
        let layerVal = item.actionSettings[actionSettingsField];
        if (Array.isArray(layerVal)) {
          layerVal.forEach((layer, index) => {
            layerVal[index] = layer.replace(preVal, nextVal);
          });
        } else {
          layerVal = layerVal?.replace(preVal, nextVal);
        }
        item.actionSettings[actionSettingsField] = layerVal;
      }
    });
};

//替换融合的业务图层中配置的地图交互事件的key
export const replaceLayersEventKey = (params = {}) => {
  let { compList, relationMapKey, callback } = params;
  Array.isArray(compList) &&
    compList.forEach((com) => {
      if (!Array.isArray(com.eventSetings)) {
        com.eventSetings = [];
      }
      if (Array.isArray(com.eventSetings)) {
        // 地图交互事件
        com.eventSetings.forEach((event) => {
          event.actions?.forEach((action) => {
            if (action.actionType === 'gisEventEmit') {
              callback ? callback(action.actionSettings) : (action.actionSettings.mapKey = relationMapKey);
            }
          });
        });
        // 组、动态面板递归替换
        if (com.classType === 'group') {
          replaceLayersEventKey({
            compList: com.childComList,
            relationMapKey,
            callback,
          });
        } else if (com.className === 'antd' && (com.type === 'DynamicPanel' || com.type === 'CollapsePanel')) {
          // v8.17 新增折叠面板
          com.children.forEach((val) =>
            replaceLayersEventKey({
              compList: val.AntdChildComponents,
              relationMapKey,
              callback,
            }),
          );
        }
      }
    });
};

//设置轨迹地图弹窗
export const setMapPixelWin = (opts = {}) => {
  let {
    feature,
    pixel,
    compKey,
    coordinates,
    action,
    follow = true,
    offsetX = 0,
    offsetY = 0,
    position,
    isMap3D,
    mapInstance,
  } = opts;

  //console.log('setMapPixelWin*****opts**', opts);
  const _getParentDomTrans = (dom) => {
    let nodeTransform = [0, 0];
    let parentNode = dom.parentNode;
    if (parentNode && parentNode.style && parentNode.style.transform) {
      nodeTransform = extractTransformValues(parentNode.style.transform); //parentNode.style.transform.match(/(?<=\()(.+?)(?=\))/g)[0].split(',');
      let parentTransform = _getParentDomTrans(parentNode);
      nodeTransform = [
        parseInt(nodeTransform[0]) + parseInt(parentTransform[0]),
        parseInt(nodeTransform[1]) + parseInt(parentTransform[1]),
      ];
    }
    return nodeTransform;
  };
  const _cartesianToPixelErr = (mapInstance, coordinates) => {
    let pixel = [-1, -1];
    try {
      pixel = mapInstance.cartesianToPixel(coordinates[0], coordinates[1]);
    } catch (error) {
      console.error(error);
    }
    return pixel;
  };
  function _getPixel(pixel, index) {
    let key = index == 1 ? 'y' : 'x';
    return pixel[index] || pixel[key];
  }

  let mapContainerStyle = mapInstance['container'].parentNode.style;
  let winDom = document.querySelector(`[data-key*="${compKey}"]`);
  let transformArr = extractTransformValues(mapContainerStyle.transform); //mapContainerStyle.transform.match(/(?<=\()(.+?)(?=\))/g)[0].split(',');
  let curOffsetLeft = mapInstance['container'].offsetLeft;
  let curOffsetTop = mapInstance['container'].offsetTop;
  let screenWrapAllDom = document.querySelectorAll('.screen-wrap');
  let screenWrapDom = null;
  screenWrapAllDom &&
    screenWrapAllDom.length > 0 &&
    screenWrapAllDom.forEach((ele) => {
      if (winDom && ele.contains(winDom)) {
        screenWrapDom = ele;
      }
    });
  if (!screenWrapDom) {
    return false;
  }

  let scalexy = extractTransformValues(screenWrapDom.style?.transform); //screenWrapDom.style?.transform.match(/(?<=\()(.+?)(?=\))/g) || [1, 1];
  let scaleX = Number(scalexy[0]);
  let scaleY = Number(scalexy[1]);

  let pixel_0 = 0;
  let pixel_1 = 0;
  if (!pixel || position == 'center') {
    pixel = isMap3D ? _cartesianToPixelErr(mapInstance, coordinates) : mapInstance.coordinateToPixel(coordinates);
    pixel_0 = _getPixel(pixel, 0);
    pixel_1 = _getPixel(pixel, 1);
  } else {
    pixel_0 = _getPixel(pixel, 0);
    pixel_1 = _getPixel(pixel, 1);
    coordinates = isMap3D
      ? mapInstance.pixelToCartesian(pixel_0, pixel_1)
      : mapInstance.pixelToCoordinate([pixel_0, pixel_1]);
  }
  pixel_0 = _getPixel(pixel, 0);
  pixel_1 = _getPixel(pixel, 1);
  if (!winDom || !winDom.style) {
    return false;
  }
  let parentTransArr = _getParentDomTrans(winDom);
  winDom.style.display = 'inline-block';
  let poxelX =
    parseInt(transformArr[0]) +
    curOffsetLeft +
    pixel_0 / scaleX -
    Number(winDom.offsetWidth) / 2 +
    Number(offsetX) -
    parentTransArr[0];
  let poxelY = parseInt(transformArr[1]) + curOffsetTop + pixel_1 / scaleY + Number(offsetY) - parentTransArr[1];
  // console.log('_setWinPixel*opts*', opts)

  if (follow) {
    winDom.style.zIndex = 10000;
    winDom.style.transform = 'translate(' + poxelX + 'px, ' + poxelY + 'px)';

    if (action == 'click') {
      let cbTimer = null;
      let cbFlag = false;
      feature.customMoveHandleCb = () => {
        if (cbTimer) {
          clearTimeout(cbTimer);
        }
        let [x, y] = isMap3D
          ? _cartesianToPixelErr(mapInstance, coordinates)
          : mapInstance.coordinateToPixel(coordinates);
        let width = parseInt(mapContainerStyle.width);
        let height = parseInt(mapContainerStyle.height);
        curOffsetLeft = mapInstance['container'].offsetLeft;
        curOffsetTop = mapInstance['container'].offsetTop;
        if (x < 0 || y < 0 || x > width || y > height) {
          if (feature && winDom.style.display != 'none') {
            feature.winDomDisplay = 'none';
          }
          winDom.style.display = 'none';
        } else {
          if (feature && feature.winDomDisplay == 'none') {
            feature.winDomDisplay = '';
            winDom.style.display = 'inline-block';
          }
          let poxelX =
            parseInt(transformArr[0]) +
            curOffsetLeft +
            x / scaleX -
            Number(winDom.offsetWidth) / 2 +
            Number(offsetX) -
            parentTransArr[0];
          let poxelY = parseInt(transformArr[1]) + curOffsetTop + y / scaleY + Number(offsetY) - parentTransArr[1];
          winDom.style.transform = 'translate(' + poxelX + 'px, ' + poxelY + 'px)';
        }
        if (!cbFlag) {
          cbTimer = setTimeout(() => {
            feature.customMoveHandleCb();
            cbFlag = true;
          }, 60);
        }
      };
    }
  }
};

//v7.5获取分类
export const getCurrentGroup = (groups, id) => {
  if (!id) {
    return null;
  }
  let group = null;
  const loop = (groups, id) => {
    let group = null;
    groups.some((item) => {
      if (item.fid === id) {
        group = item;
        return true;
      } else {
        if (item.children && item.children.length > 0) {
          group = loop(item.children, id);
        }
        return group ? true : false;
      }
    });
    return group;
  };
  if (groups && groups.length > 0) {
    group = loop(groups, id);
  }
  console.log('group', group);
  return group;
};

// 根据图层layerCode反向查询所属分组兼容老时空可以中途修改分组的情况
export const getCurrentGroupReverse = (groups, id) => {
  if (!id) {
    return null;
  }
  let group = null;
  const loop = (groups, id) => {
    // let group = null;
    groups.some((item) => {
      if (item.children && item.children.length > 0) {
        loop(item.children, id);
      }
      const { layers = [] } = item;
      layers?.some((layer) => {
        if (layer.layerCode === id) {
          group = item;
          return true;
        }
        return false;
      });
      return group ? true : false;
      // if (item.fid === id) {
      //   group = item;
      //   return true;
      // } else {
      //   if (item.children && item.children.length > 0) {
      //     group = loop(item.children, id);
      //   }
      //   return group ? true : false;
      // }
    });
    return group;
  };
  if (groups && groups.length > 0) {
    group = loop(groups, id);
  }
  console.log('group', group);
  return group;
};

// 支持无限层级
export const renderGroupNode = (children = []) => {
  const loop = (children = []) => {
    return children?.map((item, index) => {
      const { children = [] } = item;
      return (
        <TreeNode value={item.fid} title={item.groupName} key={item.fid}>
          {loop(children)}
        </TreeNode>
      );
    });
  };
  return loop(children);
};

//v7.5获取分类以及子类的图层
export const getAllLayers = (group) => {
  let layers = group?.layers || [];
  // console.log('layers1', layers);
  if (group && group.children && group.children.length > 0) {
    group.children.forEach((child) => {
      let childLayers = getAllLayers(child);
      // console.log('childLayers', childLayers);
      layers = layers.concat(childLayers || []);
      // console.log('layers2', layers);
    });
  }
  // console.log('layers3', layers);
  return layers;
};

//获取关联地图的点线面图层
export const getRelateMapLayers = (mapKey) => {
  let result = [];
  //let mapCom = window.compList.get(mapKey);
  let mapCom = DataI.getComList(mapKey);
  if (mapCom.length > 0) {
    mapCom[0]?.layers?.forEach((v) => {
      if (mapBaseLayerType.includes(v.type)) {
        result.push(v);
      }
    });
  }

  return result;
};

//获取关联地图
export const getRelateMapComs = (mapKey) => {
  let result = {};
  //let mapCom = window.compList.get(mapKey);
  let mapCom = DataI.getComList(mapKey);
  if (mapCom.length > 0) {
    result = mapCom[0];
  }
  return result;
};

// 获取父级路径
const getParentNodePath = (list, node) => {
  let nodeList = node;
  let parentNode = list.find((item) => item.value == node.parentId);
  if (parentNode) {
    parentNode.children = [node];
    parentNode.disabled = true;
    nodeList = parentNode.parentId ? getParentNodePath(list, parentNode) : parentNode;
  }
  return nodeList;
};

// 扁平化组件数据
const flateComplist = (compList, compArr) => {
  compList?.forEach((item, index) => {
    let mapTypeArr = ['MapFoundationPlan', 'Map3DFoundationPlan', 'MapGlFoundationPlan'];
    if (mapTypeArr.includes(item.englishName)) {
      compArr.push({
        title: item.name || item.compName,
        value: item.key,
        type: item.englishName,
        parentId: item.groupKey,
        layers:
          item.layers &&
          item.layers.map((layer) => {
            return {
              title: layer.name || layer.compName,
              value: layer.key,
              type: layer.englishName,
            };
          }),
      });
    }

    if (item.childComList) {
      flateComplist(item.childComList, compArr);
    }
  });
};

// 获取地图组件
export const getMapTreeComs = (componentList) => {
  let compArr = [];
  let result = [];
  let groupObj = {};
  // let mapTypeArr = ['MapFoundationPlan', 'Map3DFoundationPlan', 'MapGlFoundationPlan'];
  flateComplist(componentList || window.componentList, compArr);
  compArr.forEach((item, index) => {
    if (item?.parentId && groupObj.hasOwnProperty(item.parentId)) {
      // 重复组合并
      groupObj[item.parentId].children?.push(item);
    } else {
      let obj = { ...item };
      let parent = getParentNodePath(compArr, obj);
      groupObj[item.parentId] = parent;
      result.push(parent);
    }
  });
  return result;
};

//获取图层树中图层
export const getLayersTree = (compList, mapKey) => {
  let list = [];
  function loop(compList) {
    Array.isArray(compList) &&
      compList.forEach((com) => {
        if (com.type == 'LayerTree' && com.props.relation_map_key == mapKey) {
          com.props.layerTree.forEach((item) => {
            item.children.forEach((val) => {
              if (val.type == 'layer') {
                list.push({
                  layerCode: val.layerCode,
                  title: val.title,
                  value: val.layerKey,
                });
              }
              if (val.type == 'group') {
                val.children.forEach((v) => {
                  list.push({
                    layerCode: v.layerCode,
                    title: v.title,
                    value: v.layerKey,
                  });
                });
              }
            });
          });
        }
        if (com.classType == 'group') {
          loop(com.childComList);
        } else if (com.type == 'DynamicPanel' || com.type == 'CollapsePanel') {
          // v8.17 新增折叠面板
          com.children.forEach((val) => {
            loop(val.AntdChildComponents);
          });
        }
      });
  }
  loop(compList);
  list = [...getLayerCode(mapKey), ...list];
  const res = new Map();
  list = list.filter((item) => !res.has(item['value']) && res.set(item['value'], 1));

  let layerList = [
    {
      title: '关联图层',
      value: '关联图层',
      selectable: false,
      children: list,
    },
  ];
  return layerList;
};

const getLayerCode = (mapKey) => {
  let code = [];
  let mapCom = DataI.getComList(mapKey);
  let foundationPlan = mapCom.length > 0 ? mapCom[0] : {};
  foundationPlan?.layers?.forEach((v) => {
    if (mapBaseLayerType.includes(v.type)) {
      code.push({
        layerCode: v.instance.compAttr.relation_layer_code,
        title: v.name,
        // layerKey: v.key
        value: v.key,
      });
    }
  });
  return code;
};

//地图交互注册变量监听回调
export const registerMapVariListen = (vari, listenFn) => {
  globalEventEmitter.removeListener(vari, listenFn);
  globalEventEmitter.on(vari, listenFn);
  //销毁函数
  return () => {
    globalEventEmitter.removeListener(vari, listenFn);
  };
};
