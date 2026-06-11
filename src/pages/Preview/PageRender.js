/**
 * 老大屏、业务图层、卡片渲染入口
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GetQueryString,
  rewriteReplaceState,
  rewriteHttpRequest,
  getGwShareCookie,
  clearPendingXhrList,
} from '@/utils/BrowserUtils';
import EventEmitter from '@/utils/eventBus';
import {
  getScreenSDKVersion,
  dynamicLoadCommon,
  dynamicLoadPreSource,
  dynamicLoadFont,
  dynamicLoadPlugins,
  dynamicLoadDataiComponents,
  // dynamicLoadGIS,
  // dynamicLoadVideoSource
} from '@/utils/loadScript';
import { notification, ConfigProvider } from 'antd';
import { compatibleNativeFun } from '@/utils/transformUtils';
import { fetchXToken } from '@/utils/aksk';
import zhCN from 'antd/es/locale/zh_CN';
import RenderEngine from './Render';
import Share from '../../Share';
import {
  getSDKVersion,
  getInfoById,
  getLayerInfoById,
  getCardInfoById,
  getMarketCardInfoById,
  getCardInfoByUid,
  getConfigInfo,
} from './ajax';
import '@yl/datai-visual-component-library/es/css/dataiDesign.css';
import '@/styles/index.less'; // 适配布局设计器

// v7.4 防止window.screenConfig覆盖
const computedScale = (compW, compH, parentWraperId, tempScreenConfigRef) => {
  let scaleStyle = {};
  const width = parentWraperId ? document.querySelector(`${parentWraperId}`).clientWidth : document.body.clientWidth;
  const height = parentWraperId ? document.querySelector(`${parentWraperId}`).clientHeight : document.body.clientHeight; // 获取屏幕宽高
  const w = tempScreenConfigRef.current?.width ?? 1920;
  const h = tempScreenConfigRef.current?.height ?? 1080; // 获取设置的大屏容器宽高
  const compWidth = compW;
  const compHeight = compH;
  const xScale = (width / w).toFixed(4) / 1; // 计算正向x缩放比例
  const yScale = (height / h).toFixed(4) / 1; // 计算正向y缩放比例
  const reXScale = (w / width).toFixed(4) / 1; // 计算反向x缩放比例
  const reYScale = (h / height).toFixed(4) / 1; // 计算反向y缩放比例

  if (tempScreenConfigRef.current?.scale === 'scale') {
    scaleStyle = {
      transform: `scaleX(${reXScale}) scaleY(${reYScale})`,
      transformOrigin: 'left top',
      width: `${Number.parseInt(compWidth) * xScale}px`,
      height: `${Number.parseInt(compHeight) * yScale}px`,
    };
  } else if (tempScreenConfigRef.current?.scale === 'scaleWidth') {
    scaleStyle = {
      transform: `scaleX(${reXScale})`,
      transformOrigin: 'left top',
      height: `${Number.parseInt(compHeight) * xScale}px`,
    };
  } else if (tempScreenConfigRef.current?.scale === 'scaleHeight') {
    scaleStyle = {
      transform: `scaleY(${reYScale})`,
      transformOrigin: 'left top',
      width: `${Number.parseInt(compWidth) * yScale}px`,
    };
  }
  return scaleStyle;
};

const RenderByType = (props) => {
  compatibleNativeFun(); // 兼容部分低版本浏览器不支持js语法
  const id = GetQueryString('id') || props.id;
  const type = GetQueryString('type') || props.type;

  const screenConfigRef = useRef({}); // 多SDK防止screenConfig覆盖

  const [pageConfig, setPageConfig] = useState({ componentList: [] }); // 从接口获取的页面配置信息
  const [allowPage, setAllowPage] = useState(true);

  // 卡片自适应父容器
  const { adaptionId, adapteByHeight } = props;
  // 支持设置请求前缀
  const { requestPrefix } = props;
  window.requestPrefix = requestPrefix || '../api';
  // 支持多级目录部署
  const { runtimePublicPath } = props;
  window.fromSdk = props.fromSdk; // 是否是布局设计器中使用SDK(布局设计器中有子路径)
  if (runtimePublicPath) {
    window.publicPath = runtimePublicPath;
  } else {
    window.publicPath = process.env.NODE_ENV === 'development' ? '/' : './'; // 前端静态资源默认存储位置
  }
  // 事件总线
  if (!window.globalEventEmitter) {
    window.globalEventEmitter = EventEmitter; // 全局挂载事件行为
  }

  // window.dataStore = undefined; // SDK场景
  // 判断是否清除dataStore
  const { clearDataStore } = props;
  if (clearDataStore) {
    window.dataStore = [];
  }

  // 卡片渲染完毕回调
  const { loadedCallBack } = props;
  // sdk其他参数
  const { customSdkSets } = props;
  //
  const { loadedDataStoreCallback } = props;
  // 梧桐空间key
  const { nsKey } = props;
  !!nsKey && (window.wutongNsKey = nsKey);

  // 完善比较版本号
  const compareVersion = (currentVersion, screenSdkVersion) => {
    const version = currentVersion.split('.');
    const recommend = screenSdkVersion.split('.');
    for (let i = 0; i < recommend.length; ) {
      if (version[i] < recommend[i]) {
        return false;
      }
      if (version[i] > recommend[i]) {
        return true;
      }
      if (i < recommend.length - 1) {
        i++;
      } else {
        return true;
      }
    }
  };

  // 先只在SDK的场景下加升级提示
  if (props.type === 'page') {
    getSDKVersion()
      .then((res) => {
        const { data } = res;
        const { screenSdkVersion } = data;
        const currentVersion = getScreenSDKVersion();
        if (!compareVersion(currentVersion, screenSdkVersion)) {
          notification.open({
            getContainer: () => document.querySelector('.datai-visual-sdk'), // 避免升级提示框被挡住
            message: '升级通知',
            description: `请把大屏SDK更新到${screenSdkVersion}及以上版本`,
          });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

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

  const getSettings = useCallback(
    async (clear = false) => {
      try {
        const currentId = GetQueryString('id') || props.id;
        const currentType = GetQueryString('type') || props.type;
        let rs = null;
        if (currentType === 'page') {
          rs = await getInfoById(currentId);
        } else if (currentType === 'layer') {
          rs = await getLayerInfoById(currentId);
        } else if (currentType === 'card') {
          const src = GetQueryString('src');
          if (src === 'market') {
            rs = await getMarketCardInfoById(currentId);
          } else if (currentId.length > 5) {
            rs = await getCardInfoByUid(currentId);
          } else {
            rs = await getCardInfoById(currentId);
          }
        }
        if (rs && Number(rs.code) === 200) {
          const jsonConfig = rs.data.jsonConfig || '{}'; // 兼容没有任何配置的情况
          const code = jsonConfig;
          const codeObject = JSON.parse(code);
          const screenConfig = codeObject.screenConfig || {};
          const componentList = codeObject.componentList || [];
          const dataStore = codeObject.dataStore || [];
          const gridLayoutList = codeObject.gridLayoutList || [];

          if (adaptionId) {
            screenConfig.adaptionId = adaptionId; // 卡片SDK
            screenConfig.adapteByHeight = adapteByHeight; // 是否按照高度适配，默认是宽度
          }

          // 预览界面首先获取租户和桶名，兼容跨租户跨环境导入大屏、自定义组件、卡片、oss资源时不进入配置页保存直接预览的操作

          const {
            data: { configs, systemConfig },
          } = await getConfigInfo();
          screenConfig.bucketName = systemConfig?.bucketName;
          screenConfig.tenantId = systemConfig?.tenantId;
          screenConfig.ossProxy = systemConfig?.ossProxy;

          // 是否显示“指标”数据源类型
          let showIndicator = false;
          if (
            configs.indicator &&
            systemConfig?.showIndicatorTenant &&
            systemConfig.showIndicatorTenant.includes(systemConfig.tenantId || 'default')
          ) {
            showIndicator = true;
          }
          /* if (showIndicator) {
            // v7.11 新增，获取指标接口需要的 x-token
            fetchXToken(systemConfig?.indicatorKeyId, systemConfig?.indicatorJavaPrivateKey);
          } */

          await dynamicLoadCommon();
          // console.log('screenConfig.preLoadResources**111', screenConfig?.preLoadResources);
          if (screenConfig.preLoadResources && screenConfig.preLoadResources.length > 0) {
            await dynamicLoadPreSource(screenConfig.preLoadResources);
          }

          if (GetQueryString('type') === 'card' && GetQueryString('share') === 'true') {
            await dynamicLoadPreSource(['libs/ue/ue-close-card.js']);
          }

          await dynamicLoadDataiComponents();
          await dynamicLoadPlugins(componentList);
          await dynamicLoadFont(componentList);

          if (clear) {
            window.globalEventEmitter?.removeAllListeners();
            window.testChart = null;
            window.dataStore = [];
            window.screenConfig = undefined;
            window.girdLayoutList = undefined;
            window.comList = undefined;
            window.servicelayerList = undefined;
            window.servicelayerSearchList = undefined;
            window.initParams = undefined;
            window.layerList = [];
            window.logList = [];
          }

          setPageConfig({
            screenConfig,
            componentList,
            dataStore,
            gridLayoutList,
          });
          await dynamicLoadFont(componentList);
        } else if (Number(rs?.code) === 10001006) {
          // 页面 id 不可访问
          setAllowPage(false);
        }
      } catch (error) {
        console.error(error);
      }
    },
    [adaptionId, props],
  );

  useEffect(() => {
    getSettings(false);
  }, [getSettings]);

  useEffect(() => {
    const loading = document.querySelector('#i-loading');
    if (loading && Object.prototype.hasOwnProperty.call(pageConfig, 'screenConfig')) {
      loading.style.display = 'none';
    }
  }, [pageConfig]);

  const setMapScale = useCallback((parentWraperId) => {
    const mapContainer = document.querySelector('[data-map=true]');
    if (mapContainer) {
      const mapParent = mapContainer.parentElement;
      const compStyleWidth = mapParent.clientWidth;
      const compStyleHeight = mapParent.clientHeight;
      try {
        const scaleStyle = computedScale(compStyleWidth, compStyleHeight, parentWraperId, screenConfigRef);
        for (const key in scaleStyle) {
          if (Object.prototype.hasOwnProperty.call(scaleStyle, key)) {
            const value = scaleStyle[key];
            if (key === 'width' || key === 'height') {
              mapContainer.style[key] = `${value}px`;
            } else {
              mapContainer.style[key] = value;
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, []);

  useEffect(() => {
    const parentWraperId = customSdkSets?.parentWraperId;
    window.addEventListener('resize', function (e) {
      // 地图容器
      setMapScale(parentWraperId);
    });
    if (parentWraperId) {
      const resizeComputeTime = customSdkSets?.resizeComputeTime ? customSdkSets.resizeComputeTime : 2000;
      const timer = setTimeout(() => {
        setMapScale(parentWraperId);
        clearTimeout(timer);
      }, resizeComputeTime);
    }
  }, [customSdkSets, setMapScale]);

  if (!window.history.rewriteReplaceState) {
    // 重写 State
    rewriteReplaceState();
    // 重写 xhr， 布局页面是 true, 自定义页面是 false
    rewriteHttpRequest(!!props.id);
  }
  // v7.7 监听前进、后退、history.replaceState 跳转，然后强制重新渲染组件（避免子组件有逻辑放在初始化执行）
  window.onpopstate = function (event) {
    clearPendingXhrList();
    window.globalEventEmitter?.emit('changePage', event);
    // SDK场景下不做处理
    if (!props.id) {
      getSettings(true);
    }
  };
  window.history.onreplacestate = function (event) {
    // console.log('event', event);
    // v8.2.1 修改页面参数不做处理
    if (event?.state?.target === '_router') {
      return;
    }
    clearPendingXhrList();
    window.globalEventEmitter?.emit('changePage', event);
    // SDK场景下不做处理
    if (!props.id) {
      getSettings(true);
    }
  };
  // window.addEventListener('load', (event) => {
  //   console.log('window page is fully loaded', event);
  // });
  // window.addEventListener('unload', (event) => {
  //   console.log('window unload', event);
  // });
  // window.addEventListener('beforeunload', (event) => {
  //   console.log('window beforeunload', event);
  // });

  return (
    <div className='datai-visual-sdk'>
      {allowPage ? (
        pageConfig.componentList.length > 0 && (
          <div className='screen-wrap'>
            <ConfigProvider locale={zhCN}>
              <RenderEngine
                renderWrapperId={id}
                type={type}
                pageConfig={pageConfig}
                screenConfigRef={screenConfigRef}
                loadedCallBack={loadedCallBack}
                loadedDataStoreCallback={loadedDataStoreCallback}
                customSdkSets={customSdkSets}
              />
            </ConfigProvider>
          </div>
        )
      ) : (
        <Share errorCode='405' />
      )}
    </div>
  );
};

export default RenderByType;
