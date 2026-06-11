/**
 * 应用渲染入口
 */
import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import $ from 'jquery';
import {
  GetQueryString,
  rewriteReplaceState,
  rewriteHttpRequest,
  getGwShareCookie,
  clearPendingXhrList,
} from '@/utils/BrowserUtils';
import EventEmitter from '@/utils/eventBus';
import RemoteControlWebSocket from '@/utils/RemoteControlWebSocket';
import {
  dynamicLoadCommon,
  dynamicLoadPreSource,
  dynamicLoadFont,
  dynamicLoadPlugins,
  dynamicLoadDataiComponents,
  dynamicLoadMobileLibrary,
} from '@/utils/loadScript';
import { ConfigProvider, message } from 'antd';
import { compatibleNativeFun } from '@/utils/transformUtils';
import { compatibleEventSettings } from '@/utils/componentUtils';
import { fetchXToken } from '@/utils/aksk';
import { getImageUrl } from '@/utils/utils';
import zhCN from 'antd/es/locale/zh_CN';
import DataI from '@/utils/global-api';
import LogApp from '@/components/LogApp/index';
import timer from '@/common/Dispatch/TimerTask';
import eventEmitter from '@/common/Dispatch/EventEmitterTask';
import { getComp } from '@/TriggerAction/updateData/config';
import { clickEvent } from '@/EventHandlers/AnimateEvent';
import {
  getInfoById,
  getConfigInfo,
  oldPageToApp,
  getLayerInfoById,
  getMarketCardInfoById,
  getCardInfoByUid,
  getCardInfoById,
} from '../ajax';
import '@yl/datai-visual-component-library/es/css/dataiDesign.css';
import '@/styles/index.less'; // 适配布局设计器
import HomePage from './HomePage';
import SubPage from './SubPage';
import RenderEngine from '../Render/PageRender';
import Share from '../../../Share';
import './index.less';

interface AppRenderProp {
  /**
   * 应用ID
   */
  id: string;
  /**
   * 页面ID
   */
  appPageId?: string;
  /**
   * 子页面ID，仅应用使用，单页面和sdk不适用
   */
  subPageId?: string;
  /**
   * 应用类型 页面page 卡片card 业务图层layer
   */
  type: string;
  /**
   * 请求前缀
   */
  requestPrefix?: string;
  /**
   * 多级路径部署路径
   */
  runtimePublicPath?: string;
  /**
   * 是否布局设计器中使用SDK
   */
  fromSdk?: string;
  /**
   * 梧桐空间key
   */
  nsKey?: string;
  /**
   * 卡片自适应
   */
  adaptionId: string;
  /**
   * 卡片自适应
   */
  adapteByHeight: any;
  customSdkSets?: Record<string, any>;
  /**
   * 是否是SDK渲染
   */
  isSdk: boolean;
  /**
   * 版本号
   */
  version?: string;
  /**
   * 页面加载完毕回调
   */
  loadedCallBack?: (id) => void;
  /**
   * 变量加载完毕回调
   */
  loadedDataStoreCallback?: () => void;
}

export default function AppRender(props: AppRenderProp) {
  compatibleNativeFun(); // 兼容部分低版本浏览器不支持js语法

  const {
    id: appId,
    type: appType,
    appPageId,
    // v8.2.1新增路径参数
    subPageId,
    requestPrefix,
    runtimePublicPath,
    fromSdk,
    nsKey,
    loadedCallBack,
    customSdkSets,
    loadedDataStoreCallback,
    adaptionId,
    adapteByHeight,
    isSdk,
    version,
  } = props;
  const [appInfo, setAppInfo] = useState(null); // 从接口获取的页面配置信息
  const [allowPage, setAllowPage] = useState(true);

  // console.log('appId:', appId, 'appType:', appType, 'pageId', appPageId, '----app');

  // 事件总线
  if (!window.globalEventEmitter) {
    window.globalEventEmitter = EventEmitter; // 全局挂载事件行为
  }
  // 支持设置请求前缀
  window.requestPrefix = requestPrefix || '../api';
  // 是否是布局设计器中使用SDK(布局设计器中有子路径)
  window.fromSdk = fromSdk;
  // 支持多级目录部署
  if (runtimePublicPath) {
    window.publicPath = runtimePublicPath;
  } else {
    window.publicPath = process.env.NODE_ENV === 'development' ? '/' : './'; // 前端静态资源默认存储位置
  }
  // 梧桐空间key
  !!nsKey && (window.wutongNsKey = nsKey);

  // v8.0 分享功能安全认证
  const share = GetQueryString('share');
  if (share) {
    sessionStorage.share = share;
    // 下面这些会放在接口请求头里
    if (!sessionStorage.gwShareKey) {
      const arr = getGwShareCookie();
      sessionStorage.gwShareKey = arr[0];
      sessionStorage.gwShareVal = arr[1];
    }
  }

  // 获取应用配置
  const getAppConfig = useCallback(
    async (clear = false, success?: (data: any, systemConfig: any) => void) => {
      console.log('getAppConfig 开始调用', { clear, appId, appType, version });
      let currentId = appId;
      let currentType = appType;
      // 兼容使用 replacestate 切换页面时不刷新浏览器 需要使用 GetQueryString 获取当前id
      if (clear) {
        currentId = GetQueryString('id');
        currentType = GetQueryString('type');
        window.dataStore = [];
        window.screenConfig = undefined;
        window.comList = undefined;
        window.servicelayerList = undefined;
        window.servicelayerSearchList = undefined;
        window.initParams = undefined;
        window.layerList = [];
        window.logList = [];
      }

      console.log('当前配置信息:', { currentId, currentType, version });

      let result = null;
      let tips = '';
      switch (currentType) {
        case 'page': {
          console.log('调用 getInfoById 接口');
          result = await getInfoById(currentId, version);
          console.log('getInfoById 返回:', result);
          tips = '该应用暂未配置!';

          break;
        }
        case 'layer': {
          result = await getLayerInfoById(currentId);
          tips = '该业务图层暂未配置!';

          break;
        }
        case 'card': {
          tips = '该卡片暂未配置!';
          const src = GetQueryString('src');
          if (src === 'market') {
            result = await getMarketCardInfoById(currentId);
          } else if (currentId.length > 5) {
            result = await getCardInfoByUid(currentId);
          } else {
            result = await getCardInfoById(currentId);
          }

          break;
        }
        default: {
          break;
        }
      }

      try {
        if (result && Number(result.code) === 200) {
          const { jsonConfig, homePageId, isApp } = result.data;
          console.log('解析配置数据:', { jsonConfig: !!jsonConfig, homePageId, isApp });
          if (!jsonConfig) {
            window.screenConfig = {};
            setAppInfo({
              appConfig: null,
              componentList: [],
              dataStore: [],
              screenConfig: {},
            });
            return message.warning(tips);
          }
          const configInfo = JSON.parse(jsonConfig);
          console.log('configInfo 解析结果:', {
            hasAppConfig: !!configInfo.appConfig,
            hasComponentList: (configInfo.componentList || []).length > 0,
            hasDataStore: (configInfo.dataStore || []).length > 0,
            hasScreenConfig: !!configInfo.screenConfig
          });
          const appConfig = configInfo.appConfig || {};
          const componentList = configInfo.componentList || [];
          const dataStore = configInfo.dataStore || [];
          const screenConfig = configInfo.screenConfig || {};
          let isMobile = false;
          if (appConfig.scale === 'scaleWidth') {
            isMobile = true;
          }
          console.log('组件数量:', componentList.length, '数据类型:', currentType, 'isApp:', isApp, 'homePageId:', homePageId);

          if (adaptionId) {
            screenConfig.adaptionId = adaptionId; // 卡片SDK
            screenConfig.adapteByHeight = adapteByHeight; // 是否按照高度适配，默认是宽度
          }

          // 预览界面首先获取租户和桶名，兼容跨租户跨环境导入大屏、自定义组件、卡片、oss资源时不进入配置页保存直接预览的操作
          let configs: any = {};
          let systemConfig: any = {};
          try {
            const configResult = await getConfigInfo();
            if (configResult && configResult.data) {
              configs = configResult.data.configs || {};
              systemConfig = configResult.data.systemConfig || {};
            }
          } catch (error) {
            console.error('获取配置信息失败:', error);
          }
          if (currentType === 'page') {
            appConfig.bucketName = systemConfig?.bucketName;
            appConfig.tenantId = systemConfig?.tenantId;
            appConfig.ossProxy = systemConfig?.ossProxy;
            appConfig.appId = currentId;
            appConfig.homePageId = homePageId;
            // 添加组件库期望的默认属性
            appConfig.scrollBarStyles = appConfig.scrollBarStyles || { size: 6, bgColor: 'rgba(0,0,0,0.2)' };
            appConfig.fontSize = appConfig.fontSize || '14px';
            appConfig.mouseType = appConfig.mouseType || 1;
            // 挂载appConfig，在页面中和pageConfig合并生成screenConfig
            window.screenConfig = appConfig;
          } else {
            screenConfig.bucketName = systemConfig?.bucketName;
            screenConfig.tenantId = systemConfig?.tenantId;
            screenConfig.ossProxy = systemConfig?.ossProxy;
            screenConfig.appId = currentId;
            // 添加组件库期望的默认属性
            screenConfig.scrollBarStyles = screenConfig.scrollBarStyles || { size: 6, bgColor: 'rgba(0,0,0,0.2)' };
            screenConfig.fontSize = screenConfig.fontSize || '14px';
            screenConfig.mouseType = screenConfig.mouseType || 1;
            window.screenConfig = screenConfig;
          }

          // 动态设置全局滚动条样式
          if (window.screenConfig.scrollbar) {
            const { size, bgColor } = window.screenConfig.scrollbar;
            const element = document.querySelector('.datai-visual-sdk') as HTMLDivElement;
            element.style.setProperty('--yl-scrollbar-size', `${size}px`);
            element.style.setProperty('--yl-scrollbar-thumb-color', `${bgColor}`);
          }

          if (typeof success === 'function') success(result.data, systemConfig);

          if (window.screenConfig?.mouseType === undefined) {
            window.screenConfig.mouseType = 1;
          }

          window.layerList = [];

          // 是否显示“指标”数据源类型
          let showIndicator = false;
          if (
            configs && configs.indicator &&
            systemConfig && systemConfig.showIndicatorTenant &&
            Array.isArray(systemConfig.showIndicatorTenant) &&
            systemConfig.showIndicatorTenant.includes(systemConfig.tenantId || 'default')
          ) {
            showIndicator = true;
          }
          /* if (showIndicator) {
            // v7.11 新增，获取指标接口需要的 x-token
            fetchXToken(systemConfig?.indicatorKeyId, systemConfig?.indicatorJavaPrivateKey);
          } */

          try {
            console.log('开始加载通用资源...');
            await dynamicLoadCommon();
            console.log('通用资源加载完成');
            // console.log('appConfig.preLoadResources***22', appConfig?.preLoadResources);
            if (appConfig.preLoadResources && appConfig.preLoadResources.length > 0) {
              await dynamicLoadPreSource(appConfig.preLoadResources);
            }

            if (GetQueryString('type') === 'card' && GetQueryString('share') === 'true') {
              await dynamicLoadPreSource(['libs/ue/ue-close-card.js']);
            }

            if (isMobile) {
              await dynamicLoadMobileLibrary();
            } else {
              console.log('开始加载 datai 组件库...');
              await dynamicLoadDataiComponents();
              console.log('datai 组件库加载完成');
            }

            if (currentType !== 'page') {
              // page 类型的应用当前接口不会返回组件列表，调用这个接口也不会加载插件
              await dynamicLoadPlugins(componentList);
            }
            console.log('所有资源加载完成，准备渲染');
          } catch (loadError) {
            console.error('动态加载资源失败:', loadError);
            message.error('加载资源失败，请刷新页面重试');
            return;
          }

          if (currentType === 'page') {
            // console.log(appConfig);
            if (isApp && homePageId) {
              // 脏数据处理
              let colorStr = appConfig.screenBackground;
              if (!colorStr || !colorStr.includes('-')) {
                colorStr = 'to bottom-#0d1117-#0d1117';
              }
              const colorList = colorStr.split('-');
              setAppInfo({
                homePageId,
                appConfig,
                componentList,
                dataStore,
                pageStyles: {
                  position: 'relative',
                  width: `${appConfig.width}px`,
                  height: `${appConfig.height}px`,
                  overflow: 'hidden',
                  background: appConfig.screenBackgroundImage
                    ? `url("${getImageUrl(appConfig.screenBackgroundImage)}")  center center / 100% 100%  no-repeat ${
                        colorList.length === 3 && colorList[1] === colorList[2] ? colorList[1] : ''
                      }`
                    : `linear-gradient(${colorList.join(',')})`,
                },
                isMobile,
              });
              console.log('setAppInfo 已调用 - 新版应用', { homePageId, componentListLength: componentList.length });
            } else {
              // 老大屏 - 直接使用返回的数据渲染，不调用 oldPageToApp
              console.log('老大屏数据:', result.data);

              // 如果 componentList 为空，尝试使用 screenConfig 中的数据
              let renderComponentList = componentList;
              let renderDataStore = dataStore;

              // 如果没有 componentList，尝试从 screenConfig 中获取
              if (!renderComponentList || renderComponentList.length === 0) {
                console.warn('componentList 为空，尝试其他方式获取组件');
              }

              // 直接渲染老大屏
              setAppInfo({
                homePageId,
                appConfig,
                componentList: renderComponentList,
                dataStore: renderDataStore,
                pageStyles: {
                  position: 'relative',
                  width: `${screenConfig.width || appConfig.width || 1920}px`,
                  height: `${screenConfig.height || appConfig.height || 1080}px`,
                  overflow: 'hidden',
                  background: screenConfig.backgroundColor || appConfig.screenBackground || '#040C1F',
                },
                isMobile,
              });
              console.log('setAppInfo 已调用 - 老大屏', { homePageId, componentListLength: renderComponentList.length });
            }
          } else {
            DataI.each(componentList, (component) => {
              // 组件树转为map映射
              DataI.setComInfoMap(component);

              // 兼容事件动作组
              const evts = component.eventSetings ?? [];
              component.eventSetings = compatibleEventSettings(evts);
            });
            setAppInfo({
              screenConfig,
              componentList,
              dataStore,
            });
            console.log('setAppInfo 已调用 - 其他类型', { componentListLength: componentList.length });
          }
          if (currentType !== 'page') {
            await dynamicLoadFont(componentList);
          }
        } else if (Number(result?.code) === 10001006) {
          // 页面 id 不可访问
          setAllowPage(false);
        }
      } catch (error) {
        console.error(error);
      }
    },
    [adaptionId, props, version],
  );

  // 获取大屏信息
  useEffect(() => {
    let rcSocket: RemoteControlWebSocket;

    getAppConfig(false, (data, systemConfig) => {
      if (appType === 'page') {
        // 初始化 webSocket 连接
        const { remoteControlType, remoteControlledAppId, remoteControlledEnabled } = data;
        const { ns, tenantId } = systemConfig;
        const host = process.env.NODE_ENV === 'development' ? '172.26.30.146:39632' : window.location.host;
        const protocol = window.location.protocol === 'http:' ? 'ws' : 'wss';
        const url = `${protocol}://${host}/websocket/remoteControl/${appId}/${ns}/${tenantId}`;
        if (remoteControlType === 1) {
          // 控制端
          rcSocket = RemoteControlWebSocket.getInstance(url, { targetAppId: remoteControlledAppId });
        } else if (remoteControlType === 0 && remoteControlledEnabled) {
          // 被控端
          rcSocket = RemoteControlWebSocket.getInstance(url, {
            onMessage: (msg) => {
              console.log({ msg });
              try {
                const payload = JSON.parse(msg);
                const { compKey, eventName, eventParams } = payload;
                const comp = getComp(compKey);
                if (!comp) {
                  console.error('component not found:', compKey);
                  return;
                }
                const params = JSON.parse(eventParams);
                switch (eventName) {
                  case 'click': {
                    clickEvent(comp.eventSetings, window.screenConfig, comp);
                    break;
                  }
                  case 'changeValue': {
                    if (comp.classType === 'antd') {
                      comp.compRef?.current?.onChange(params);
                    } else {
                      comp.instance.onChange(params);
                    }
                    break;
                  }
                  default: {
                    break;
                  }
                }
              } catch (error) {
                console.error(error);
              }
            },
          });
        }
      }
    });

    return () => {
      if (rcSocket) rcSocket.close();
    };
  }, []);

  // 设置标题、favicon 和隐藏 loading
  useEffect(() => {
    if (appInfo) {
      const loading = document.querySelector('#i-loading') as HTMLElement;
      const config = appInfo.screenConfig || appInfo.appConfig;
      // 隐藏 loading 页面
      if (loading) {
        loading.style.display = 'none';
      }

      let { title } = config;
      const { favicon } = config;
      // 兼容老大屏
      if (title === '云粒数智可视化大屏' || !title) {
        title = '面向数字孪生的低代码平台';
      }
      const titleDom = document.querySelector('#datai-title') as HTMLTitleElement;
      titleDom && (titleDom.innerHTML = title);
      const favDom = document.querySelector('#datai-favicon') as HTMLLinkElement;
      favDom && (favDom.href = getImageUrl(favicon || '/assets/datai/icons/favicon.ico'));
    }
  }, [appInfo]);

  // 处理某些情况导致的没有走loadedCallBack，补充完成，保证加载队列不被中断
  useEffect(() => {
    if (allowPage) {
      if (appInfo && appInfo.componentList.length === 0 && appType !== 'page') {
        // console.log('loadedCallBack');
        loadedCallBack && loadedCallBack(appId);
      }
    } else {
      loadedCallBack && loadedCallBack(appId);
    }
  }, [allowPage, appId, appInfo, appType, loadedCallBack]);

  // v7.7 监听前进、后退、history.replaceState 跳转，然后强制重新渲染组件（避免子组件有逻辑放在初始化执行）
  window.addEventListener('popstate', function (event) {
    clearPendingXhrList();
    window.globalEventEmitter?.emit('changePage', event);
    // SDK场景下不做处理
    if (!isSdk) {
      getAppConfig(true);
    }
  });
  (window.history as any).onreplacestate = function (event) {
    // console.log('event', event);
    // v8.2.1 修改页面参数不做处理
    if (event?.state?.target === '_router') {
      return;
    }
    // 清除定时任务
    timer.removeAllTask('');
    // 清除事件监听器(hook中注册的)
    eventEmitter.removeAllEvents();
    clearPendingXhrList();
    window.stop(); // 能够阻止图片、新窗口、和一些会延迟加载的对象的加载
    window.appLoading = true;
    $('.screen-wrap').children().css({ display: 'none' });
    window.globalEventEmitter?.emit('changePage', event);
    // SDK场景下不做处理
    if (!isSdk) {
      // window.DataI.pageLoad(GetQueryString('id'));
      getAppConfig(true);
    }
  };

  const globaProps = {
    loadedCallBack,
    loadedDataStoreCallback,
    customSdkSets,
  };

  const Layout = (_allowPage, _appInfo) => {
    console.log('Layout 渲染:', { _allowPage, appType, hasAppInfo: !!_appInfo, appInfoKeys: _appInfo ? Object.keys(_appInfo) : [] });

    if (_allowPage) {
      if (_appInfo && appType === 'page') {
        console.log('Layout - page 类型:', {
          hasHomePageId: !!_appInfo.homePageId,
          homePageId: _appInfo.homePageId,
          hasAppConfig: !!_appInfo.appConfig,
          hasComponentList: !!_appInfo.componentList,
          componentListLength: _appInfo.componentList?.length || 0
        });
        return (
          <div className='screen-wrap' style={{ ...appInfo.pageStyles, width: '100%', height: '100%' }}>
            <ConfigProvider locale={zhCN}>
              {/* 主页 - 新版应用 */}
              {appInfo.homePageId && !appPageId && (
                <HomePage
                  appType={appType}
                  appConfig={appInfo.appConfig}
                  pageId={appInfo.homePageId}
                  zIndex={9}
                  dataStore={_appInfo.dataStore}
                  isHome={true}
                  version={version}
                  isMobile={appInfo.isMobile}
                  {...globaProps}
                />
              )}
              {/* 子页 - 新版应用 */}
              {appInfo.appConfig && appInfo.homePageId && (
                <SubPage
                  appType={appType}
                  appConfig={appInfo.appConfig}
                  pageId={appPageId}
                  subPageId={subPageId}
                  isSdk={isSdk}
                  version={version}
                  zIndex={10}
                  dataStore={_appInfo.dataStore}
                  isMobile={appInfo.isMobile}
                  {...globaProps}
                />
              )}
              {/* 老大屏渲染 - 当没有 homePageId 时，使用 RenderEngine 渲染 */}
              {(!appInfo.homePageId || appInfo.homePageId === '') && _appInfo.componentList && _appInfo.componentList.length > 0 && (
                <RenderEngine
                  appConfig={_appInfo.appConfig || _appInfo.screenConfig}
                  renderWrapperId={appId}
                  type={appType}
                  pageInfo={appInfo}
                  dataStore={_appInfo.dataStore}
                  {...globaProps}
                />
              )}
              <LogApp />
            </ConfigProvider>
          </div>
        );
      }
      if (_appInfo && _appInfo.componentList && _appInfo.componentList.length > 0 && appType !== 'page') {
        console.log('Layout - 非 page 类型渲染 RenderEngine');
        return (
          <div className='screen-wrap'>
            <ConfigProvider locale={zhCN}>
              <RenderEngine
                appConfig={_appInfo.screenConfig}
                renderWrapperId={appId}
                type={appType}
                pageInfo={appInfo}
                dataStore={_appInfo.dataStore}
                {...globaProps}
              />
              <LogApp />
            </ConfigProvider>
          </div>
        );
      }
      // 添加兜底渲染
      console.log('Layout - 兜底渲染条件:', {
        hasAppInfo: !!_appInfo,
        hasComponentList: !!_appInfo?.componentList,
        componentListLength: _appInfo?.componentList?.length,
        appType
      });
      if (_appInfo && _appInfo.componentList && _appInfo.componentList.length > 0) {
        console.log('Layout - 兜底渲染 RenderEngine');
        return (
          <div className='screen-wrap'>
            <ConfigProvider locale={zhCN}>
              <RenderEngine
                appConfig={_appInfo.appConfig || _appInfo.screenConfig || {}}
                renderWrapperId={appId}
                type={appType}
                pageInfo={appInfo}
                dataStore={_appInfo.dataStore || []}
                {...globaProps}
              />
              <LogApp />
            </ConfigProvider>
          </div>
        );
      }
    } else {
      return <Share errorCode='405' />;
    }
  };

  return <div className='datai-visual-sdk'>{Layout(allowPage, appInfo)}</div>;
}
