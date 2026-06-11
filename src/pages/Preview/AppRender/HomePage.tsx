/**
 * 主页面渲染
 */
import { unique } from '@/utils/common';
import { initInstance } from '@/utils/transformUtils';
import DataI from '@/utils/global-api';
import { dynamicLoadFont, dynamicLoadPlugins } from '@/utils/loadScript';
import { filter } from '@/utils/constant';
import React, { useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import shortid from 'short-uuid';
import { omit } from 'lodash';
import { PageEvents } from '@/staticJson/PageEvent';
import { compatibleEventSettings } from '@/utils/componentUtils';
import RenderEngine from '../Render/PageRender';
import { getAppPageInfo } from '../ajax';

const mapEvents = {
  MapFoundationPlan: '2DMapInstanceEvent',
  Map3DFoundationPlan: '3DMapInstanceEvent',
  MapGlFoundationPlan: 'glMapInstanceEvent',
};

const HomePage = (props) => {
  const {
    appType,
    appConfig,
    pageId,
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

  const EventEmitter = window.globalEventEmitter;

  console.log('页面Id', pageId, '----page', appConfig);
  const [pageInfo, setPageInfo] = useState(null); // 从接口获取的页面配置信息

  // 普通页加载地图子图层
  const renderMapLayers = (mapComponentList) => {
    // 普通页，加延时是为了确保主页地图已经加载
    const timer = setTimeout(() => {
      clearTimeout(timer);
      // 先销毁旧地图子组件和删除主页地图加的引用地图的子组件数据
      window.mapComponentList &&
        window.mapComponentList.forEach((map) => {
          const keys = [];
          map.layers.forEach((sub: any) => {
            keys.push(sub.key);
            sub.instance && sub.instance.destroy?.();
          });
          const mapComp = window.DataI.getComponentByKey(map.key); // 主页地图
          if (mapComp && mapComp.layers) {
            mapComp.layers = mapComp.layers.filter((v) => !keys.includes(v.key));
          }
        });
      mapComponentList.forEach((map) => {
        try {
          const mapComp = window.DataI.getComponentByKey(map.key); // 主页地图
          // 地图子组件生成 instance 且渲染地图子组件，如果主页地图被删除则不加载效果
          if (mapComp && map.layers) {
            if (mapComp.instance) {
              initInstance(mapComp, mapComp.instance, map.layers, 'referenceMap');
            } else {
              const listenFn = () => {
                const subTimer = setTimeout(() => {
                  // 延时为了等地图实例生成
                  clearTimeout(subTimer);
                  initInstance(mapComp, mapComp.instance, map.layers, 'referenceMap');
                }, 1000);
                EventEmitter.removeListener(mapEvents[mapComp.englishName], listenFn);
              };
              EventEmitter.on(mapEvents[mapComp.englishName], listenFn); // 监听地图组件的实例执行（事件是执行的时候触发并不是真正的加载完）
            }
          }
          if (mapComp.layers && map.layers) {
            mapComp.layers.push(...map.layers); // 引用地图的子组件数据加到主页地图上
          }
        } catch (error) {
          console.warn(error);
        }
      });
      // 普通页引用地图
      window.mapComponentList = mapComponentList || [];
    }, 1000);
  };

  // 获取页面配置信息
  const getPageInfo = async () => {
    // 统计页面加载开始时间
    // window.DataI.pageLoad(pageId);
    const id = pageId;
    const result = await getAppPageInfo({
      appId: appConfig.appId,
      appPageId: id,
      version,
    });
    if (Number(result.code) === 200 && result.data.jsonConfig) {
      try {
        const configInfo = JSON.parse(result.data.jsonConfig);

        configInfo.pageId = pageId;

        // v8.10 兼容旧屏没滤镜配置情况
        if (!configInfo.pageConfig.filter) {
          configInfo.pageConfig.filter = { ...filter };
        }

        // 当前页面的一级组件key
        const keySets = new Set(configInfo.componentList.map((com) => com.key));
        // 过滤出当前页面之外的其他组件
        const otherList = window.layerList.filter((com) => !keySets.has(com.key));
        // 合并组件放到组件列表
        window.layerList = [...otherList, ...configInfo.componentList];

        // 去重(可以去掉了)
        window.layerList = unique(window.layerList, 'key');

        // v8.3 存储页面 map 映射
        if (!DataI.PAGEINFOMAP[pageId]) {
          DataI.setPageInfoMap(pageId, {
            pageConfig: configInfo.pageConfig, // 目前只用到这个
          });
        }

        // 需要对组件列表进行深度遍历操作的都可以放到这个方法中
        DataI.each(configInfo.componentList, (component) => {
          // 组件树转为map映射
          DataI.setComInfoMap(component);

          // 兼容事件动作组
          const evts = component.eventSetings ?? [];
          component.eventSetings = compatibleEventSettings(evts);
        });

        const events: PageEvents = configInfo?.pageEvents ?? {};

        configInfo.pageEvents = Object.fromEntries(
          Object.entries(events).map(([key, evt]) => [
            key,
            {
              ...omit(evt, ['conditions', 'actions']),
              groups: evt.groups
                ? evt.groups
                : [
                    {
                      key: shortid.generate().toString(),
                      conditions: [],
                      actions: evt.actions?.map((act) => ({
                        ...act,
                        actionKey: act.actionKey ?? shortid.generate().toString(),
                      })),
                    },
                  ],
            },
          ]),
        );

        await dynamicLoadPlugins(configInfo.componentList);
        setPageInfo(configInfo);
        await dynamicLoadFont(configInfo.componentList, appConfig.fonts);
      } catch (error) {
        console.error(error);
      }
    } else {
      console.warn('当前页面无数据');
      setPageInfo({
        componentList: [],
      });
    }
    // v8.7 onreplacestate 切换应用先隐藏原应用 div, 数据请求到再显示
    if (window.appLoading) {
      window.appLoading = false;
      $('.screen-wrap').children().css({ display: 'block' });
    }
  };

  useEffect(() => {
    getPageInfo();
    return () => {};
  }, [pageId]);

  useEffect(() => {
    if (pageInfo && appConfig.homePageId !== pageId && !isMobile) {
      // 普通页加载地图子图层
      renderMapLayers(pageInfo.mapComponentList || []);
    }
  }, [pageInfo]);

  useEffect(() => {
    const loading = document.querySelector('#i-loading') as HTMLElement;
    if (loading && pageInfo) {
      loading.style.display = 'none';
      const endTime = performance.now();
      const loadTime = (endTime - (window as any).startTime) / 1000;

      console.log(`页面加载时间为：${loadTime.toFixed(2)} 秒`);

      console.log(appConfig);
      window.parent.postMessage({
        type: 'pageLoadInfo',
        data: { loadTime: loadTime.toFixed(2), pageHeight: Number.parseInt(appConfig.height) },
      });
    }
    return () => {};
  }, [pageInfo]);

  return (
    <>
      {pageInfo?.pageId === pageId && (
        <RenderEngine
          appConfig={appConfig}
          renderWrapperId={pageId}
          type={appType}
          pageInfo={pageInfo}
          loadedCallBack={loadedCallBack}
          loadedDataStoreCallback={loadedDataStoreCallback}
          customSdkSets={customSdkSets}
          dataStore={dataStore}
          zIndex={zIndex} // 控制页面的层级
          isChangeSubPage={isChangeSubPage}
          version={version}
          isSdk={isSdk}
          isMobile={isMobile}
        />
      )}
    </>
  );
};
export default HomePage;
