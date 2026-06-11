/*
 * @Author: zengwei
 * @Date: 2023-05-08 14:06:32
 * @Last Modified by: zengwei
 * @Last Modified time: 2024-09-25 16:08:33
 * 公共数据状态
 */
import { makeAutoObservable, toJS, runInAction } from 'mobx';
import { cloneDeep } from 'lodash';
import { GetQueryString } from '@/utils/BrowserUtils';
import { GETCATEGORYLIST } from '@/services/apis/CardApi';

const deepMapToTreeData = (list) => {
  list.forEach((vl) => {
    vl.title = vl.sortName; // 更新卡片分类名称接口字段
    vl.value = vl.id;
    deepMapToTreeData(vl.children || []);
  });
};
export default class GlobalStore {
  rootStore;

  /**
   * 大屏id
   */
  bigScreenId: string = GetQueryString('id');

  /**
   * 大屏类型
   */
  bigScreenType = GetQueryString('type') as 'card' | 'layer' | 'page';

  /**
   * 应用内页面 id
   */
  appPageId: string = GetQueryString('appPageId');

  /**
   * 版本号：hook 页面用到这个，编辑页面是从 versionStore 取
   */
  version: string = GetQueryString('version');

  /**
   * 操作系统平台
   */
  platform = 'Win';

  /**
   * 大屏应用配置信息
   */
  screenConfig: Record<string, any> = {
    fonts: [],
    pcSize: '1920X1080',
    width: 1920,
    height: 1080,
    opacity: '1',
    fontVar: 'font',
    title: '面向数字孪生的低代码平台',
    baseUrl: '',
    scale: 'initSize',
    favicon: '/assets/datai/icons/favicon.ico',
    // 优先从接口configInfo获取
    environment: {},
    // 桶名
    bucketName: 'ioc-screen',
    // 租户
    tenantId: 'default',
    // minio地址
    ossProxy: '',
    // 旧屏幕唯一标示
    pageId: this.bigScreenId,
    // 新屏幕唯一标示
    appId: this.bigScreenId,
    // 是否使用缓存数据
    dataType: 0, // 0:不使用，1:使用，默认不使用缓存数据
    // 鼠标样式
    mouseType: 1, // 1 显示✋🏻 0 默认图标
    loading: {
      backgroundColor: '#040C1F',
      imgSrc: '/assets/datai/icons/loading.png',
      resetPageType: true,
    },
    scrollbar: {
      size: 6,
      bgColor: 'rgba(0,0,0,0.2)',
    },
    // v8.11 新增预加载资源
    preLoadResources: [],
    // 新增 背景色
    screenBackground: 'to bottom-#0d1117-#0d1117',
    // 背景图片
    screenBackgroundImage: '',
    // 页面使用
    // 页面图层配置
    layerConfig: {
      defaultLayerId: '1',
      activeLayerId: '1',
      layers: [],
    },
    // 动态数据源缓存最近使用的6个接口
    dynamicApis: [],
    // v8.10 滤镜配置
    filter: {
      switchVal: false,
      hueRotate: 0,
      saturation: 0,
      brightness: 0,
      contrastRatio: 0,
      opacity: 100,
    },
  };

  /**
   * 卡片分类
   */
  gategoryList = [];

  /**
   * 用于全局变量数据实时显示
   */
  globalDataStoreCount = 0;

  /**
   * v7.6.2 添加变量名称搜索关键字
   */
  variableName = '';

  /**
   * 组件菜单栏是否在画布里
   */
  isMenuInScreen = false;

  /**
   * 菜单位置
   */
  menuPosition = { left: 0, top: 0 };

  /**
   * 鼠标位置，是否在画布
   */
  mousePos = {
    left: 0,
    top: 0,
    x: 0,
    y: 0,
    isInScreen: false,
  };

  /**
   * 是否有粘贴内容
   */
  hasParseContent = false;

  /**
   * 是否应用
   */
  isApp = false;

  /**
   * 被删除的变量和变量组(记录本地被删除的变量和变量组，合并变量时不合并这部分变量)
   */
  invalidVariableKeys = [];

  /**
   * v8.6.0
   * 所有页面信息 key 页面id，页面名称 变量引用关系， 接口引用关系，
   */
  allPageRefer = {};

  /**
   * v8.16.0
   * 远程控制信息
   */
  remoteControllInfo = {
    remoteControlType: 0, // 远程控制类型：0被控制端，1控制端
    remoteControlledEnabled: false, // 是否开启被远程控制，只有是被控制端时起作用
    remoteControlledAppId: '', // 被远程控制的应用id
  };

  /**
   * 是否是移动端
   */
  isMobile: false;

  constructor(rootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  /**
   * 页面是否已经转化为应用
   * @param value
   */
  updateIsApp = (value: boolean) => {
    this.isApp = value;
  };

  /**
   * 保存当前页面配置属性
   * @param value
   * @param field
   * @param parent
   */
  updatePageConfig(value, field, parent?: any) {
    const { PageTreeStore, PageTabsStore } = this.rootStore;
    const { getPageInfo, savePageInfo } = PageTreeStore;
    const { selectedKey } = PageTabsStore;
    const selectedPageInfo = getPageInfo(selectedKey);
    if (selectedKey && selectedPageInfo) {
      const { pageConfig } = selectedPageInfo;
      if (parent && parent[0]) {
        pageConfig[parent][field] = value;
      } else {
        pageConfig[field] = value;
      }
      savePageInfo(selectedKey, selectedPageInfo);
    }
  }

  /**
   * 获取layerConfig
   * @returns
   */
  // TODO 8.0 layerConfig
  getScreenConfig = (isHome: boolean) => {
    const screenConfig = cloneDeep(toJS(this.screenConfig));
    if (this.isApp) {
      const { PageTreeStore, PageTabsStore } = this.rootStore;
      const { getPageInfo, homePageId } = PageTreeStore;
      const { selectedKey } = PageTabsStore;
      if (isHome) {
        if (homePageId && getPageInfo(homePageId) && getPageInfo(homePageId).pageConfig) {
          const pageConfig = toJS(getPageInfo(homePageId).pageConfig);
          screenConfig.layerConfig = pageConfig.layerConfig;
          screenConfig.dynamicApis = pageConfig.dynamicApis;
        }
      } else if (selectedKey && getPageInfo(selectedKey) && getPageInfo(selectedKey).pageConfig) {
        const pageConfig = toJS(getPageInfo(selectedKey).pageConfig);
        screenConfig.layerConfig = pageConfig.layerConfig;
        screenConfig.dynamicApis = pageConfig.dynamicApis;
      }
    }
    return toJS(screenConfig) || {};
  };

  updateScreenConfig = (value, field, parent?: any) => {
    console.log(value, field, parent);
    // 更新滤镜配置
    // if (parent && parent[0] && parent[0] === 'filter') {
    //   // 1. 当前图层id
    //   const layerId = this.rootStore.LayerStore.activeLayerId;
    //   // 2. 当前图层对应滤镜
    //   const filter = this.screenConfig.filter[layerId] || {};
    //   // 3. 更新滤镜属性
    //   filter[field] = value;
    //   // 4. 重新保存到screenConfig
    //   this.screenConfig.filter[layerId] = filter;
    // } else
    const isFilter = parent && parent[0] && parent[0] === 'filter';
    if (this.isApp && (parent === 'layerConfig' || field === 'dynamicApis' || isFilter)) {
      // 保存layerConfig和dynamicApis都是当前屏数据
      this.updatePageConfig(value, field, parent);
      // this.updatePageConfigCount += 1;
      // return;
    }

    // 也同时保存到screenConfig
    if (isFilter) {
      this.screenConfig.filter[field] = value;
    } else if (parent && parent[0]) {
      this.screenConfig[parent][field] = value;
    } else {
      this.screenConfig[field] = value;
    }
    this.screenConfig = { ...this.screenConfig };
    window.screenConfig = toJS(this.screenConfig);
  };

  /**
   * 应用属性更新，并且随时保存
   * @param value
   * @param field
   * @param parent
   */
  saveScreenConfig = (value, field, parent?: any) => {
    this.updateScreenConfig(value, field, parent);
    if (this.isApp) {
      const { ServiceStore } = this.rootStore;
      ServiceStore.debounceSaveAPP();
    }
  };
  // updateDateType = (type) => {
  //   window.screenConfig.dataType = type ? 1 : 0;
  //   this.screenConfig.dataType = window.screenConfig.dataType;
  // };

  getPlatform = () => {
    let platform;
    const isWin = navigator.platform === 'Win32' || navigator.platform === 'Windows';
    if (isWin) platform = 'Win';
    const isMac =
      navigator.platform === 'Mac68K' ||
      navigator.platform === 'MacPPC' ||
      navigator.platform === 'Macintosh' ||
      navigator.platform === 'MacIntel';
    if (isMac) platform = 'Mac';
    this.platform = platform;
  };

  /**
   * 添加图层时同时添加图层对应的滤镜
   * @param layerId
   */
  // addLayerFilter = (layerId) => {
  //   const filter = { ...this.screenConfig.filter };
  //   filter[layerId] = {
  //     switchVal: false,
  //     hueRotate: 0,
  //     saturation: 0,
  //     brightness: 0,
  //     contrastRatio: 0,
  //     opacity: 100,
  //   };
  //   this.screenConfig.filter = filter;
  //   this.screenConfig = { ...this.screenConfig };
  //   window.screenConfig = toJS(this.screenConfig);
  // };

  /**
   * 删除图层时同时删除图层对应的滤镜
   * @param layerId
   */
  // delLayerFilter = (layerId) => {
  //   const { filter } = this.screenConfig;
  //   delete filter[layerId];
  //   this.screenConfig.filter = filter;
  //   window.screenConfig = toJS(this.screenConfig);
  // };

  /**
   * 更新 screenConfig 中动态数据接口信息
   * @param apiInfo
   * @returns
   */
  updateDynamicApis = (apiInfo: any) => {
    let apis = cloneDeep(this.getScreenConfig(false).dynamicApis) || [];
    if (apis.map((v) => v.id).includes(apiInfo.id)) {
      const idx = apis.findIndex((v) => v.id === apiInfo.id);
      apis.splice(idx, 1);
      apis = [apiInfo, ...apis];
    } else {
      apis = [apiInfo, ...apis];
    }

    // 截取最近使用的6个接口
    // apis = apis.splice(0, 6);
    this.updateScreenConfig(apis, 'dynamicApis');
  };

  /**
   * 将多个动态接口信息，添加到 dynamicApis 中
   * @param apiList 接口信息列表
   */
  mergeDynamicApis = (apiList: any[]) => {
    const apis = cloneDeep(this.getScreenConfig(false).dynamicApis) || [];
    const ids = new Set(apis.map((v) => v.id));
    const newApis = apiList.filter((v) => !ids.has(v.id));
    this.updateScreenConfig([...newApis, ...apis], 'dynamicApis');
  };

  updateDataStore = () => {
    this.globalDataStoreCount += 1;
    // const { ServiceStore } = this.rootStore;
    // ServiceStore.saveAPP();
  };

  setGategoryList = (list = []) => {
    this.gategoryList = list;
  };

  getGategoryList = () => {
    return GETCATEGORYLIST({ sortType: 1, includeCount: true }).then((rs) => {
      const list = (rs && rs.data) || [];
      deepMapToTreeData(list);
      runInAction(() => {
        this.setGategoryList(list);
      });
      return list;
    });
  };

  /**
   * 设置变量名称搜索关键字
   * @param name
   */
  setVariableName = (name) => {
    this.variableName = name;
  };

  /**
   * 更新菜单栏鼠标是否在画布
   * @param inScreen
   */
  updateMenuStatus = (inScreen) => {
    this.isMenuInScreen = inScreen;
  };

  /**
   * 更新菜单栏鼠标位置
   * @param position
   */
  updateMenuPosition = (position) => {
    this.menuPosition = position;
  };

  /**
   * 更新是否有可粘贴内容
   * @param has
   */
  updateHasParseContent = (has) => {
    this.hasParseContent = has;
  };

  /**
   * 更新鼠标位置
   * @param position
   */
  updateMousePos = (position) => {
    this.mousePos = position;
  };

  /**
   * 更新被删除的变量
   * @param keys
   */
  updateInvalidVariableKeys = (key) => {
    this.invalidVariableKeys = [...this.invalidVariableKeys, key];
  };

  updateAllPageRefer = (refJsonConfig) => {
    this.allPageRefer = refJsonConfig || {};
  };

  updateRemoteControllInfo = (data) => {
    this.remoteControllInfo = data;
  };
}
