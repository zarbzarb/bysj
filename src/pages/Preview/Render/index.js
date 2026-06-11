import React, { useEffect } from 'react';
import DataI from '@/utils/global-api/core.js';
import { removeAllEventEmitterListeners } from '@/utils/utils';
import LogApp from '@/components/LogApp/index';
import { findCompOfSameType } from '@/utils/componentUtils';
import Container from './PageContainerRender';
import Render from './Render';
import ServiceLayerRender from './ServiceLayerRender';
import ScreenConfigContext from './ScreenConfigContext';
import LoadedLastComp from './LoadedLastComp';
import { getHookJsonSettings } from '../ajax';

window.DataI = DataI;

// todo 防止多次渲染被覆盖
let componentCount = 0;

const RenderEngine = (props) => {
  const {
    renderWrapperId,
    type,
    pageConfig,
    screenConfigRef,
    loadedCallBack,
    loadedDataStoreCallback,
    customSdkSets,
    appPageId,
    version,
  } = props;

  const { componentList, gridLayoutList, screenConfig, dataStore } = pageConfig;

  // 多SDK防止screenConfig被覆盖
  screenConfig.renderWrapperId = renderWrapperId;
  screenConfig.type = type;
  screenConfigRef.current = { ...screenConfig };

  window.screenConfig = screenConfig;
  window.girdLayoutList = gridLayoutList;

  const compCount = () => {
    componentCount++;
  };

  const addHook = (hookCode) => {
    const arr = DataI.flatten(componentList); // 扁平化处理
    const time = setInterval(() => {
      if (componentCount >= arr.length) {
        clearInterval(time);
        const timer = setTimeout(() => {
          try {
            const hookFunc = new Function(hookCode);
            hookFunc(); // 执行hook脚本
            // v7.3 sdk渲染完执行回调重新判断
            // loadedCallBack && loadedCallBack(); // sdk渲染完执行回调
          } catch (error) {
            // throw e;  // REVIEW liuming 抛出会导致白屏
            console.error(error);
          }
          clearTimeout(timer);
        }, 100);
      }
    }, 300);
    const timer = setTimeout(() => {
      clearInterval(time);
      clearTimeout(timer);
    }, 30000);
  };

  useEffect(() => {
    if (type === 'page') {
      // 只有页面支持hook
      getHookJsonSettings(renderWrapperId, appPageId, version).then((rs) => {
        if (rs.code != 200) {
          return false;
        }
        if (!rs.data.dataJs) return;
        let hookStr = '';
        try {
          const hookArr = JSON.parse(rs.data.dataJs); // 反转义
          hookArr.forEach((item) => {
            hookStr += `${item.content};`;
          });
        } catch {
          hookStr = '';
        }
        // 替换桶名
        hookStr = hookStr
          ?.replaceAll('/${bucketName}/', `/${window.screenConfig.bucketName}/`)
          ?.replaceAll('/$[bucketName]/', `/${window.screenConfig.bucketName}/`);
        if (hookStr && hookStr !== ';') {
          addHook(hookStr);
        }
      });
    }
  }, [renderWrapperId, appPageId, type]); // 沈阳应急项目支持切换主题执行hook代码

  useEffect(() => {
    return () => {
      // sdk场景切换大屏的时候重置event emitter
      const removeFlag = location?.pathname?.includes('/visual-page-designer/');
      !removeFlag && removeAllEventEmitterListeners();
    };
  }, []);

  const resetMapCompInSdk = (prelist, nextlist) => {
    if (!Array.isArray(prelist) || !Array.isArray(nextlist)) {
      return;
    }
    // todo子节点中查找
    prelist.forEach((item, index) => {
      if (item.englishName === 'MapFoundationPlan' || item.englishName === 'Map3DFoundationPlan') {
        const mapCom = nextlist.find((coms) => coms.key == item.key);
        mapCom && (prelist[index] = mapCom);
      }
    });
  };

  const bindComList = () => {
    window.comList = {};
    window.comList.get = (key) => {
      let layerList = window.layerList || [];
      // 业务图层组件查找
      if (Array.isArray(window.servicelayerList)) {
        layerList = layerList.concat(window.servicelayerList);
      }
      if (Array.isArray(window.servicelayerSearchList)) {
        layerList = layerList.concat(window.servicelayerSearchList);
      }
      // let i = _.findIndex(layerList, ['key', key]);
      // if (i < 0) {
      //   let groupIdx, mapIdx;
      //   for (let idx = 0; idx < layerList.length; idx++) {
      //     groupIdx = undefined;
      //     mapIdx = undefined;
      //     const vl = layerList[idx];
      //     if (vl.classType == 'group') {
      //       groupIdx = idx;
      //       i = _.findIndex(vl.childComList, ['key', key]);
      //     } else if (vl.classType == 'com' && vl.layers) {
      //       mapIdx = idx;
      //       i = _.findIndex(vl.layers, ['key', key]);
      //     }
      //     if (i >= 0) {
      //       break;
      //     }
      //   }
      //   if (groupIdx !== undefined) {
      //     return layerList[groupIdx].childComList[i];
      //   } else if (mapIdx != undefined) {
      //     return layerList[mapIdx].layers[i];
      //   }
      // } else {
      //   return layerList[i].instance ? layerList[i].instance : layerList[i];
      // }
      return findComWithLoop(layerList, key);
    };
  };

  // 通过key从组件列表中找到组件
  const findComWithLoop = (list = [], key) => {
    //   let com = null;
    //   for (let idx = 0; idx < list.length; idx++) {
    //     let vl = list[idx];
    //     if (vl.key === key) {
    //       com = vl;
    //       break;
    //     } else if (vl.classType === 'group') {
    //       findComWithLoop(vl.childComList, key);
    //     } else if (vl.classType === 'com' && vl.layers) {
    //       findComWithLoop(vl.layers, key);
    //     }
    //   }
    //   return com;

    let comp = [];
    if (key && typeof key === 'string') {
      key = [key];
    }
    const findInList = (list) => {
      list.forEach((cp, idx) => {
        if (key.includes(cp.key)) {
          cp.idx = idx;
          comp.push(cp);
        } else if (cp.classType === 'group') {
          findInList(cp.childComList || []);
        } else if (cp.layers) {
          findInList(cp.layers || []);
        } else if (cp.type === 'DynamicPanel' || cp.type === 'CollapsePanel') {
          // v8.17 新增折叠面板
          cp.children.forEach((child) => {
            findInList(child.AntdChildComponents);
          });
        }
      });
    };
    findInList(list); // 遍历查找指定的组件

    comp = comp.length > 0 ? comp[0] : null;
    return comp;
  };

  let { title } = screenConfig;
  const { initParams } = screenConfig;

  if (initParams) {
    window.initParams = initParams;
  }
  // 兼容老大屏
  if (title === '云粒数智可视化大屏' || !title) {
    title = '面向数字孪生的低代码平台';
  }
  const titleDom = document.querySelector('#datai-title');
  if (titleDom) titleDom.innerHTML = title;

  // let dataStore = config.dataStore || config.componentList[0].dataStore || []; // REVIEW liuming dataStore存储在全局
  dataStore.forEach((child) => {
    child.children.forEach((item) => {
      delete item.data;
    });
  });

  if (window.dataStore == undefined || window.dataStore.length === 0) {
    window.dataStore = dataStore; // REVIEW liuming 判断条件要考虑第一次渲染和避免变量覆盖
  } else if (window.dataStore.length > 0 && dataStore.length > 0) {
    const firstInfo = dataStore[0];

    const isHave =
      window.dataStore.findIndex((child) => {
        return child.key === firstInfo.key;
      }) > -1;

    if (!isHave) {
      window.dataStore = window.dataStore.concat(dataStore);
    } else {
      window.dataStore.forEach((preInfo, idx) => {
        const currentGroup = dataStore.find((current) => current.key == preInfo.key);
        if (currentGroup) {
          window.dataStore[idx] = currentGroup;
        }
      });
    }
  }

  loadedDataStoreCallback && loadedDataStoreCallback(renderWrapperId);

  if (window.layerList == undefined || window.layerList.length === 0) {
    window.layerList = componentList;
  } else if (window.layerList.length > 0) {
    const firstInfo = componentList[0];

    const isHave =
      window.layerList.findIndex((child) => {
        return child.key === firstInfo.key;
      }) > -1;

    if (!isHave) {
      window.layerList = window.layerList.concat(componentList); // sdk场景切换大屏的时候重置大屏的组件列表
    } else {
      // sdk场景切换大屏的时候重置地图对象及event emitter
      resetMapCompInSdk(window.layerList, componentList);
    }
  }

  bindComList();

  /** 查找业务图层 */
  const getLayerUid = (layertree) => {
    let layerUids = [];
    if (!Array.isArray(layertree)) {
      return layerUids;
    }
    layertree.forEach((item) => {
      if (item?.layerUid) {
        layerUids.push(item.layerUid);
      }
      if (item?.children) {
        const uidTmp = getLayerUid(item.children);
        Array.isArray(uidTmp) && uidTmp.length > 0 && (layerUids = layerUids.concat(uidTmp));
      }
    });
    return layerUids;
  };

  const layerTreeComs = findCompOfSameType('LayerTree', componentList); // 先找到图层树
  let layerUidArr = []; // 所有的业务图层id
  layerTreeComs.forEach((item) => {
    const tmpArr = getLayerUid(item.props.layerTree);
    Array.isArray(tmpArr) && tmpArr.length > 0 && (layerUidArr = layerUidArr.concat(tmpArr));
  });
  /** 查找业务图层 */

  const newRenderWrapperId = `screen-${renderWrapperId}`;

  return (
    <ScreenConfigContext.Provider value={screenConfigRef}>
      <Container compList={componentList} type={type} customSdkSets={customSdkSets}>
        {screenConfigRef.current?.isResponsive ? (
          <ResponsiveRender list={gridLayoutList} screenConfig={screenConfigRef.current} compCount={compCount} />
        ) : (
          <div id={newRenderWrapperId} style={{ height: '100%' }}>
            <Render list={componentList} screenConfig={screenConfigRef.current} compCount={compCount} />
            {layerUidArr.length > 0 && (
              <ServiceLayerRender
                screenConfig={screenConfigRef.current}
                compCount={compCount}
                layerTreeComs={layerTreeComs}
                layerUidArr={layerUidArr}
              />
            )}
            <LoadedLastComp loadedCallBack={loadedCallBack} renderWrapperId={renderWrapperId} />
          </div>
        )}
        <LogApp />
      </Container>
    </ScreenConfigContext.Provider>
  );
};

export default RenderEngine;
