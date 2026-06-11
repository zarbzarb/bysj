import React, { useCallback, useEffect, useRef } from 'react';
import DataI from '@/utils/global-api/core';
import { removeAllEventEmitterListeners, readCacheFromSessionStorage, isFullScreen } from '@/utils/utils';
import { findCompOfSameType, findTopGroupList } from '@/utils/componentUtils';
import eventEmitterTask from '@/common/Dispatch/EventEmitterTask';
import HookTask from '@/common/Dispatch/HookTask';

import TriggerAction from '@/TriggerAction';
import { receiveMessage } from '@/TriggerAction/utils';
import { ActionGroup, EventsCollection, PageEvent, PageEvents } from '@/staticJson/PageEvent';
import Container from '../PageContainerRender';
import Render from '../Render';
import ServiceLayerRender from '../ServiceLayerRender';
import ScreenConfigContext from '../ScreenConfigContext';
import LoadedLastComp from '../LoadedLastComp';
import { getHookJsonSettings } from '../../ajax';

window.DataI = DataI;

// todo 防止多次渲染被覆盖
let componentCount = 0;

const mapEvents = {
  MapFoundationPlan: '2DMapInstanceEvent',
  Map3DFoundationPlan: '3DMapInstanceEvent',
  MapGlFoundationPlan: 'glMapInstanceEvent',
};

const resetMapCompInSdk = (prelist, nextlist) => {
  if (!Array.isArray(prelist) || !Array.isArray(nextlist)) {
    return;
  }
  // todo子节点中查找
  prelist.forEach((item, index) => {
    if (item.englishName === 'MapFoundationPlan' || item.englishName === 'Map3DFoundationPlan') {
      const mapCom = nextlist.find((coms) => coms.key === item.key);
      mapCom && (prelist[index] = mapCom);
    }
  });
};

const computedScale = (compW, compH, parentWraperId, tempScreenConfigRef, innerHeights) => {
  let scaleStyle = {};
  const width = parentWraperId ? document.querySelector(`${parentWraperId}`).clientWidth : document.body.clientWidth;
  const height = parentWraperId ? document.querySelector(`${parentWraperId}`).clientHeight : document.body.clientHeight; // 获取屏幕宽高
  const w = tempScreenConfigRef.current?.width ?? 1920;
  const h = tempScreenConfigRef.current?.height ?? 1080; // 获取设置的大屏容器宽高
  const compWidth = compW;
  const compHeight = compH;
  const xScale = Number((width / w).toFixed(4)) / 1; // 计算正向x缩放比例
  const yScale = Number((height / h).toFixed(4)) / 1; // 计算正向y缩放比例
  let reXScale = Number((w / width).toFixed(4)) / 1; // 计算反向x缩放比例
  let reYScale = Number((h / height).toFixed(4)) / 1; // 计算反向y缩放比例

  if (isFullScreen()) {
    const differenceScale = (window.screen.height - innerHeights) / window.screen.height;
    reXScale += Number(differenceScale.toFixed(4));
    reYScale += Number(differenceScale.toFixed(4));
  }

  switch (tempScreenConfigRef.current?.scale) {
    case 'scale': {
      scaleStyle = {
        transform: `scaleX(${reXScale}) scaleY(${reYScale})`,
        transformOrigin: 'left top',
        width: `${Number.parseInt(compWidth) * xScale}px`,
        height: `${Number.parseInt(compHeight) * yScale}px`,
      };

      break;
    }
    case 'scaleWidth': {
      scaleStyle = {
        transform: `scaleX(${reXScale})`,
        transformOrigin: 'left top',
        height: `${Number.parseInt(compHeight) * xScale}px`,
      };

      break;
    }
    case 'scaleHeight': {
      scaleStyle = {
        transform: `scaleY(${reYScale})`,
        transformOrigin: 'left top',
        width: `${Number.parseInt(compWidth) * yScale}px`,
      };

      break;
    }
    default: {
      break;
    }
  }
  return scaleStyle;
};

const RenderEngine = (props) => {
  const {
    appConfig,
    renderWrapperId,
    type,
    pageInfo,
    loadedCallBack,
    loadedDataStoreCallback,
    customSdkSets,
    dataStore,
    zIndex,
    isChangeSubPage,
    version,
    isSdk,
    isMobile,
  } = props;
  const { appId } = appConfig;
  const { componentList, pageConfig, pageEvents } = pageInfo;

  const screenConfig = { ...appConfig, ...pageConfig, pageId: renderWrapperId, renderWrapperId, pageEvents };
  const screenConfigRef = useRef(screenConfig); // 多SDK防止screenConfig覆盖
  screenConfigRef.current = { ...screenConfig }; // 切换页面后需要重新赋值screenConfig
  window.screenConfig = screenConfig;

  const EventEmitter = window.globalEventEmitter;

  const compCount = () => {
    componentCount++;
  };

  (() => {
    const events: PageEvent[] = Object.entries((pageEvents as EventsCollection) ?? {}).map(([, evt]) => evt);

    if (!events || screenConfig?.isMount) return;

    events
      .find(({ eventType }) => eventType === '创建后')
      ?.groups.flatMap(({ actions }) => actions)
      .forEach((act, _i, actions) => TriggerAction(act, { events, config: screenConfig, actions }));

    screenConfig.isMount = true;
  })();

  // v8.2.1获取缓存
  const executeActionsAfterChangePage = () => {
    // 可跨页面选择组件后刷新页面、界面中切换页面都需要支持，加个延时确保执行交互的时候组件在界面中都已渲染
    const key = `appPageId_${renderWrapperId}_router`;
    const cacheData = readCacheFromSessionStorage(key);
    // console.log('read pageId', renderWrapperId, 'cacheData', cacheData);
    if (cacheData) {
      const { remainderActionGroups, settings }: { remainderActionGroups: ActionGroup[]; settings: any } = cacheData;
      remainderActionGroups.forEach(({ actions: remainderActions }) => {
        remainderActions.forEach((action) => {
          const _triggerAction = () => {
            TriggerAction(
              action,
              {
                ...settings,
                actions: remainderActions,
              },
              'cache',
            );
          };

          if (action.actionType === 'gisEventEmit' && action.actionSettings?.mapKey) {
            // 地图交互等地图加载完再执行交互
            const mapComp = window.DataI.getComponentByKey(action.actionSettings.mapKey);
            if (mapComp && mapComp.instance) {
              _triggerAction();
            } else {
              const listenFn = () => {
                const subTimer = setTimeout(() => {
                  // 延时为了等地图实例生成
                  clearTimeout(subTimer);
                  _triggerAction();
                }, 1000);
                EventEmitter.removeListener(mapEvents[action.actionSettings.mapType], listenFn);
              };
              EventEmitter.on(mapEvents[action.actionSettings.mapType], listenFn);
            }
          } else {
            _triggerAction();
          }
        });
      });
    }
  };

  /**
   * hooks 执行前给地图组件添加回调，用于在hook中获取地图_map
   * @param comList 页面所有组件
   * @returns void
   */
  const addMapCallback = (comList) => {
    const itemTypes = new Set([
      '@yl/datai-com-map-3D-FoundationPlan',
      '@yl/datai-com-map-foundationPlan',
      '@yl/datai-com-map-gl-FoundationPlan',
    ]);
    comList.forEach((item) => {
      if (itemTypes.has(item.type) && item.comCreated) {
        item.getMapInstanceCb = (callback) => {
          const time = setInterval(() => {
            if (item.instance) {
              clearInterval(time);
              callback(item);
            }
          }, 300);
        };
      }
    });
  };

  const addHook = (hookCode) => {
    const arr = DataI.flatten(componentList); // 扁平化处理
    const time = setInterval(() => {
      if (componentCount >= arr.length) {
        // window.DataI.padeLoaded(renderWrapperId);
        clearInterval(time);
        if (!hookCode) return;
        const timer = setTimeout(() => {
          try {
            // 重写hook中使用的globalEventEmitter.on方法，用于切换页面时销毁hook中注册的监听事件
            const globalEventEmitter = Object.create(window.globalEventEmitter);
            globalEventEmitter.on = function (eventType, listener) {
              eventEmitterTask.addEvents(eventType, listener, renderWrapperId);

              return window.globalEventEmitter.addListener(eventType, listener);
            };
            const hookFunc = new Function('globalEventEmitter', 'appPageId', hookCode);

            const events: PageEvent[] = Object.entries((pageEvents as EventsCollection) ?? {}).map(([, evt]) => evt);

            if (events) {
              events
                .find(({ eventType }) => eventType === 'Hooks 执行前')
                ?.groups.flatMap(({ actions }) => actions)
                .forEach((act, _i, actions) => TriggerAction(act, { events, config: screenConfig, actions }));
            }
            !isMobile && addMapCallback(arr);
            hookFunc(globalEventEmitter, renderWrapperId); // 执行hook脚本

            if (events) {
              events
                .find(({ eventType }) => eventType === 'Hooks 执行后')
                ?.groups.flatMap(({ actions }) => actions)
                .forEach((act, _i, actions) => TriggerAction(act, { events, config: screenConfig, actions }));
            }

            // =====3. hook执行完毕 ====
            HookTask.hooks[renderWrapperId].competed();
            // v8.15： 执行缓存交互放在执行 hook 后
            executeActionsAfterChangePage();
          } catch (error) {
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

  // 页面组件渲染完后回调封装
  const pageComponentsLoaded = (cb: () => void) => {
    const arr = DataI.flatten(componentList); // 扁平化处理
    const time = setInterval(() => {
      if (componentCount >= arr.length) {
        clearInterval(time);
        cb && cb();
      }
    }, 300);
  };

  useEffect(() => {
    let messageListen: any;
    // 只有页面支持hook
    if (type === 'page') {
      // pageComponentsLoaded(() => {
      //   executeActionsAfterChangePage(); // 执行缓存交互
      // });

      (() => {
        const events: PageEvents = pageEvents;

        if (!events || screenConfig?.isMount) return;

        Object.entries(events)
          .find(([, { eventType }]) => eventType === '创建后')?.[1]
          .groups.flatMap(({ actions }) => actions)
          .forEach((act, _i, actions) => TriggerAction(act, { config: screenConfig, actions }));

        screenConfig.isMount = true;
      })();

      // v8.15：页面的监听浏览器事件
      ((listen) => {
        const events: PageEvents = pageEvents;
        if (!events) return;
        const event = Object.entries(events).find(([, { eventType }]) => eventType === '监听浏览器事件')?.[1];
        if (!event || !event.browserEventType) return;
        listen = (e) => {
          receiveMessage(e, event, null, (act: any, actions: any[]) => {
            TriggerAction(act, { config: screenConfig, actions });
          });
        };
        window.addEventListener('message', listen);
      })(messageListen);

      // =====1. 创建hook实例 ====
      HookTask.addHook(renderWrapperId);
      getHookJsonSettings(appId, renderWrapperId, version)
        .then((rs) => {
          if (Number(rs.code) !== 200) {
            return false;
          }
          if (!rs.data.dataJs) return pageComponentsLoaded(() => executeActionsAfterChangePage()); // 执行缓存交互 window.DataI.padeLoaded(renderWrapperId);
          let hookStr = '';
          try {
            const hookArr = JSON.parse(rs.data.dataJs); // 反转义

            hookArr.forEach((item) => {
              hookStr += `${item.content};`;
            });

            /**
             * 主页hook执行结束后发布事件(hook结束时机可以由用户自己控制，所以主页和其他页面的hook结束事件可以让用户自己调用onHookEndEvent进行派发，默认程序只在主页同步代码结束后去派发一次事件)
             * 事件名称 onHookEndEvent
             * 事件参数 hook所在页面的id
             */
            const hookEndEvent = 'window.globalEventEmitter.emit("onHookEndEvent",appPageId)';
            if (renderWrapperId === screenConfig.homePageId && !hookStr.includes('onHookEndEvent')) {
              // 用户如果自己控制hook结束时机(异步代码)，则程序中不再重新派发hook结束事件
              hookStr += `
${hookEndEvent};`; // 增加换行避免hook最后一句代码中有注释导致自定义的代码被注释掉
            }
          } catch (error) {
            hookStr = '';
            console.error(error);
          }
          // 替换桶名
          hookStr = hookStr
            ?.replaceAll('/${bucketName}/', `/${window.screenConfig.bucketName}/`)
            ?.replaceAll('/$[bucketName]/', `/${window.screenConfig.bucketName}/`);

          // =====2. hook加载完毕 ====
          HookTask.hooks[renderWrapperId].loaded();

          if (hookStr && hookStr !== ';') {
            if (
              renderWrapperId === screenConfig.homePageId || // 主页直接执行hook
              isChangeSubPage || // 跳转到子页面直接执行hook
              HookTask.hooks[screenConfig.homePageId]?.isCompeted // 如果主页已经执行完毕，则直接执行子页面hook
            ) {
              addHook(hookStr);
            } else {
              // 子页面监听主页hook执行完毕事件，主页hook执行完后再去执行子页hook
              window.globalEventEmitter.on('onHookEndEvent', (pageId) => {
                // console.log(`页面: ${pageId} hook执行完毕`);
                // 只有主页hook结束派发过来的事件才去执行其他页面的hook
                if (pageId === screenConfig.homePageId) {
                  addHook(hookStr);
                }
              });
            }
          } else {
            // v8.15: 执行缓存交互放在 hook 后
            pageComponentsLoaded(() => executeActionsAfterChangePage());
          }
          // else {
          //   window.DataI.padeLoaded(renderWrapperId);
          // }
        })
        .catch((error) => {
          console.error(error);
        });
    }

    return () => {
      messageListen && window.removeEventListener('message', messageListen);
    };
  }, [appId, renderWrapperId, type]);

  useEffect(() => {
    return () => {
      // sdk场景切换大屏的时候重置event emitter
      const removeFlag = window.location?.pathname?.includes('/visual-page-designer/');
      !removeFlag && isSdk && removeAllEventEmitterListeners();
    };
  }, []);

  const bindComList = () => {
    window.comList = {};
    window.comList.get = (key) => {
      return DataI.getComponentByKey(key);
    };
  };
  bindComList();

  if (window.dataStore === undefined || window.dataStore.length === 0) {
    window.dataStore = dataStore; // REVIEW liuming 判断条件要考虑第一次渲染和避免变量覆盖
  } else if (window.dataStore.length > 0 && dataStore.length > 0) {
    const firstInfo = dataStore[0];

    const isHave =
      window.dataStore.findIndex((child) => {
        return child.key === firstInfo.key;
      }) > -1;

    if (isHave) {
      window.dataStore.forEach((preInfo, idx) => {
        const currentGroup = dataStore.find((current) => current.key === preInfo.key);
        if (currentGroup) {
          window.dataStore[idx] = currentGroup;
        }
      });
    } else {
      window.dataStore = [...window.dataStore, ...dataStore];
    }
  }

  loadedDataStoreCallback && loadedDataStoreCallback(appId);

  if (window.layerList === undefined || window.layerList.length === 0) {
    window.layerList = componentList;
  } else if (window.layerList.length > 0 && componentList.length > 0) {
    const firstInfo = componentList[0];

    const isHave =
      window.layerList.findIndex((child) => {
        return child.key === firstInfo.key;
      }) > -1;

    if (isHave) {
      // sdk场景切换大屏的时候重置地图对象及event emitter
      !isMobile && resetMapCompInSdk(window.layerList, componentList);
    } else {
      window.layerList = [...window.layerList, ...componentList]; // sdk场景切换大屏的时候重置大屏的组件列表
    }
  }

  const setMapScale = useCallback((parentWraperId, innerHeights) => {
    const mapContainer = document.querySelector('[data-map=true]') as HTMLElement;
    if (mapContainer) {
      const mapParent = mapContainer.parentElement;
      const compStyleWidth = mapParent.clientWidth;
      const compStyleHeight = mapParent.clientHeight;
      try {
        const scaleStyle = computedScale(
          compStyleWidth,
          compStyleHeight,
          parentWraperId,
          screenConfigRef,
          innerHeights,
        );
        for (const key in scaleStyle) {
          if (Object.prototype.hasOwnProperty.call(scaleStyle, key)) {
            const value = scaleStyle[key];
            mapContainer.style[key] = key === 'width' || key === 'height' ? `${value}px` : value;
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const parentWraperId = customSdkSets?.parentWraperId;
    const innerHeights = window.innerHeight;
    window.addEventListener('resize', function (e) {
      // 地图容器
      setMapScale(parentWraperId, innerHeights);
    });
    if (parentWraperId) {
      const resizeComputeTime = customSdkSets?.resizeComputeTime ? customSdkSets.resizeComputeTime : 2000;
      const timer = setTimeout(() => {
        setMapScale(parentWraperId, innerHeights);
        clearTimeout(timer);
      }, resizeComputeTime);
    }
  }, [customSdkSets, setMapScale]);

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
        Array.isArray(uidTmp) && uidTmp.length > 0 && (layerUids = [...layerUids, ...uidTmp]);
      }
    });
    return layerUids;
  };

  let layerUidArr = []; // 所有的业务图层id
  let layerTreeComs = [];
  if (!isMobile) {
    layerTreeComs = findCompOfSameType('LayerTree', componentList); // 先找到图层树
    layerTreeComs.forEach((item) => {
      const tmpArr = getLayerUid(item.props.layerTree);
      Array.isArray(tmpArr) && tmpArr.length > 0 && (layerUidArr = [...layerUidArr, ...tmpArr]);
    });
  }

  /** 查找置顶组 */
  const topGroupList = findTopGroupList(componentList);

  const newRenderWrapperId = `screen-${renderWrapperId}`;

  return (
    <ScreenConfigContext.Provider value={screenConfigRef}>
      <Container compList={componentList} type={type} customSdkSets={customSdkSets} isMobile={isMobile}>
        <div id={newRenderWrapperId} style={{ position: 'absolute', left: 0, top: 0, height: '100%', zIndex }}>
          <Render
            list={componentList}
            screenConfig={screenConfigRef.current}
            compCount={compCount}
            topRender={false}
            isMobile={isMobile}
          />
          {layerUidArr.length > 0 && (
            <ServiceLayerRender
              screenConfig={screenConfigRef.current}
              compCount={compCount}
              layerTreeComs={layerTreeComs}
              layerUidArr={layerUidArr}
            />
          )}
          <LoadedLastComp loadedCallBack={loadedCallBack} renderWrapperId={appId} />
        </div>
        <Render
          list={topGroupList}
          screenConfig={screenConfigRef.current}
          compCount={compCount}
          topRender={true}
          isMobile={isMobile}
        />
      </Container>
    </ScreenConfigContext.Provider>
  );
};

export default RenderEngine;
