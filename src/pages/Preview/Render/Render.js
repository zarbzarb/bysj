import React, { useLayoutEffect } from 'react';
import RenderByType from './CommonRender';
import {
  gisCircleQuery,
  gisTrackPlayback,
  gisEsQuery,
  gisRoutePath,
  gisHeatLine,
  gisTriggerClick,
  gisGetCenter,
  gisGetZoom,
  gitSetPoint,
  gisRenderLayers,
  gisQueryFilter,
  gisChangeBaseLayer,
  gisMapSplitScreen,
  gisSwipCompare,
  gisDynamicWater,
  gisMapParticleEffects,
  gitMapMeasure,
  gisMapDraw,
  gisMapSpaceQuery,
  // v6.19新增绘制线
  gisMapDrawLine,
  gisMapLayerShow,
  gisMapFlyAnimate,
  gisAnimationPoint,
} from './gisEventUtils';
import { gisDataSplitRender, gisLocation, gisSetZoom, gisLookAt } from './gisEventUtilsNew';
export default (props) => {
  const { list, screenConfig, compCount, topRender, isMobile } = props;

  const EventEmitter = window.globalEventEmitter;
  // 缓存数据
  const gisDataCache = { mapFea: [] };

  /** 监听gis event事件信息 */
  useLayoutEffect(() => {
    if (isMobile) return;
    EventEmitter.removeAllListeners('gitEventType');
    const listenFn = (data) => {
      console.log('gitEventType*****listenFn2***', data);
      // configsAll = data;
      const layerList = window.layerList || [];
      // index = _.findIndex(layerList, ['key', data['mapKey']]),
      const index = layerList.findIndex((layer) => layer.key === data.mapKey);
      let customMapObj = layerList[index]?.instance;
      const gisActionConfig = data.gisAction;
      let customMapPlan = {};

      if (index < 0) {
        const mapCom = window.comList.get(data.mapKey); // 关联的地图组件
        if (mapCom) {
          customMapPlan = mapCom;
        }
        customMapObj = customMapPlan?.instance;
      } else {
        customMapPlan = layerList[index];
      }
      // 统一处理地图交互事件
      const actionFunMap = {
        mapLocationEvent: gisLocation, //定位
        mapZoomEvent: gisSetZoom, //缩放
        mapFlyAnimate: gisMapFlyAnimate, //飞线动画
        mapGetCenter: gisGetCenter, // 获取中心点
        mapGetZoom: gisGetZoom, // 获取缩放级别-比例尺
        mapEsQuery: gisEsQuery, // 全局查询
        mapSetClick: gisTriggerClick, // 触发地图点击事件
        mapCircleQuery: gisCircleQuery, // 周边查询
        mapTrackPlayback: gisTrackPlayback, // 轨迹播放
        mapRoutePath: gisRoutePath, // 轨迹飞线
        mapHeatLine: gisHeatLine, // 热力线
        mapCutEvent: gisChangeBaseLayer, // 切换底图
        mapSetPoint: gitSetPoint, // 地图选点
        mapQuery: gisQueryFilter, // 查询
        mapMeasure: gitMapMeasure, // 测量
        mapDraw: gisMapDraw, // 区域绘制
        mapSpaceQuery: gisMapSpaceQuery, // 空间查询
        mapRenderLayers: gisRenderLayers, // 渲染
        mapSplitScreen: gisMapSplitScreen, // 分屏对比
        mapSwipCompare: gisSwipCompare, // 卷帘分析
        mapDynamicWater: gisDynamicWater, // 水位升降
        mapParticleEffects: gisMapParticleEffects, // 粒子特效
        mapDrawLine: gisMapDrawLine, // v6.19 新增绘制线
        mapShow: gisMapLayerShow,
        mapAnimationPoint: gisAnimationPoint, //雷达波
        mapDataSplitRender: gisDataSplitRender, //图层数据设置
        mapLookAt: gisLookAt, //绕点旋转
      };
      /**
       * 统一传入参数
       * data 交互事件配置
       * customMapObj 关联地图对象instance
       * gisDataCache 交互触发时临时缓存对象
       * customMapPlan 关联地图组件
       * action 绑定组件事件
       * comp 绑定组件
       */
      Object.keys(gisActionConfig).forEach((action) => {
        actionFunMap[action] &&
          actionFunMap[action]({
            index,
            data,
            customMapObj,
            gisDataCache,
            customMapPlan,
            action: data.action,
            comp: data.comp,
          });
      });
    };
    EventEmitter.on('gitEventType', listenFn);

    return () => {
      // 图层搜索异常删除地图事件
      if (props?.isNotRemoveMapEvent != true) {
        EventEmitter.removeListener('gitEventType', listenFn);
      }
    };
  }, [list, isMobile]);

  const componentList = list;

  /* 初始化显隐闪屏处理 */
  const hideKeyList = [];
  const loop = (componentList) => {
    componentList.forEach((item) => {
      let allListenVariable;
      if (item.eventSetings) {
        const list = item.eventSetings || [];
        allListenVariable = list.filter((vl) => vl.eventType === 'initialization');
        allListenVariable.forEach((info) => {
          info.groups.forEach((ag) => {
            const { actions = [] } = ag;
            actions.forEach((action) => {
              if (action.actionType === 'visiableToggle') {
                const { actionSettings = {} } = action;
                if (Object.keys(actionSettings).length === 0) return;
                const { visiable, compKey = [] } = actionSettings;
                if (visiable === '1') {
                  if (Array.isArray(compKey)) {
                    compKey.forEach((key) => {
                      hideKeyList.push(key);
                    });
                  } else {
                    !!compKey && hideKeyList.push(compKey); // REVIEW liuming 兼容老大屏只能显隐单个组件的字符串数据结构
                  }
                }
              }
              // v7.5 添加动画显示/隐藏处理 暂时去掉
              if (action.actionType === 'animateSettings') {
                const { animationSettings = [] } = action.actionSettings;
                if (animationSettings.length === 0) return;
                animationSettings.forEach((animationSetting) => {
                  const { animationType, hideEffect, visible, associatComponents = [] } = animationSetting;
                  if (
                    animationType === 'showHide' &&
                    visible === '1' &&
                    hideEffect === 'none' &&
                    Array.isArray(associatComponents)
                  ) {
                    associatComponents.forEach((key) => {
                      hideKeyList.push(key);
                    });
                  }
                });
              }
            });
          });
        });
      }
      if (item.classType === 'group') {
        loop(item.childComList);
      } else if (item.type === 'DynamicPanel' || item.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        item.children.forEach((child) => {
          loop(child.AntdChildComponents);
        });
      }
    });
  };
  loop(componentList);

  const hideLoop = (componentList, parentEle) => {
    componentList.forEach((child) => {
      child.hideFlag = !!hideKeyList.includes(child.key);

      // 组隐藏特殊处理
      if (
        parentEle &&
        [
          '@yl/datai-com-map-foundationPlan',
          '@yl/datai-com-map-3D-FoundationPlan',
          '@yl/datai-com-map-gl-FoundationPlan',
        ].includes(child.type)
      ) {
        parentEle.hideFlag = false;
      }
      if (child.classType === 'group') {
        // child.hideGroupFlag = child.hideFlag;
        hideLoop(child.childComList, child);
      } else if (child.type === 'DynamicPanel' || child.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        child.children.forEach((children) => {
          loop(children.AntdChildComponents);
        });
      }
    });
  };

  hideLoop(componentList);
  /* 初始化显隐闪屏处理 */

  /* 逻辑图层的初始化隐藏闪屏处理 */
  const hideLogicLayer = (compList, parentEle) => {
    compList.forEach((child) => {
      child.hideFlag = true; // 初始化隐藏
      // 组隐藏特殊处理
      if (
        parentEle &&
        [
          '@yl/datai-com-map-foundationPlan',
          '@yl/datai-com-map-3D-FoundationPlan',
          '@yl/datai-com-map-gl-FoundationPlan',
        ].includes(child.type)
      ) {
        parentEle.hideFlag = false;
      }

      if (child.classType === 'group') {
        // child.hideGroupFlag = true;
        hideLoop(child.childComList, child);
      } else if (child.type === 'DynamicPanel' || child.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        child.children.forEach((children) => {
          loop(children.AntdChildComponents);
        });
      }
    });
  };
  const { layerConfig = {} } = screenConfig;
  const { layers = [] } = layerConfig;
  layers.forEach((layer) => {
    if (layer.hasOwnProperty('hideFlag') && layer.hideFlag) {
      const layerComList = [];
      componentList.forEach((com) => {
        if (layer.layerId === com.layerId) {
          layerComList.push(com);
        }
      });
      hideLogicLayer(layerComList);
    }
  });
  /* 逻辑图层的初始化隐藏闪屏处理 */

  return componentList.map((child, idx) => {
    return (
      <RenderByType
        key={child.key}
        compCount={compCount}
        item={child}
        index={idx}
        config={screenConfig}
        topRender={topRender}
      />
    );
  });
};
