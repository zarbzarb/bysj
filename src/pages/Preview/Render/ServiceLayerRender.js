import React, { useState, useEffect } from 'react';
import DataI from '@/utils/global-api';
import { dynamicLoadPlugins, dynamicLoadFont } from '@/utils/loadScript';
import { layerTreeLoadLayerType } from '@/staticJson/MapBasic';
import RenderByType from './CommonRender';
import { getSysLayerListByBatchID } from '../ajax';
import { unique } from '@/utils/common';
import { compatibleEventSettings } from '@/utils/componentUtils';

export default (props) => {
  const { compCount, screenConfig, layerTreeComs, layerUidArr } = props;

  const [sysLayerList, setSysLayerList] = useState([]);
  const [renderList, setRenderList] = useState([]);

  const EventEmitter = window.globalEventEmitter;

  const handleEmitLoadStatus = () => {
    const timer = setInterval(() => {
      if (window._loadEventKey) {
        clearInterval(timer);
        layerTreeComs.forEach((item) => {
          const { key } = item;
          EventEmitter.emit(`${key}_loaded`);
        });
      }
    }, 100);
  };

  // 替换，业务图层用的是融合屏的地图
  const replaceLayersEventKey = (list, relationMapKey) => {
    DataI.each(list, (com) => {
      com.eventSetings = compatibleEventSettings(com.eventSetings);

      if (Array.isArray(com.eventSetings)) {
        com.eventSetings.forEach((event) => {
          event?.groups?.forEach((actionGroup) => {
            actionGroup?.actions?.forEach((action) => {
              if (action.actionType === 'gisEventEmit') {
                action.actionSettings.mapKey = relationMapKey;
              }
            });
          });
        });
      }
    });
  };

  const loadLayerConfig = (syslayerList) => {
    // let { componentList, dataStore } = curConfig;
    let retComlist = [];
    let retDataStore = [];
    let retDynamicApis = [];

    const sysLayerListMap = {};
    syslayerList.forEach((item) => {
      sysLayerListMap[item.layerUid] = item;
    });

    // 遍历查找图层树中的图层
    const loop = (tree, layersArr, relateMap) => {
      if (Array.isArray(tree)) {
        tree.forEach((item) => {
          if (item.type === 'layer') {
            /* let selLayer = layersArr.find((layer) => {
              return layer.title == item.title;
            }); */
            const selLayer = sysLayerListMap[item.layerUid];
            if (selLayer && sysLayerListMap[selLayer.layerUid] && sysLayerListMap[selLayer.layerUid].jsonConfig) {
              // let config = JSON.parse(selLayer.config) ;
              const config = JSON.parse(sysLayerListMap[selLayer.layerUid].jsonConfig);
              const foundationMap = config.componentList.find((list) => {
                return (
                  list.englishName === 'MapFoundationPlan' ||
                  list.englishName === 'Map3DFoundationPlan' ||
                  list.englishName === 'MapGlFoundationPlan'
                );
              });
              // 业务图层-变量
              if (Array.isArray(config.dataStore)) {
                retDataStore = retDataStore.concat(config.dataStore);
              }

              // 业务图层动态数据源API
              if (Array.isArray(config?.screenConfig?.dynamicApis)) {
                retDynamicApis = retDynamicApis.concat(config.screenConfig.dynamicApis);
              }

              // 业务图层-弹窗图层
              const layersTmp = config.screenConfig.layerConfig.layers;
              const popLayer = layersTmp.find((um) => {
                return um.layerName === '弹窗图层';
              });
              const popLayerList = [];
              config.componentList.forEach((list) => {
                if (popLayer?.layerId === list.layerId) {
                  list.styles.display = 'none';
                  list.hideFlag = true;
                  // list.hideGroupFlag = true;
                  popLayerList.push(list);
                }
              });
              // !Array.isArray(relateMap.popLayers) && (relateMap.popLayers = []);
              if (!Array.isArray(relateMap.popLayers)) {
                relateMap.popLayers = [];
              }
              relateMap.popLayers = relateMap.popLayers.concat(popLayerList);

              // 业务图层-图层
              const tmpLayer = foundationMap?.layers.find((layer) => {
                return layerTreeLoadLayerType.includes(layer.type);
              });
              // let loadLayerFlag = relateMap?._attr?.loadLayer;
              if (tmpLayer) {
                tmpLayer.popLayerId = popLayer?.layerId;
                tmpLayer.layerUid = selLayer.layerUid;
                tmpLayer.layerName = selLayer.layerName;
                // tmpLayer.key = tmpLayer.key + '-' + selLayer.layerUid; //业务图层重复
                // loadLayerFlag && relateMap.layers.push(tmpLayer);
                // !Array.isArray(relateMap.sysLayers) && (relateMap.sysLayers = []);
                if (!Array.isArray(relateMap.sysLayers)) {
                  relateMap.sysLayers = [];
                }
                relateMap.sysLayers.push(tmpLayer);
              }
            }
          }

          if (Array.isArray(item.children)) {
            loop(item.children, layersArr, relateMap);
          }
        });
      }
    };

    // let layerTreeComs = findCompOfSameType('LayerTree', compList);

    let popLayerCom = [];
    layerTreeComs.forEach((item) => {
      // let mapCom = DataI.getComList(item.props.relation_map_key, componentList);
      // let relateMap = mapCom[0];
      // let relateMap = componentList.find((com) => {
      //   return com.key == item.props.relation_map_key;
      // });
      // 暂时不用mapLayersTree字段
      const relateMap = window.comList.get(item.props.relation_map_key); // 关联的地图组件
      let layersArr = [];
      item.props.mapLayersTree.forEach((com) => {
        layersArr = layersArr.concat(com.children);
      });
      // console.log('render***', item.props.layerTree, layersArr, relateMap);
      if (relateMap) {
        loop(item.props.layerTree, layersArr, relateMap);
        if (Array.isArray(relateMap.popLayers)) {
          replaceLayersEventKey(relateMap.popLayers, relateMap.key); // 使用的是大屏的地图
          popLayerCom = popLayerCom.concat(relateMap.popLayers);
        }
      }
      // item.loadCallback && item.loadCallback();
      // EventEmitter.emit(item.key + '_loaded');
    });

    handleEmitLoadStatus();

    // 业务图层-变量
    // Array.isArray(dataStore) && (retDataStore = retDataStore.concat(dataStore));

    // 加载业务图层-弹出图层
    if (Array.isArray(popLayerCom)) {
      retComlist = popLayerCom.concat(retComlist);
    }
    return [retComlist, retDataStore, retDynamicApis];
  };

  // 加载所需资源
  const loadStaticResource = (componentList, callback) => {
    dynamicLoadPlugins(componentList).then(() => {
      callback && callback();
    });

    dynamicLoadFont(componentList);
  };

  useEffect(() => {
    getSysLayerListByBatchID(layerUidArr).then((sysLayerRes) => {
      if (Number(sysLayerRes?.code) === 200 && sysLayerRes?.data && sysLayerRes.data?.length > 0) {
        setSysLayerList(sysLayerRes.data);
      } else {
        handleEmitLoadStatus();
      }
    });
  }, []);

  useEffect(() => {
    // 加载图层树中的业务图层
    if (Array.isArray(sysLayerList) && sysLayerList.length > 0) {
      const [layersComponentList, layersDataStore, layersDynamicApis] = loadLayerConfig(sysLayerList);
      console.log('serviceLayerRender***', layersComponentList, layersDataStore, layersDynamicApis);
      // 业务图层变量处理
      window.dataStore = (window.dataStore || []).concat(layersDataStore);
      window.servicelayerList = layersComponentList;
      // 业务图层携带的动态api和大屏中的动态api合并
      screenConfig.dynamicApis = unique([...screenConfig.dynamicApis, ...layersDynamicApis]);
      DataI.each(window.servicelayerList, (component) => {
        // 组件树转为map映射
        DataI.setComInfoMap(component);
      });
      loadStaticResource(layersComponentList, () => {
        setRenderList(layersComponentList); // REVIEW liuming 回调函数执行包起来
      });
    }
  }, [sysLayerList]);

  return (
    <>
      {renderList.map((child, idx) => {
        return <RenderByType key={child.key} compCount={compCount} item={child} index={idx} config={screenConfig} />;
      })}
    </>
  );
};
