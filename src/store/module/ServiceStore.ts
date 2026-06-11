/*
 * @Author: zengwei
 * @Date: 2023-05-08 19:59:15
 * @Last Modified by: zengwei
 * @Last Modified time: 2024-10-08 16:00:59
 */
import { makeAutoObservable, toJS, runInAction } from 'mobx';
import * as Api from '@/services/apis/comApi';
import * as InfoApis from '@/services/apis/screenApi';
import * as AppPageApi from '@/services/apis/appPageApi';
// import * as CardApi from '@/services/apis/CardApi';
import { getSysLayerListByBatch } from '@/services/apis/dataMapApi';
import * as FontApis from '@/services/apis/fontApi';
import {
  CARDINFOBYID,
  CARDINFOBYUID,
  UPDATECARDINFO,
  CARDPREVIEWIMGURL,
  FILECOPY,
  MARKETCARDINFOBYID,
  UPDATEMARKETCARD,
  MARKETCARDPREVIEWIMGURL,
  GETCATEGORYLIST,
} from '@/services/apis/CardApi';
import { addApiRelatedByList } from '@/services/apis/dataManage';
import $ from 'jquery';
import JSONfn from 'json-fn';
import { message } from 'antd';
import { SCREENTCONFIG, filter as filterConfig } from '@/utils/constant';
import { categoryListTree } from '@/staticJson/DataICompList';
import DataI from '@/utils/global-api';
import { cloneDeep, debounce } from 'lodash';
import {
  handleData,
  findGISLayers,
  computeGroupPos,
  concatDataStore,
  compatibleEventSettings,
  restoreEventSettings,
} from '@/utils/componentUtils';
import { filterCardUrl } from '@/utils/resetKeys';
import {
  dynamicLoadPlugins,
  dynamicLoadCommon,
  dynamicLoadPreSource,
  dynamicLoadDataIComponents,
  dynamicLoad2D,
  dynamicLoad3D,
} from '@/utils/loadScript';
import { initComs, initComponent } from '@/utils/initComs';
import { GetQueryString, clearPendingXhrList } from '@/utils/BrowserUtils';
import { mapBaseLayerType } from '@/staticJson/MapBasic';
import { fetchXToken } from '@/utils/aksk';
import { getImageUrl } from '@/utils/utils';
import { generateId } from '@/utils/random';
import { getCurPageRefer } from '@/utils/pageListRefer';
import type PageTree from '@/store/pageTree';

const getAllIds = (LayerStore) => {
  const item = [];
  function findInList(list = []) {
    list.forEach((cp) => {
      item.push(cp.key);
      if (cp.classType === 'group') {
        findInList(cp.childComList || []);
      }
    });
  }
  findInList(LayerStore.comList || []); // 遍历查找所有的组件key
  return item;
};

// 获取所有组件的key
const mapComKeys = (list) => {
  const comKeys = [];
  const loop = (array) => {
    array.forEach((l) => {
      comKeys.push(l.key);
      if (l.classType === 'group' || l?.isDragContainer) {
        loop(l.childComList || []);
      }
      if (l.type === 'DynamicPanel' || l.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        l.children.forEach((child) => {
          loop(child.AntdChildComponents || []);
        });
      }
    });
  };
  loop(list);
  return comKeys;
};

// 查找自定义组件
const findCustomComponents = (componentList, currentVersion?) => {
  const refInfoList = [];
  const loop = (list) => {
    list.forEach((item) => {
      if (item.classType === 'group') {
        loop(item.childComList);
      } else if (item.type === 'DynamicPanel' || item.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        item.children.forEach((child) => {
          loop(child.AntdChildComponents);
        });
      } else if (item.classType === 'customComp') {
        const { customCode } = item;
        let codeId = customCode.replace('Comp_', '');
        const pos = codeId.indexOf('_');
        if (pos > -1) {
          codeId = codeId.slice(0, pos); // 考虑到自定义组件多租户隔离需要去掉租户后缀
        }
        const idArr = refInfoList.map((refInfo) => refInfo.refScreenId); // 大屏页面存在多次引用需过滤
        if (!idArr.includes(codeId)) {
          const obj: any = {
            refScreenType: 4,
            refScreenId: codeId,
          };
          if (currentVersion) obj.version = currentVersion;
          refInfoList.push(obj);
        }
      }
    });
  };
  loop(componentList);
  return refInfoList;
};

// 查找业务图层
const findLayerPages = async (componentList, currentVersion?) => {
  const refInfoList = [];
  const findLayerTreeCom = (comList) => {
    let layerTreeCom = [];
    if (!Array.isArray(comList)) {
      return layerTreeCom;
    }
    for (let i = 0, len = comList.length; i < len; i++) {
      if (comList[i].type === 'LayerTree' && comList[i].props.relateDataType === '2') {
        layerTreeCom.push(comList[i]);
      }
      const childTmp = findLayerTreeCom(comList[i].childComList);
      if (Array.isArray(childTmp)) {
        layerTreeCom = [...layerTreeCom, ...childTmp];
      }
    }
    return layerTreeCom;
  };
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
        if (Array.isArray(uidTmp) && uidTmp.length > 0) {
          layerUids = [...layerUids, ...uidTmp];
        }
      }
    });
    return layerUids;
  };
  const layerTreeComs = findLayerTreeCom(componentList);
  let layerUidArr = [];
  layerTreeComs.forEach((item) => {
    const tmpArr = getLayerUid(item.props.layerTree);
    if (Array.isArray(tmpArr) && tmpArr.length > 0) {
      layerUidArr = [...layerUidArr, ...tmpArr];
    }
  });
  layerUidArr.forEach((uid) => {
    const idArr = refInfoList.map((refInfo) => refInfo.refScreenId); // 大屏页面存在多次引用需过滤
    if (!idArr.includes(uid)) {
      const obj: any = {
        refScreenType: 2,
        refScreenId: uid,
      };
      if (currentVersion) obj.version = currentVersion;
      refInfoList.push(obj);
    }
  });
  // if (layerUidArr.length > 0) {
  //   // todo后续改成异步加载

  //   try {
  //     const sysLayerRes = await getSysLayerListByBatch(layerUidArr);
  //     if (Number(sysLayerRes?.code) === 200 && sysLayerRes?.data) {
  //       const { data } = sysLayerRes;
  //       for (let { jsonConfig } of data) {
  //         if (jsonConfig) {
  //           jsonConfig = JSON.parse(jsonConfig);
  //           const { componentList: compList } = jsonConfig;
  //           const refInfoArr = [];
  //           const loop = (list) => {
  //             for (const item of list) {
  //               if (
  //                 item.englishName === 'MapFoundationPlan' ||
  //                 item.englishName === 'Map3DFoundationPlan' ||
  //                 item.englishName === 'MapGlFoundationPlan'
  //               ) {
  //                 const { layers } = item;
  //                 for (const layer of layers) {
  //                   if (mapBaseLayerType.includes(layer.type)) {
  //                     const { _attr } = layer;
  //                     const { group_id, relation_layer_code } = _attr;
  //                     if (!!group_id && !!relation_layer_code) {
  //                       const refScreenId = `${group_id}-with-${relation_layer_code}`;
  //                       const idArr = refInfoArr.map(
  //                         (refInfo) => refInfo.refScreenId, // 大屏页面存在多次引用需过滤
  //                       );
  //                       if (!idArr.includes(refScreenId)) {
  //                         const obj: any = {
  //                           refScreenType: _attr.source === 'cim' ? 6 : 5,
  //                           refScreenId,
  //                         };
  //                         if (currentVersion) obj.version = currentVersion;
  //                         refInfoList.push(obj);
  //                       }
  //                     }
  //                   }
  //                 }
  //               }
  //             }
  //           };
  //           loop(compList);
  //           refInfoList.push(...refInfoArr);
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }
  return refInfoList;
};

const formatPosition = (transform) => {
  const arr = transform.split(' ').map((vl) => {
    const num = vl.replaceAll(/[^!-\d,?]/gi, '');
    return Number.parseInt(num, 10);
  });
  return arr;
};

const handleStoreData = (dataStore) => {
  if (Array.isArray(dataStore)) {
    for (const child of dataStore) {
      if (child.children && Array.isArray(child.children)) {
        for (const item of child.children) {
          delete item.data;
        }
      }
    }
  }
  return dataStore;
};

// 兼容跨屏复制、拖动层级、复制粘贴、引用卡片以及各种操作导致的组内子组件groupKey异常(groupKey影响子组件是否可以从组中删除)
const replaceGroupKey = (comList) => {
  const deep = (list) => {
    for (const v of list) {
      if (v.classType === 'group') {
        for (const com of v.childComList) {
          // 一级组下所有子组件添加groupKey
          com.groupKey = v.key;
          if (com.classType === 'group') {
            // 二级组下所有子组件添加groupKey
            // com.childComList.forEach((c) => (c.groupKey = com.key));
            deep(com.childComList);
          }
        }
      }
    }
  };
  deep(comList);
  // 删除一级组件的groupKey
  return comList.filter((com) => delete com.groupKey);
};

// 兼容以前antd组件默认无comInvisible属性，子组件显隐依靠父组件状态带来不便利
// 给所有组件加上comInvisible属性，所有组件显隐依靠自己状态进行判断
// comInvisible：true隐藏、false显示
const compatibleComVisiable = (comList) => {
  const loop = (list, parent) => {
    for (const com of list) {
      if (parent) {
        // 父组件隐藏，子组件无comInvisible属性，这种是统一隐藏了父组，子组件也需要隐藏
        if (com.comInvisible === undefined) {
          com.comInvisible = !!parent.comInvisible;
        }
      } else if (com.comInvisible === undefined) {
        com.comInvisible = false;
      }
      if (com.classType === 'group') {
        loop(com.childComList || [], com);
      }
    }
  };
  loop(comList, null);
};

const sortMapLayer = (list = []) => {
  for (const item of list) {
    if (item.childComList && item.childComList.length > 0) {
      sortMapLayer(item.childComList);
    }
    if (item.type.includes('@yl/datai-com-map-gl-FoundationPlan')) {
      let sliceArr = [];
      let index = 0;
      item.layers = item.layers ? item.layers : [];
      // item.layers.forEach((item, i) => {
      //   if (item.type == '@yl/datai-com-map-gl-basic-layer') {
      //     index = i;
      //   }
      // });
      for (const [i, val] of item.layers.entries()) {
        if (val.type === '@yl/datai-com-map-gl-basic-layer') {
          index = i;
        }
      }
      sliceArr = item.layers.splice(index, 1);
      item.layers = [...sliceArr, ...item.layers];
    }
  }
};

// 更新卡片分类名称接口字段
const deepMapToTreeData = (list) => {
  list.forEach((vl) => {
    vl.title = vl.sortName; // 更新卡片分类名称接口字段
    vl.value = vl.id;
    deepMapToTreeData(vl.children || []);
  });
};

export default class ServiceStore {
  rootStore;

  constructor(rootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  getConfig = async () => {
    // const rs = await Api.GETCONFIGINFO();
    const rs = {
      code: '200',
      data: {
        configs: {
          cardList: true,
          indicator: true,
          sandboxMarket: true,
          cardMenu: true,
          pageLayoutType: true,
          sandboxShare: true,
          cardMarket: true,
          cardShare: true,
          timeAndSpace: true,
          gisSandbox: true,
          cimSource: false,
          basedOnWT: true,
        },
        systemConfig: {
          // cimVisualTemplateShow: true,
          bucketName: 'ioc-screen',
          ns: 'ql-cim-test',
          ossProxy: '',
          tenantId: 'default',
          showIndicatorTenant: ['default', 'zzfgs'],
          easyDataProxy: '',
          indicatorKeyId: 'ee58a0e1-f53f-4a75-b0c9-ed38a2452fcb',
          gisProxy: '',
          indicatorJavaPrivateKey:
            'MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC5WyFZR2axC+p4Df6j1J/m3MizlGNfMNlBpODcR9KCq4nE1YfRLrD6+p+bJoGn5hO1erOcw7UiQ8ED+00Sh5yBKjpmRlrxuZ5LAuCX+p6Tp4vGJHfUNSEFfsYa/vGdE2YH7vxchTWYxRWj7gmYYEdvkIxFd/oiUdOYawNCJcHlZxuSDP9OcG6yagkBODsl6hhbJswI4dnVDuu9t2b68iDSkyRzPU+0kBwitiPV9ACOmq5MxoCg5XCU4AlVE7v4CxxmNYhYLgwqsX6Jdhm7BoOTY06GvHEgZ5VN1b1Fwh/Ab0cms1pA9hz19UhRZo+XPCgIVHlJjl1/rFjEv70WUYTJAgMBAAECggEAaFFVj32T2giuySp3KZU8+R1BB3B4DNbdLwiwVMlHPKt2OgVDDwOML3Rl51fgmLHwXa7U72FlzAb91lPUqJ0SA8/UVkM6Y9jnsafI5z/xh4BANh/IIPJVx1X2ALODH7gPMF/cP+XoqDYjW8NYOx3UloFvsJk5eZ87ywhPKSc+3PAZXV5tCA9lCgeI8GTRbyOQei3mrttVHLp86bVaqQSJb8B7qbN5j4JZza0RQnlfmycvxwh1JQTNQIGwvha/0OlplvdLgW27QjwaMoMiTD6BezmF9zwbnx/ZUivlH28nIMXhu0hZxEsurJLgSsZ5MM0SvZBPI623DXfIqefnpdB+UQKBgQDe9ISdrqSLueIt3IP1UO71VC4szgXM6neLTvNXNkGpzwIubHm/Em33Uc/YBdWeBGzXr2AVMJrha4B4fNzD/xofCmL6vU6hR4b4HfkuhpXbY4ceakyLAkODPvYscSIXANefzNazuYwrJgA5jCqNvK3HYXxytUQQVrEwkVQH++qGEwKBgQDU1AEwIkAfGFCkpUn052iUglUJwA0UYlWtwB9l+5wK0hRr62VX69D03p9JWGM41iVvBEl9XPRzh1Rlgi583/liaY8SlVbgL2ETaJdmFkGkibwkOS9UrJhWc49rcFgjgx5B+zRRYFE+MHMfRx3wwcau+tUpSGGML+buVOYMBCnVMwKBgGntYIiOLg1YrnY9m9BUuIOEkD+nTqgyCcP9Ka4Y0A++k3m8/gbi2a40h3xKIVjnH1NGNm863YsWCT61jCnurNlslOQuRwpnMl/11areNJq8abjwphcxZyQXKNyqj5jARLHen29aS5dAgcDVsG4Q47ujvH2/U2wz1BGQKo10idNTAoGAEIKRxQYjK0ZbmyonXpRFDKA/sI3xdc9bDiuFRAgMxtodM3IDXpqwjw5mFO6CY/pY1Q/kE5GOdRfeeDFtIcrOMdA2hR6IqsOCKFtIw2aemQEGU1kMTulEuBAm5BLHA5o8UqoGGPn703M2uwptTCv8Gb7jolw3FQTySTLU1cHM7PkCgYBGjLIWwFML86c+eKavN8pUomMw38/KEb3bp2exVtPPv/rI0pS5X+NZzfShs15iIS72GOGXLPO35oB+H3apA9CeygnQWIsVgqFuZ1TTNRwYmF2Rr6qE8RxgrtAspnJ0NyjjhfLf4yzW0Upno81UH1n4K6TmRE+qvSG0iDevn6VbOA==',
        },
      },
      message: '处理成功',
      success: true,
    };
    if (rs.code !== '0' && rs.code !== '200') {
      return;
    }
    const { configs, systemConfig } = rs.data;
    const { GlobalStore, ControlStore, CompLibStore } = this.rootStore;
    // configs.cimVisualTemplateShow = systemConfig.cimVisualTemplateShow;
    GlobalStore.updateScreenConfig(configs, 'environment');
    GlobalStore.updateScreenConfig(systemConfig?.bucketName, 'bucketName');
    GlobalStore.updateScreenConfig(systemConfig?.tenantId, 'tenantId');
    GlobalStore.updateScreenConfig(systemConfig?.ossProxy, 'ossProxy');
    ControlStore.setConfig(configs); // 用于卡片列表数据权限
    CompLibStore.getCategoryList(configs); // 获取组件列表

    // 是否显示“指标”数据源类型
    let showIndicator = false;
    if (
      configs.indicator &&
      systemConfig?.showIndicatorTenant &&
      systemConfig.showIndicatorTenant.includes(systemConfig.tenantId || 'default')
    ) {
      showIndicator = true;
    }
    window.sessionStorage.setItem('showIndicator', `${showIndicator}`);

    /* if (showIndicator) {
      // v7.11 新增，获取指标接口需要的 x-token
      fetchXToken(systemConfig.indicatorKeyId, systemConfig.indicatorJavaPrivateKey);
    } */
  };

  queryPath = async () => {
    let pathType = 1;
    const {
      GlobalStore: { bigScreenType, bigScreenId },
      OssStore,
    } = this.rootStore;
    const targetId = bigScreenId;
    const type = bigScreenType;
    switch (type) {
      case 'page': {
        // 大屏编辑器
        pathType = 1;
        break;
      }
      case 'card': {
        // 卡片编辑器
        pathType = 2;
        break;
      }
      case 'layer': {
        // 图层编辑器
        pathType = 3;
        break;
      }
      default: {
        pathType = 1;
        break;
      }
    }
    // const rs = await InfoApis.QUERYPATH({ pathType, targetId });
    const rs = {
      code: '200',
      data: {
        bucketName: 'ioc-screen',
        path: '7505d64a54e061b7acd54ccd58b49dc43500b635/9b242487e067355ee17a40c3d865cbdae45bd3f2/screen/1895378739046699008',
        targetId: '1895378739046699008',
      },
      message: '处理成功',
      success: true,
    };
    if (!rs) return; // 纠正返回数据结构的处理方式

    OssStore.setOssPathInfo(rs.data);
  };

  getListObject = (data = {}) => {
    return InfoApis.GETLISTOBJECT(data);
  };

  createPagePath = (data = {}) => {
    return InfoApis.CREATEPAGEPATH(data);
  };

  uploadFile = (data = {}) => {
    return InfoApis.UPLOADFILE(data);
  };

  uploadFiles = (data = {}) => {
    return InfoApis.UPLOADFILES(data);
  };

  /**
   * 大屏和业务图层请求配置后的逻辑处理
   * @param data 大屏或业务图层配置信息
   * @returns
   */
  analyticInfo = (data) => {
    const { GlobalStore, LayerStore, PageTabsStore } = this.rootStore;
    const { bigScreenType } = GlobalStore;
    const { id, jsonConfig, pageName, layerName } = data;

    let list = jsonConfig; // 反转义
    const titleName = bigScreenType === 'layer' ? layerName : pageName;

    window.titleName = titleName;

    if (list !== '' && list !== undefined) {
      try {
        list = list.replaceAll(/refcomname/gi, 'englishName');
        list = JSON.parse(list);
      } catch (error) {
        console.error(error);
        list = {
          compIds: [],
          screenConfig: cloneDeep(SCREENTCONFIG),
          componentList: [],
        };
      }
    } else {
      list = {
        compIds: [],
        screenConfig: cloneDeep(SCREENTCONFIG),
        componentList: [],
      };
    }
    if (bigScreenType === 'page') {
      console.log('自定义页面加载');
      // 兼容地图环境切换字段;
      if (window?.screenConfig?.environment) {
        list.screenConfig.environment = window.screenConfig.environment;
      }

      // 图片minio地址
      if (window?.screenConfig?.ossProxy && !list.screenConfig.ossProxy) {
        list.screenConfig.ossProxy = window.screenConfig.ossProxy;
        GlobalStore.updateScreenConfig(window.screenConfig.ossProxy, 'ossProxy');
      }

      // 兼容老大屏没有图层
      if (list.screenConfig.layerConfig) {
        // 1. 更新默认图层id
        LayerStore.updateDefaultLayerId(list.screenConfig.layerConfig.defaultLayerId);
        // 2. 更新图层信息
        LayerStore.updateLayersState(list.screenConfig.layerConfig.layers);

        GlobalStore.updateScreenConfig(list.screenConfig.layerConfig, 'layerConfig');
      } else {
        const layerConfig = {
          defaultLayerId: LayerStore.defaultLayerId,
          activeLayerId: LayerStore.activeLayerId,
          layers: LayerStore.layers,
        };
        list.screenConfig.layerConfig = layerConfig;

        GlobalStore.updateScreenConfig(layerConfig, 'layerConfig');

        // 滤镜属性更新
        // 1. 取出之前滤镜属性
        // const defaultFilter = { ...list.screenConfig.filter };
        // // 2. 更新滤镜配置
        // const filter = {};
        // filter[layerConfig.defaultLayerId] = defaultFilter;
        // list.screenConfig.filter = filter;

        // GlobalStore.updateScreenConfig(filter, 'filter');
      }
    } else {
      console.log('图层加载');
      if (!list.screenConfig.layerConfig && LayerStore.layers.length !== 3) {
        // 初始化图层编辑器，默认添加3个图层
        this.initLayerEditor(list);
        const { defaultLayerId, activeLayerId, layers } = LayerStore;
        const layerConfig = { defaultLayerId, activeLayerId, layers };
        list.screenConfig.layerConfig = layerConfig;
        GlobalStore.updateScreenConfig(layerConfig, 'layerConfig');
      } else {
        // 1. 更新默认图层id
        LayerStore.updateDefaultLayerId(list.screenConfig.layerConfig.defaultLayerId);
        // 2. 更新图层信息
        LayerStore.updateLayersState(list.screenConfig.layerConfig.layers);

        GlobalStore.updateScreenConfig(list.screenConfig.layerConfig, 'layerConfig');
      }
    }

    if (window?.screenConfig?.bucketName && window.screenConfig.bucketName !== list.screenConfig.bucketName) {
      list.screenConfig.bucketName = window.screenConfig.bucketName;
    }

    if (window?.screenConfig?.tenantId && window.screenConfig.tenantId !== list.screenConfig.tenantId) {
      list.screenConfig.tenantId = window.screenConfig.tenantId;
    }

    if (window?.screenConfig?.ossProxy && window.screenConfig.ossProxy !== list.screenConfig.ossProxy) {
      list.screenConfig.ossProxy = window.screenConfig.ossProxy;
    }

    if (!list.screenConfig.pageId) {
      list.screenConfig.pageId = GlobalStore.screenConfig.pageId;
      if (window.screenConfig) {
        window.screenConfig.pageId = GlobalStore.screenConfig.pageId;
      }
    }

    console.log(list.screenConfig.dynamicApis);

    // 更新缓存的动态api list
    if (list.screenConfig.dynamicApis) {
      GlobalStore.updateScreenConfig(list.screenConfig.dynamicApis, 'dynamicApis');
    } else {
      GlobalStore.updateScreenConfig([], 'dynamicApis');
    }

    try {
      const compIds = [];
      window.dataStore = list.dataStore || [];
      for (const child of window.dataStore) {
        for (const item of child.children) {
          if (!item.mapCompIds) {
            item.mapCompIds = [];
          }
        }
      }
      handleStoreData(window.dataStore); // 处理变量中的data字段

      for (const item of list.componentList) {
        if (item.styles === undefined) {
          const transform = formatPosition(item.cssStyle.transform);
          item.styles = {
            width: item.cssStyle.width,
            height: item.cssStyle.height,
            transform: `translate(${transform[0]}px, ${transform[1]}px)`,
          };
        }
        compIds.push(item.key);
      }
      list.compIds = compIds;
    } catch (error) {
      console.error(error);
    }
    list.componentList = list.componentList.filter(Boolean);
    for (const component of list.componentList) {
      if (component.childComList && component.childComList.length > 0) {
        component.childComList = component.childComList.filter(Boolean);
      }
      // 兼容老大屏没有对应图层属性
      if (component.layerId === undefined) {
        // 1. 为组件设置图层id
        component.layerId = LayerStore.defaultLayerId;
        if (component.childComList && component.childComList.length > 0) {
          // 1.1 组内组件添加layerId
          for (const child of component.childComList) {
            child.layerId = component.layerId;
          }
        }
      }
      // 兼容老大屏没有对应页面 id 属性
      if (component.appPageId === undefined && PageTabsStore.selectedKey) {
        // 1. 为组件设置页面id
        component.appPageId = PageTabsStore.selectedKey;
        if (component.childComList && component.childComList.length > 0) {
          // 1.1 组内组件添加页面 id
          for (const child of component.childComList) {
            child.appPageId = component.appPageId;
          }
        }
      }
    }

    // 所有组件设置父级key值
    list.componentList = replaceGroupKey(list.componentList);
    // 所有组件设置层级level值
    LayerStore.resetComponentLevel(list.componentList);
    // 所有组件设置显隐属性
    compatibleComVisiable(list.componentList);

    sortMapLayer(list.componentList);

    return this.newRender(list, id);
  };

  /**
   * 保存应用信息 获取变量
   */
  saveAppConfig = (screenConfig) => {
    const appConfig = cloneDeep(toJS(screenConfig));
    delete appConfig.dynamicApis;
    delete appConfig.layerConfig;

    const { GlobalStore } = this.rootStore;
    // 兼容地图环境切换字段;
    if (GlobalStore.screenConfig?.environment) {
      appConfig.environment = GlobalStore.screenConfig.environment;
    }
    // 图片minio地址(跨环境导入时，minio地址需要替换为当前环境的配置)
    appConfig.ossProxy = GlobalStore.screenConfig.ossProxy;

    // 兼容老大屏、新建大屏、导入大屏桶名替换
    if (GlobalStore.screenConfig?.bucketName) {
      appConfig.bucketName = GlobalStore.screenConfig.bucketName;
    }

    // 兼容老大屏、新建大屏、导入大屏租户替换
    if (GlobalStore.screenConfig?.tenantId) {
      appConfig.tenantId = GlobalStore.screenConfig.tenantId;
    }

    // 兼容历史屏 鼠标小手状态开关默认为开启
    if (appConfig.mouseType === undefined) {
      appConfig.mouseType = 1;
    }

    if (appConfig.isMobile) {
      appConfig.scale = 'scaleWidth';
    }

    GlobalStore.screenConfig = {
      ...GlobalStore.screenConfig,
      ...appConfig,
    };
    GlobalStore.isMobile = appConfig.isMobile;
    window.screenConfig = GlobalStore.screenConfig;
  };

  /**
   * 获取变量
   */
  getDataStore = (dataStore) => {
    // 获取数据变量
    window.dataStore = dataStore || [];
    for (const child of window.dataStore) {
      for (const item of child.children) {
        if (!item.mapCompIds) {
          item.mapCompIds = [];
        }
      }
    }
    handleStoreData(window.dataStore); // 处理变量中的data字段
  };

  /**
   * v8.6.0 设置引用关系
   * @param refJsonConfig
   */
  getRefJsonConfig = (refJsonConfig) => {
    // console.log('refer refJsonConfig', refJsonConfig);
    const { GlobalStore } = this.rootStore;
    let allPageRefer = {};
    if (refJsonConfig) {
      const refJsonConfigStr = refJsonConfig.replaceAll(/refcomname/gi, 'englishName');
      allPageRefer = JSON.parse(refJsonConfigStr);
    }
    GlobalStore.updateAllPageRefer(allPageRefer);
  };

  /**
   * 旧页面数据转化为应用
   */
  oldPageToApp = async (data) => {
    const { GlobalStore } = this.rootStore;
    const {
      jsonConfig,
      pageId,
      isApp,
      refJsonConfig,
      remoteControlType = 0,
      remoteControlledEnabled = false,
      remoteControlledAppId = '',
      terminalType = 1, // 终端类型
    } = data;
    let appConfig;
    const defaultLayerId = String(Date.now());
    // 赋初始值，jsonConfig为空时，作为默认值
    let pageConfig = {
      dynamicApis: [],
      layerConfig: {
        defaultLayerId,
        activeLayerId: defaultLayerId,
        layers: [
          {
            layerId: defaultLayerId,
            layerName: '基础图层',
            layerLevel: 1,
            key: String(generateId()),
            isDefault: true,
            children: [],
            editing: false,
            visible: true,
          },
        ],
      },
      // v8.10 逻辑图层对应的滤镜配置
      filter: {
        switchVal: false,
        hueRotate: 0,
        saturation: 0,
        brightness: 0,
        contrastRatio: 0,
        opacity: 100,
      },
    };
    let jsonConfigObj;
    let dataStore = [];
    let componentList = [];
    if (jsonConfig) {
      try {
        const jsonConfigStr = jsonConfig.replaceAll(/refcomname/gi, 'englishName');
        jsonConfigObj = JSON.parse(jsonConfigStr);
        dataStore = jsonConfigObj.dataStore || [];
        // 应用直接取应用配置
        if (isApp && jsonConfigObj.appConfig) {
          appConfig = jsonConfigObj.appConfig;
        } else {
          // 旧应用拆分数据
          componentList = jsonConfigObj.componentList || [];
          const { screenConfig } = jsonConfigObj;

          pageConfig = {
            dynamicApis: screenConfig.dynamicApis || [], // 动态数据源引用的接口
            layerConfig: screenConfig.layerConfig,
            filter: screenConfig.filter?.[screenConfig.layerConfig.defaultLayerId],
          };
          appConfig = { ...screenConfig };
        }
      } catch {
        appConfig = GlobalStore.screenConfig;
      }
    } else {
      appConfig = GlobalStore.screenConfig;
      if (terminalType === 2) {
        appConfig.width = 375;
      }
    }
    /**
     * terminalType:1 PC端
     * terminalType:2 移动端
     */
    if (terminalType === 2) {
      appConfig.isMobile = true;
    } else {
      appConfig.isMobile = false;
    }
    // 获取变量
    this.getDataStore(dataStore);
    // 保存应用
    this.saveAppConfig(appConfig);
    // v8.6.0 获取引用关系配置
    this.getRefJsonConfig(refJsonConfig);
    // v8.16.0 保存远程控制信息
    GlobalStore.updateRemoteControllInfo({ remoteControlType, remoteControlledEnabled, remoteControlledAppId });
    // 页面标签标题
    const titleDom = document.querySelector('#datai-title');
    if (titleDom) {
      // 兼容老大屏
      if (appConfig.title === '云粒数智可视化大屏' || !appConfig.title) {
        appConfig.title = '面向数字孪生的低代码平台';
      }
      titleDom.innerHTML = appConfig.title;
    }
    const favDom = document.querySelector('#datai-favicon') as HTMLLinkElement;
    if (favDom) {
      favDom.href = getImageUrl(appConfig.favicon || '/assets/datai/icons/favicon.ico');
    }
    // 已经是应用
    if (isApp && (jsonConfigObj?.appConfig || !jsonConfigObj)) {
      if (!jsonConfigObj) {
        this.saveAPP();
      }
      GlobalStore.updateIsApp(true);
      return true;
    }
    // 旧数据转化为应用
    delete appConfig.layerConfig;
    delete appConfig.dynamicApis;
    const appConfigJson = {
      dataStore: window.dataStore || [],
      appConfig,
    };
    const pageConfigJson = {
      componentList,
      pageConfig,
    };
    try {
      const param = {
        appConfigJson: escape(JSONfn.stringify(appConfigJson)).split('').reverse().join(''),
        pageConfigJson: escape(JSONfn.stringify(pageConfigJson)).split('').reverse().join(''),
        pageId: pageId || GlobalStore.bigScreenId,
      };
      const res = await AppPageApi.oldPageToApp(param);
      if (Number(res.code) === 200) {
        GlobalStore.updateIsApp(true);
        return true;
      }
      message.warning(res.message);
    } catch (error) {
      console.error(error);
    }
    GlobalStore.updateIsApp(false);
    return false;
  };

  updateComponentList = async (componentList, pageConfig, appPageId) => {
    const { LayerStore, GlobalStore, PageTabsStore } = this.rootStore;
    const { bigScreenType, screenConfig } = GlobalStore;
    try {
      for (const item of componentList) {
        if (item.styles === undefined) {
          const transform = formatPosition(item.cssStyle.transform);
          item.styles = {
            width: item.cssStyle.width,
            height: item.cssStyle.height,
            transform: `translate(${transform[0]}px, ${transform[1]}px)`,
          };
        }
      }
    } catch (error) {
      console.error(error);
    }
    componentList = componentList.filter(Boolean);
    for (const component of componentList) {
      if (component.childComList && component.childComList.length > 0) {
        component.childComList = component.childComList.filter(Boolean);
      }
      // 兼容老大屏没有对应图层属性
      if (component.layerId === undefined) {
        // 1. 为组件设置图层id
        component.layerId = LayerStore.defaultLayerId;
        if (component.childComList && component.childComList.length > 0) {
          // 1.1 组内组件添加layerId
          for (const child of component.childComList) {
            child.layerId = component.layerId;
          }
        }
      }
      // 兼容老大屏没有对应页面 id 属性
      if (component.appPageId === undefined && PageTabsStore.selectedKey) {
        // 1. 为组件设置页面id
        component.appPageId = PageTabsStore.selectedKey;
        if (component.childComList && component.childComList.length > 0) {
          // 1.1 组内组件添加页面 id
          for (const child of component.childComList) {
            child.appPageId = component.appPageId;
          }
        }
      }
    }
    // 所有组件设置父级key值
    componentList = replaceGroupKey(componentList);
    // 所有组件设置层级level值
    LayerStore.resetComponentLevel(componentList);

    // 所有组件设置显隐属性
    compatibleComVisiable(componentList);

    sortMapLayer(componentList);
    await dynamicLoadCommon();
    // console.log('updateComponentList3.1 appPageId', appPageId, 'PageTabsStore.selectedKey', PageTabsStore.selectedKey);
    // console.log('screenConfig.preLoadResources***33', screenConfig?.preLoadResources);
    if (screenConfig.preLoadResources && screenConfig.preLoadResources.length > 0) {
      await dynamicLoadPreSource(screenConfig.preLoadResources);
    }
    // console.log('updateComponentList3.2 appPageId', appPageId, 'PageTabsStore.selectedKey', PageTabsStore.selectedKey);
    /* 在组件初始化之前需要加载datai组件库 */
    await dynamicLoadDataIComponents(componentList);
    // v8.4.1 去掉每次页面切换重复取值
    // handleData(componentList, pageConfig?.layerConfig?.activeLayerId, 'beforeInit');
    if (appPageId !== PageTabsStore.selectedKey) return;
    // 初始化组件实例
    initComs(componentList, pageConfig?.layerConfig?.activeLayerId, bigScreenType);
    // console.log('updateComponentList3.4 appPageId', appPageId, 'PageTabsStore.selectedKey', PageTabsStore.selectedKey);
    // 需要对组件列表进行深度遍历操作的都可以放到这个方法中
    window.DataI.each(componentList, (component) => {
      // 组件树转为map映射
      window.DataI.setComInfoMap(component);

      // 组件编辑态的显隐状态决定组件是否创建
      // comInvisible: false显示 true隐藏 isCreate属性取反操作
      component.comCreated = !component.comInvisible;
    });
    if (appPageId !== PageTabsStore.selectedKey) return;
    this.updateLayer(componentList, pageConfig, appPageId);
  };

  updateLayer = async (componentList, pageConfig, appPageId) => {
    try {
      const { LayerStore, PageTreeStore, GlobalStore } = this.rootStore;
      const { updateScreenConfig } = GlobalStore;
      // 更新缓存的动态api list
      if (pageConfig?.dynamicApis) {
        updateScreenConfig(pageConfig.dynamicApis, 'dynamicApis');
      } else {
        updateScreenConfig([], 'dynamicApis');
      }
      // 1. 更新默认图层id
      LayerStore.updateDefaultLayerId(pageConfig.layerConfig.defaultLayerId);
      // 2.0 切换页面id
      LayerStore.setAppPageId(appPageId);
      // 21. 更新图层信息
      LayerStore.updateLayersState(pageConfig.layerConfig.layers);
      // 3. 更新组件列表
      LayerStore.updateComList(componentList);
      // 4. 更新激活图层id
      LayerStore.changeActiveLayerId(pageConfig.layerConfig.activeLayerId);

      // v8.10 更新滤镜配置
      if (pageConfig.filter) {
        updateScreenConfig(pageConfig.filter, 'filter');
      } else {
        updateScreenConfig({ ...filterConfig }, 'filter');
      }
      if (!$('.dataq-edit-console').hasClass('operable')) {
        $('.dataq-edit-console').addClass('operable');
      }
      await this.dynamicLoad();
      PageTreeStore.setPageSourceLoaded(appPageId, true);
      console.log('setPageSourceLoaded----end');
    } catch (error) {
      console.error(error);
    }
  };

  loadConfigFromBackend = async (screenId: string, isPreview = false, key = null) => {
    if (!screenId || screenId === 'null' || screenId === 'undefined') {
      console.warn('screenId为空，跳过后端配置加载');
      return null;
    }
    try {
      const headers = {};
      if (!isPreview) {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      let url = `/api/datai/big-screen/getConfig?screenId=${screenId}`;
      if (key) {
        url += `&key=${key}`;
      }

      let response = await fetch(url, { headers });

      if (!response.ok) {
        console.warn('代理请求失败，尝试直接访问后端');
        const directUrl = `http://localhost:8080/api/datai/big-screen/getConfig?screenId=${screenId}`;
        response = await fetch(directUrl, { headers });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.code === 200 && data.data && data.data.config) {
          try {
            const config = JSON.parse(data.data.config);
            console.log('从后端加载配置成功:', config);
            return config;
          } catch (error) {
            console.error('解析配置失败:', error);
            return null;
          }
        }
      }

      return null;
    } catch (error) {
      console.warn('从后端加载配置失败:', error);
      return null;
    }
  };

  /**
   * 请求大屏页面信息
   * @param identifyCode 页面pageID
   * @returns
   */
  fetchPage = async (identifyCode, isPreview = false, key = null) => {
    const {
      GlobalStore,
      PageTreeStore,
      VersionStore: { apiVersion },
    } = this.rootStore;

    const backendConfig = await this.loadConfigFromBackend(identifyCode, isPreview, key);

    if (backendConfig) {
      console.log('使用后端加载的配置');
      const rs = {
        code: '200',
        data: {
          id: 175669,
          isApp: true,
          jsonConfig: JSON.stringify(backendConfig),
          jsonMockConfig: '11',
          jsonPureConfig: '11',
          pageId: identifyCode,
          pageName: backendConfig.screenConfig?.title || '大屏',
          refJsonConfig: '{}',
          remarkVarInfo: '[]',
          remoteControlType: 0,
          terminalType: 1,
          version: 'dev',
        },
        message: '处理成功',
        success: true,
      };

      if (!rs || !rs.data) {
        return null;
      }

      return this.analyticInfo(rs.data);
    }

    console.log('使用默认配置');
    const rs = {
      code: '200',
      data: {
        id: 175669,
        isApp: true,
        jsonConfig:
          '{"compIds":[],"screenConfig":{"fonts":[],"pcSize":"1920X1080","width":1920,"height":1080,"opacity":"1","fontVar":"font","title":"面向数字孪生的低代码开发平台","baseUrl":"","scale":"initSize","favicon":"/assets/datai/icons/favicon.ico","environment":{"cardList":true,"indicator":true,"sandboxMarket":true,"cardMenu":true,"pageLayoutType":true,"sandboxShare":true,"cardMarket":true,"cardShare":true,"timeAndSpace":true,"gisSandbox":true,"cimSource":false,"basedOnWT":true,"cimVisualTemplateShow":true},"bucketName":"ioc-screen","tenantId":"default","ossProxy":"","pageId":"1895378739046699008","appId":"1895378739046699008","dataType":0,"mouseType":1,"loading":{"backgroundColor":"#040C1F","imgSrc":"/assets/datai/icons/loading.png","resetPageType":true},"scrollbar":{"size":6,"bgColor":"rgba(0,0,0,0.2)"},"preLoadResources":[],"screenBackground":"to bottom-#0d1117-#0d1117","screenBackgroundImage":"","filter":{"switchVal":false,"hueRotate":0,"saturation":0,"brightness":0,"contrastRatio":0,"opacity":100},"isMobile":false,"layerConfig":{"defaultLayerId":"1","activeLayerId":"1","layers":[{"layerId":"1","layerName":"基础图层","layerLevel":1,"key":"1","isDefault":true,"children":[],"editing":false,"visible":true}]}},"componentList":[],"dataStore":[]}',
        jsonMockConfig: '11',
        jsonPureConfig: '11',
        pageId: identifyCode,
        pageName: 'test',
        refJsonConfig: '{}',
        remarkVarInfo: '[]',
        remoteControlType: 0,
        terminalType: 1,
        version: 'dev',
      },
      message: '处理成功',
      success: true,
    };
    if (!rs || !rs.data) {
      return null;
    }

    return this.analyticInfo(rs.data);
  };

  /**
   * 请求卡片信息
   * @param identifyCode 卡片cardID
   * @returns
   */
  fetchCard = async (identifyCode) => {
    const { GlobalStore, LayerStore } = this.rootStore;
    const src = GetQueryString('src');
    let rs;
    if (src === 'market') {
      rs = await MARKETCARDINFOBYID({
        id: identifyCode, // 查询卡片集市中的卡片配置信息
      });
    } else if (identifyCode.length > 5) {
      rs = await CARDINFOBYUID({ sysCardId: identifyCode }); // 目前自增的卡片ID长度没有超过5，后续新建的卡片详情都走这里查询
    } else {
      rs = await CARDINFOBYID({ sysCardId: identifyCode });
    }
    if (rs.code !== '200') return;
    const { id } = rs.data;
    GlobalStore.updateScreenConfig(id, 'pageId');
    // console.log('rs.data.cardName', rs.data.cardName);
    window.titleName = rs.data.cardName || '';
    window.pageTypes = 'card';
    const config = {
      compIds: [],
      screenConfig: { ...cloneDeep(SCREENTCONFIG), bucketName: window.screenConfig.bucketName, pageId: id },
      componentList: [],
      relatedApis: [],
    };
    let list = rs.data.jsonConfig; // 反转义
    if (list) {
      try {
        list = JSON.parse(list);
        config.relatedApis = list.relatedApis || [];
        window.dataStore = list.dataStore || [];
        if (Object.prototype.hasOwnProperty.call(list, 'componentList')) {
          config.componentList = list.componentList;
          config.screenConfig = list.screenConfig || config.screenConfig;
          config.screenConfig.pageId = id; // 考虑到复制卡片的时候后端不会换这个参数
        } else {
          config.componentList = list;
        }
        if (window.screenConfig.bucketName && window.screenConfig.bucketName !== list.screenConfig?.bucketName) {
          config.screenConfig.bucketName = window.screenConfig.bucketName;
        }

        // 兼容老大屏没有图层
        if (config.screenConfig.layerConfig) {
          // 1. 更新默认图层id
          LayerStore.updateDefaultLayerId(config.screenConfig.layerConfig.defaultLayerId);
          // 2. 更新图层信息
          LayerStore.updateLayersState(config.screenConfig.layerConfig.layers);
          // 3. 更新上传保存时选中图层id
          LayerStore.changeActiveLayerId(config.screenConfig.layerConfig.activeLayerId);

          GlobalStore.updateScreenConfig(config.screenConfig.layerConfig, 'layerConfig');
        } else {
          // 给卡片一个默认图层
          const layerConfig = {
            defaultLayerId: LayerStore.defaultLayerId,
            activeLayerId: LayerStore.activeLayerId,
            layers: LayerStore.layers,
          };
          config.screenConfig.layerConfig = layerConfig;

          GlobalStore.updateScreenConfig(layerConfig, 'layerConfig');

          /*
          // 滤镜属性更新
          // 1. 取出之前滤镜属性
          const defaultFilter = { ...config.screenConfig.filter };
          // 2. 更新滤镜配置
          const filter = {};
          filter[layerConfig.defaultLayerId] = defaultFilter;
          list.screenConfig.filter = filter;

          GlobalStore.updateScreenConfig(filter, 'filter');
          */
        }

        // 兼容老大屏、新建大屏、导入大屏租户替换
        if (window.screenConfig.tenantId && window.screenConfig.tenantId !== list.screenConfig?.tenantId) {
          config.screenConfig.tenantId = window.screenConfig.tenantId;
        }

        // 兼容导入大屏时ossProxy替换
        if (window.screenConfig.ossProxy && window.screenConfig.ossProxy !== list.screenConfig.ossProxy) {
          list.screenConfig.ossProxy = window.screenConfig.ossProxy;
        }

        // 环境变量处理
        if (window.screenConfig.environment) {
          config.screenConfig.environment = window.screenConfig.environment;
        }

        if (!list.screenConfig?.pageId) {
          const { pageId } = this.rootStore.GlobalStore;
          config.screenConfig.pageId = pageId;
          window.screenConfig.pageId = pageId;
        }

        // 更新缓存的动态api list
        if (list.screenConfig?.dynamicApis) {
          config.screenConfig.dynamicApis = list.screenConfig.dynamicApis;
          GlobalStore.updateScreenConfig(list.screenConfig.dynamicApis, 'dynamicApis');
        } else {
          config.screenConfig.dynamicApis = [];
          GlobalStore.updateScreenConfig([], 'dynamicApis');
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      // 1. 新建的卡片添加一个默认图层
      const layerConfig = {
        defaultLayerId: LayerStore.defaultLayerId,
        activeLayerId: LayerStore.activeLayerId,
        layers: LayerStore.layers,
      };
      config.screenConfig.layerConfig = layerConfig;
      GlobalStore.updateScreenConfig(layerConfig, 'layerConfig');

      // 2. 自动创建一个卡片,默认添加一个卡片模板
      const categoryListVersions = categoryListTree[3].children[0].versions as Array<any>;
      const comItem = categoryListVersions.find((item) => item.englishName === 'CardTemplate');
      const com = initComponent(comItem);
      config.componentList = [com];
      window.dataStore = [];
      config.screenConfig.dynamicApis = [];
      // 环境变量处理
      if (window.screenConfig.environment) {
        config.screenConfig.environment = window.screenConfig.environment;
      }
    }

    // 关联接口
    if (config.relatedApis?.length > 0) {
      const apiParams = {
        filters: config.relatedApis.map(({ interfaceCode, id: apiId }) => {
          return {
            interfaceCode, // 换成不变的code
            pageId: rs.data.cardUid, // 后续创建的卡片都是用唯一不变的id
            apiId, // 通过id保存引用关系兼容项目现场没有升级大屏
          };
        }),
      };
      const res = await addApiRelatedByList(apiParams);
      if (res.code !== '200') {
        message.error('关联接口失败');
      }
    }

    DataI.each(config.componentList, (component) => {
      // 给每个组件设置layerId
      if (component.layerId !== LayerStore.defaultLayerId) {
        component.layerId = LayerStore.defaultLayerId;
      }

      // 兼容事件动作组
      const evts = component.eventSetings ?? [];
      component.eventSetings = compatibleEventSettings(evts);
    });

    // 所有组件设置父级key值
    config.componentList = replaceGroupKey(config.componentList);
    // 所有组件设置层级level值
    LayerStore.resetComponentLevel(config.componentList);
    // 所有组件设置显隐属性
    compatibleComVisiable(config.componentList);

    sortMapLayer(config.componentList);
    return this.newRender(config, id);
  };

  /**
   * 请求业务图层信息
   * @param identifyCode 业务图层layerID
   * @returns
   */
  fetchLayer = async (identifyCode) => {
    const rs = await InfoApis.GETLAYERCONFIG({
      layerUid: identifyCode,
    });
    if (!rs || !rs.data) {
      return null;
    }
    const { id } = rs.data;
    this.rootStore.GlobalStore.updateScreenConfig(id, 'pageId'); // 前端迁移OSS资源用的短ID
    return this.analyticInfo(rs.data);
  };

  getPageInfo = async (pageId) => {
    try {
      const rs = await this.fetchPage(pageId);
      if (!rs) {
        console.warn('fetchPage返回空结果，仍执行dynamicLoad以确保页面渲染');
        this.dynamicLoad();
        return;
      }
      $('.dataq-edit-console').addClass('operable');
      this.dynamicLoad();
    } catch (error) {
      console.error('getPageInfo加载失败，仍执行dynamicLoad以确保页面渲染:', error);
      this.dynamicLoad();
    }
  };

  getCardInfo = async (pageId) => {
    try {
      const rs = await this.fetchCard(pageId);
      if (!rs) {
        console.warn('fetchCard返回空结果，仍执行dynamicLoad以确保页面渲染');
        this.dynamicLoad();
        return;
      }
      const currentScreenConfig = JSON.parse(JSON.stringify(rs.screenConfig));
      const screenConfig = { fonts: [], ...currentScreenConfig };
      this.rootStore.GlobalStore.screenConfig = screenConfig || {};
      $('.dataq-edit-console').addClass('operable');
      this.dynamicLoad();
    } catch (error) {
      console.error('getCardInfo加载失败，仍执行dynamicLoad以确保页面渲染:', error);
      this.dynamicLoad();
    }
  };

  getLayerInfo = async (pageId) => {
    try {
      const rs = await this.fetchLayer(pageId);
      if (!rs) {
        console.warn('fetchLayer返回空结果，仍执行dynamicLoad以确保页面渲染');
        this.dynamicLoad();
        return;
      }
      const currentScreenConfig = JSON.parse(JSON.stringify(rs.screenConfig));
      const screenConfig = { fonts: [], ...currentScreenConfig };
      this.rootStore.GlobalStore.screenConfig = screenConfig || {};
      $('.dataq-edit-console').addClass('operable');
      this.dynamicLoad();
    } catch (error) {
      console.error('getLayerInfo加载失败，仍执行dynamicLoad以确保页面渲染:', error);
      this.dynamicLoad();
    }
  };

  dynamicLoad = async () => {
    const { EditorStore } = this.rootStore;
    const comList = EditorStore.getCompList();
    try {
      await dynamicLoadPlugins(comList);
    } catch {
      console.error('加载依赖资源失败');
    }
    try {
      await dynamicLoad2D(comList);
    } catch {
      console.error('加载2D地图资源失败');
    }
    try {
      await dynamicLoad3D(comList);
    } catch {
      console.error('加载3D地图资源失败');
    }
    runInAction(() => {
      if (EditorStore.screenConfigLoaded === 0) {
        EditorStore.setScreenLoaded();
      }
    });
  };

  loadScreenInfo = (urlType, pageId) => {
    switch (urlType) {
      case 'page': {
        this.getPageInfo(pageId);
        break;
      }
      case 'card': {
        this.getCardInfo(pageId);
        break;
      }
      case 'layer': {
        this.getLayerInfo(pageId);
        break;
      }
      default: {
        this.getPageInfo(pageId);
        break;
      }
    }
  };

  newRender = async (list, id) => {
    const { LayerStore, GlobalStore, EditorStore } = this.rootStore;
    const { bigScreenType } = GlobalStore;

    await dynamicLoadCommon();
    await dynamicLoadDataIComponents(list.componentList);
    const screenConfig = list.screenConfig || cloneDeep(SCREENTCONFIG);
    if (screenConfig.title === '云粒数智可视化大屏' || !screenConfig.title) {
      screenConfig.title = '面向数字孪生的低代码平台';
    }
    const titleDom = document.querySelector('#datai-title');
    titleDom && (titleDom.innerHTML = screenConfig.title);
    const favDom = document.querySelector('#datai-favicon') as HTMLLinkElement;
    if (favDom) {
      favDom.href = screenConfig.favicon || '/assets/datai/icons/favicon.ico';
    }

    const compIds = list.compIds || LayerStore.getAllIds();

    initComs(list.componentList, LayerStore.activeLayerId, bigScreenType);

    window.screenConfig = screenConfig;
    window.componentList = list.componentList;

    if (window.DataI) {
      window.DataI.each(window.componentList, (component) => {
        window.DataI.setComInfoMap(component);
        component.comCreated = !component.comInvisible;
        const evts = component.eventSetings ?? [];
        component.eventSetings = compatibleEventSettings(evts);
      });
    } else {
      console.warn('window.DataI未加载，跳过组件遍历');
      (window.componentList || []).forEach((component) => {
        component.comCreated = !component.comInvisible;
        const evts = component.eventSetings ?? [];
        component.eventSetings = compatibleEventSettings(evts);
      });
    }

    LayerStore.updateComList(list.componentList);
    if (list.screenConfig.layerConfig?.activeLayerId) {
      LayerStore.changeActiveLayerId(list.screenConfig.layerConfig.activeLayerId);
    }
    if (bigScreenType === 'card') {
      EditorStore.setCardEditMode();
    }
    window.saveAble = true;
    const obj = {
      comList: compIds,
      screenConfig,
      id,
    };
    return obj;
  };

  initLayerEditor = async (list) => {
    const { LayerStore, ComStore, EditorStore } = this.rootStore;
    // 加载地图依赖文件
    await dynamicLoadCommon();
    await dynamicLoad2D([], true);
    const layerName = ['弹窗图层', '搜索图层'];
    const data = [...layerName.map((v) => LayerStore.createLayer(v, false)), ...LayerStore.layers];
    // 默认添加 基础图层、搜索图层、弹窗图层
    LayerStore.updateLayersState(data);
    const map = {
      author: '杨云帅',
      componentCode: '@yl/datai-com-map-foundationPlan',
      componentName: '二维地图',
      englishName: 'MapFoundationPlan',
      id: '1344249189208367105',
      imgUrl:
        '//storage.inner.ioc/storage/file/v1/console/downloadFileByUrl?url=default/datai/icons/componentIcon/2dMap/2d基础平面图.png',
      importUrl: 'dataiComponentList/datai-com-map-foundationPlan-0.2.46',
      latestVersion: '0.2.46',
      status: 1,
      versionCode: '0.2.46',
    };
    // 基础图层默认添加地图组件
    const com = initComponent(map);

    com.styles.width = '1920px';
    com.styles.height = '1080px';
    com.styles.transform = 'translate(0px, 0px)';
    com.layerId = LayerStore.activeLayerId;
    window.DataI.addComKeyMap(com);
    list.componentList.unshift(com);
    // this.comList.unshift(com.key);
    // 更新默认选中的基础图层数据
    LayerStore.updateCurrentLayerComList([...list.componentList]);
    EditorStore.forceUpdate();
    // 地图默认添加底图层
    const child = {
      author: '赵天喜',
      componentCode: '@yl/datai-com-map-gaud-online',
      componentName: '在线底图',
      creator: '8a260638c4ce557b79793b1b75f191df',
      englishName: 'MapGaudOnline',
      gmtCreate: '2020-12-30 19:10:48',
      gmtModified: '2020-12-30 19:10:48',
      id: '1344239508993810434',
      imgUrl: '/oss/default//datai/icons/componentIcon/2dMap/高德在线地图.png',
      importUrl: 'dataiComponentList/datai-com-map-gaud-online-0.0.29',
      isDeleted: 0,
      latestVersion: '0.0.29',
      modifier: '8a260638c4ce557b79793b1b75f191df',
      status: 1,
      versionCode: '0.0.29',
    };
    // 延时2秒等待地图组件实例化完毕生成instance
    setTimeout(() => {
      // 添加在线底图层
      ComStore.addCom(child, com.key);
    }, 2000);
  };

  /**
   * 删除图层
   * @param layerId 图层id
   * @param identifyCode 页面id
   * @param cb 回调
   * @returns
   */
  deleteEditLayer = (layerId, identifyCode, cb?) => {
    return InfoApis.DELETEEDITLAYER({
      screenId: identifyCode,
      editSign: `${layerId}`,
      screenType: 1,
    });
  };

  // 请求自定义卡片分类列表
  getGategoryList = () => {
    return GETCATEGORYLIST({ sortType: 1, includeCount: true }).then((rs) => {
      const list = (rs && rs.data) || [];
      deepMapToTreeData(list);
      return list;
    });
  };

  /**
   * 获取屏幕信息
   */
  getScreenInfo = async (pageId) => {
    let res = null;
    const {
      VersionStore: { apiVersion },
      GlobalStore,
    } = this.rootStore;
    const { bigScreenType } = GlobalStore;
    if (bigScreenType === 'page') {
      res = await InfoApis.GETBYID({
        pageId,
        version: apiVersion,
      });
    } else if (bigScreenType === 'layer') {
      res = await InfoApis.GETLAYERCONFIG({
        layerUid: pageId,
      });
    }
    if (!res || !res.data) {
      return null;
    }
    let { jsonConfig } = res.data; // 反转义
    if (jsonConfig) {
      try {
        jsonConfig = JSON.parse(jsonConfig);
      } catch (error) {
        console.error(error);
      }
    } else {
      jsonConfig = {};
    }
    return jsonConfig;
  };

  /**
   * 公共保存信息
   * @param api 保存接口
   * @param data 数据
   * @param type 区分三个保存类型
   * @param cb 回调
   */
  saveInfo = async (api, data, type, cb) => {
    const {
      GlobalStore,
      OssStore,
      VersionStore: { apiVersion, currentVersion },
    } = this.rootStore;
    const { bigScreenId, bigScreenType } = GlobalStore;
    const { ossPathInfo } = OssStore;
    const isCard = type === 'card';
    const isLayer = type === 'layer';
    const isPage = type === 'page';

    // 处理变量中的data字段
    handleStoreData(window.dataStore);

    // 构造 jsonConfigStr
    let jsonConfigStr;
    let loadConfig;
    // 获取组件列表
    data.componentList = handleData(data.componentList, data.layerId, 'save'); // 删除 instance

    DataI.each(data.componentList, (component) => {
      /* 此处代码的作用是将动作组配置转换为兼容低版本的事件配置(后期不存在8.11以下版本的孔雀时可以删除) */
      component.eventSetings = restoreEventSettings(component.eventSetings);
    });

    // 获取变量
    data.dataStore = window.dataStore || [];
    if (isPage) {
      loadConfig = JSON.stringify(data.screenConfig.loading);
      jsonConfigStr = JSONfn.stringify(data);
    } else {
      jsonConfigStr = JSON.stringify(data);
    }

    // 存放标记变量
    const remarkVarInfo = [];
    window.dataStore.forEach((child) => {
      if (isPage) {
        child.children.forEach((item) => {
          if (!item.mapCompIds) {
            item.mapCompIds = [];
          }
        });
      }
      // 收集标记变量
      const arr = child.children?.filter((item) => item.isMark) || [];
      const copyChild = {
        ...child,
        children: arr,
      };
      remarkVarInfo.push(copyChild);
    });

    // 提取引用关系
    // 自定义组件
    const refInfoListCustomComp = findCustomComponents(data.componentList, isPage && currentVersion);
    let refInfoList = [];
    if (isCard) {
      refInfoList = [...refInfoListCustomComp];
    } else {
      // GIS图层
      const refInfoListGISLayer = findGISLayers(data.componentList, isPage && currentVersion);
      if (isLayer) {
        refInfoList = [...refInfoListCustomComp, ...refInfoListGISLayer];
      } else {
        // 业务图层
        const refInfoListLayerPage = await findLayerPages(data.componentList, isPage && currentVersion);
        refInfoList = [...refInfoListCustomComp, ...refInfoListGISLayer, ...refInfoListLayerPage];
      }
    }

    // 迁移非本屏目录下的资源
    const filteredDataJson = filterCardUrl(jsonConfigStr, ossPathInfo, bigScreenType);

    // 构造参数
    const paramsInfo = {
      id: isCard ? bigScreenId : undefined,
      layerUid: isLayer ? bigScreenId : undefined,
      pageId: isPage ? bigScreenId : undefined,
      jsonConfig: escape(filteredDataJson.filteredData).split('').reverse().join(''),
      jsonMockConfig: isPage ? '11' : undefined,
      jsonPureConfig: isPage
        ? '11'
        : isLayer
        ? undefined
        : escape(filteredDataJson.filteredData).split('').reverse().join(''),
      remarkVarInfo: JSON.stringify(remarkVarInfo),
      refInfoList,
      loadConfig: isPage ? loadConfig : undefined,
      version: apiVersion,
    };

    // 调用 API
    if (filteredDataJson.fileCopy === 'copyed') {
      const rs = await api(paramsInfo);
      if (Number(rs.code) === 200) {
        message.success(`${isLayer ? '图层' : isPage ? '页面' : '卡片'}保存成功！`);
        if (cb && typeof cb === 'function') {
          cb();
        }
      }
    } else {
      try {
        const fileCopyRs = await filteredDataJson.fileCopy;
        if (fileCopyRs && Number(fileCopyRs.code) === 200 && fileCopyRs.data) {
          const rs = await api(paramsInfo);
          if (Number(rs.code) === 200) {
            message.success(`${isLayer ? '图层' : isPage ? '页面' : '卡片'}保存成功！`);
            if (cb && typeof cb === 'function') {
              cb();
            }
          }
        } else {
          const rs = await api(paramsInfo);
          if (Number(rs.code) === 200) {
            message.success(`${isLayer ? '图层' : isPage ? '页面' : '卡片'}保存成功！`);
            if (cb && typeof cb === 'function') {
              cb();
            }
          }
          message.error('文件迁移失败！');
        }
      } catch (error) {
        console.error('资源迁移失败', error);
        message.error('保存失败，请检查网络！');
      }
    }
  };

  /**
   * 保存卡片
   * @param data
   * @param cb
   */
  saveCardInfoAPI = async (data, cb) => {
    const src = GetQueryString('src');
    data.screenConfig.environment = {};
    await this.saveInfo(src === 'market' ? UPDATECARDINFO : UPDATECARDINFO, data, 'card', cb);
  };

  /**
   * 保存业务图层
   * @param data
   * @param cb
   * @param type
   */
  saveLayerInfoAPI = async (data, cb, type?) => {
    data.screenConfig.initParams = window.screenConfig.initParams;
    if (!type && data.screenConfig.environment) {
      data.screenConfig.environment = {};
    }
    await this.saveInfo(InfoApis.UPDATELAYERCONFIG, data, 'layer', cb);
  };

  /**
   * 保存页面
   * @param data
   * @param UserStoreInfo
   * @param cb
   * @param type 是否保存environment
   */
  save = async (data, UserStoreInfo, cb, type?) => {
    let { userInfo } = UserStoreInfo;
    // 临时兼容 集成演示中心
    if (!userInfo) {
      try {
        if (localStorage.userInfo) {
          userInfo = JSON.parse(localStorage.userInfo);
        }
      } catch (error) {
        console.error('Error parsing localStorage.userInfo', error);
      }
    }
    data.screenConfig.initParams = window.screenConfig.initParams;
    if (!type && data.screenConfig.environment) {
      data.screenConfig.environment = {};
    }
    // loading 配置信息
    const loadConfig = JSON.stringify(data.screenConfig.loading);

    if (!type && data.screenConfig.environment) data.screenConfig.environment = {}; // 不保存环境变量

    data.componentList = handleData(data.componentList, data.layerId, 'save'); // 删除 instance
    handleStoreData(window.dataStore); // 处理变量中的data字段
    data.dataStore = window.dataStore || [];
    // 存放标记变量
    const remarkVarInfo = [];
    window.dataStore.forEach((child) => {
      child.children.forEach((item) => {
        if (!item.mapCompIds) {
          item.mapCompIds = [];
        }
      });
      // 收集标记变量
      const arr = child.children?.filter((item) => item.isMark) || [];
      const copyChild = {
        ...child,
        children: arr,
      };
      remarkVarInfo.push(copyChild);
    });
    const dataJson = JSONfn.stringify(data);

    // 取消 pending 中的请求
    clearPendingXhrList();
    await this.saveInfo(InfoApis.ADDITEM, data, 'page', cb);
  };

  /**
   * 全屏保存卡片信息
   * @param cb 回调函数
   */
  saveCardInfo = (cb) => {
    const { EditorStore, GlobalStore } = this.rootStore;
    if (window.componentList.length !== 1) {
      if (window.componentList.length === 0) {
        message.warning('布局模板根节点需为单一组件或组！');
        return;
      }
      if (cb && typeof cb === 'function') {
        cb();
      }
      return;
    }
    if (!window.saveAble) return;
    // v7.0.1 添加卡片顶级组的宽高重新计算，包含所有组件。
    // 获取顶级组
    const rootGroup = window.componentList[0];
    // 计算组的宽高位置
    computeGroupPos(rootGroup);
    // 刷新卡片顶级组
    EditorStore.forceCard();
    EditorStore.forceUpdateAttr();
    const screenConfig = toJS(GlobalStore.screenConfig);
    const data = {
      screenConfig,
      componentList: cloneDeep(window.componentList),
    };
    this.saveCardInfoAPI(data, cb);
  };

  /**
   * 全屏保存业务图层信息
   * @param cb 回调函数
   */
  saveLayerInfo = (cb) => {
    const { GlobalStore, LayerStore } = this.rootStore;
    const compIds = toJS(getAllIds(LayerStore));
    const screenConfig = toJS(GlobalStore.screenConfig);
    screenConfig.eventSetings = window.screenConfig.eventSetings;

    const data = {
      compIds,
      screenConfig,
      componentList: LayerStore.comList,
      layerId: `${LayerStore.activeLayerId}`,
    };
    this.saveLayerInfoAPI(data, cb);
  };

  /**
   * 全屏保存页面信息
   * @param cb 回调函数
   */
  savePageInfo = (cb) => {
    if (window.saveAble) {
      const { GlobalStore, LayerStore, UserStore, PageTreeStore } = this.rootStore;
      const compIds = toJS(getAllIds(LayerStore));
      const screenConfig = toJS(GlobalStore.screenConfig);
      screenConfig.eventSetings = window.screenConfig.eventSetings;

      const data = {
        compIds,
        screenConfig,
        componentList: LayerStore.comList,
        layerId: `${LayerStore.activeLayerId}`,
        pageInfo: (PageTreeStore as PageTree).getCurrentPage,
      };
      // 页面保存
      this.save(data, UserStore, cb);
    }
  };

  deepCleanObject = (obj) => {
    const seen = new WeakSet();

    const clean = (value) => {
      if (value === null || typeof value !== 'object') {
        return value;
      }

      if (seen.has(value)) {
        return null;
      }

      seen.add(value);

      if (Array.isArray(value)) {
        return value.map(clean);
      }

      const cleaned = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          if (
            value[key] instanceof HTMLElement ||
            key.startsWith('__react') ||
            key === 'instance' ||
            key === 'dom' ||
            key === 'el' ||
            key === 'element' ||
            key === 'node' ||
            key === 'target' ||
            key === 'source' ||
            (key === 'children' &&
              typeof value[key] === 'object' &&
              value[key] !== null &&
              !Array.isArray(value[key]))
          ) {
            continue;
          }
          cleaned[key] = clean(value[key]);
        }
      }

      seen.delete(value);
      return cleaned;
    };

    return clean(obj);
  };

  saveConfigToBackend = async () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

      if (!userInfo) {
        console.warn('用户未登录，跳过配置保存');
        return { success: false, message: '用户未登录' };
      }

      const { GlobalStore, LayerStore, PageTreeStore } = this.rootStore;
      const compIds = toJS(getAllIds(LayerStore));
      const screenConfig = toJS(GlobalStore.screenConfig);
      screenConfig.eventSetings = window.screenConfig?.eventSetings;

      const componentList = LayerStore.comList || window.componentList || [];
      console.log('保存时组件列表长度:', componentList.length);

      const currentPage = (PageTreeStore as PageTree).getCurrentPage;
      const pageInfo = currentPage || {
        pageConfig: {
          dynamicApis: [],
          layerConfig: {
            defaultLayerId: LayerStore.defaultLayerId,
            activeLayerId: LayerStore.activeLayerId,
            layers: LayerStore.layers,
          },
          filter: screenConfig.filter || {
            switchVal: false,
            hueRotate: 0,
            saturation: 0,
            brightness: 0,
            contrastRatio: 0,
            opacity: 100,
          },
        },
        componentList: componentList,
      };

      const completeConfig = {
        compIds,
        screenConfig,
        componentList: componentList,
        layerId: `${LayerStore.activeLayerId}`,
        pageInfo: pageInfo,
        dataStore: window.dataStore || [],
      };

      const cleanedConfig = this.deepCleanObject(completeConfig);

      const screenId = this.rootStore.GlobalStore.bigScreenId || localStorage.getItem('bigScreenId') || `screen_${Date.now()}`;
      localStorage.setItem('bigScreenId', screenId);

      let configJson;
      try {
        configJson = JSON.stringify(cleanedConfig);
        console.log('配置序列化成功');
      } catch (jsonError) {
        console.error('配置序列化失败:', jsonError);
        return { success: false, message: '配置序列化失败' };
      }

      const configData = {
        screenId: screenId,
        config: configJson,
        userId: userInfo.id || userInfo.userId,
      };

      try {
        const response = await fetch('/api/datai/big-screen/saveConfig', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(configData),
        });

        if (!response.ok) {
          throw new Error('保存配置失败');
        }

        const data = await response.json();
        if (data.code === 200) {
          console.log('配置保存成功');
          return { success: true, data: data.data };
        } else {
          console.warn('保存配置失败:', data.message);
          return { success: false, message: data.message };
        }
      } catch (apiError) {
        console.warn('后端服务不可用，使用本地存储模拟保存配置:', apiError);

        const savedConfigs = JSON.parse(localStorage.getItem('savedConfigs') || '[]');
        const existingIndex = savedConfigs.findIndex((config) => config.screenId === screenId);
        if (existingIndex >= 0) {
          savedConfigs[existingIndex] = {
            ...savedConfigs[existingIndex],
            config: cleanedConfig,
            userId: userInfo.id || userInfo.userId,
            created: new Date().toISOString(),
            status: '已配置',
          };
        } else {
          const newConfig = {
            id: Date.now(),
            screenId: screenId,
            config: cleanedConfig,
            userId: userInfo.id || userInfo.userId,
            created: new Date().toISOString(),
            status: '已配置',
          };
          savedConfigs.push(newConfig);
        }
        localStorage.setItem('savedConfigs', JSON.stringify(savedConfigs));

        console.log('配置已保存到本地存储（后端服务未启动）');
        return {
          success: true,
          data: existingIndex >= 0 ? savedConfigs[existingIndex] : savedConfigs[savedConfigs.length - 1],
          fromLocal: true,
        };
      }
    } catch (error) {
      console.error('保存配置错误:', error);
      return { success: false, message: error.message };
    }
  };

  /**
   * 全屏保存
   * @param cb 回调函数
   */
  saveScreen = (cb) => {
    const { GlobalStore } = this.rootStore;
    const { bigScreenType, isApp } = GlobalStore;
    if (bigScreenType === 'card') {
      this.saveCardInfo(cb); // 卡片保存
    } else if (bigScreenType === 'layer') {
      this.saveLayerInfo(cb); // 业务图层保存
    } else if (isApp) {
      // TODO 保存App页面信息
      this.saveAppPageInfo(cb);
    } else {
      this.savePageInfo(cb); // 页面保存
    }
  };

  /**
   * 子图层保存
   * @param cb 回调函数
   */
  saveLayer = async (cb) => {
    // 选中图层保存时，zIndex需要减1000，支持回退；
    const { GlobalStore, LayerStore, UserStore } = this.rootStore;
    const { bigScreenId, bigScreenType, isApp } = GlobalStore;
    // 取消 pending 中的请求
    clearPendingXhrList();
    if (isApp) {
      // TODO app 单图层保存
      this.saveAppLayer(cb);
      return;
    }
    // 查询原始数据
    const res = await this.getScreenInfo(bigScreenId);

    // console.log(res);
    const list = res.componentList || [];
    const screenConfig = toJS(GlobalStore.screenConfig);
    let compIds = res.compIds || toJS(getAllIds(LayerStore));
    // 原始屏图层数据
    let originLayers = res.screenConfig?.layerConfig?.layers ?? [];
    let activeLayer = originLayers.find((o) => o.layerId === LayerStore.activeLayerId);
    let index = 0;
    // 原始屏中不存在说明是新增的图层还未保存过
    if (activeLayer) {
      // 当前屏选中的图层数据，分图层保存将图层名称和是否可见状态保存起来
      const nowActiveLayer = LayerStore.layers.find((l) => l.layerId === LayerStore.activeLayerId);
      if (nowActiveLayer) {
        activeLayer.layerName = nowActiveLayer.layerName;
        activeLayer.visible = nowActiveLayer.visible;
      }
    } else {
      LayerStore.layers.forEach((l, idx) => {
        if (l.layerId === LayerStore.activeLayerId) {
          activeLayer = l;
          index = idx;
        }
      });
      if (bigScreenType === 'layer' && originLayers.length === 0) {
        // 业务图层编辑器新建图层默认保存三个图层
        originLayers = LayerStore.layers;
      } else {
        // 将新增的图层放到原始屏图层数据一起
        originLayers.splice(index, 0, activeLayer);
      }
    }
    // 获取原始屏组件
    const layerComList = originLayers.map((layer) => {
      return {
        layerId: layer.layerId,
        layerName: layer.layerName,
        componentList: list.filter((com) => com.layerId === layer.layerId),
      };
    });
    // 添加当前图层组件
    layerComList.forEach((l) => {
      if (l.layerId === LayerStore.activeLayerId) {
        l.componentList = LayerStore.currentLayerComList;
      }
    });
    // 生成需要保存的完整组件列表
    const componentList = layerComList.flatMap((layer) => {
      return layer.componentList || [];
    });
    // 需要保存的图层信息
    screenConfig.layerConfig.layers = originLayers;
    screenConfig.layerConfig.activeLayerId = LayerStore.activeLayerId;
    // screenConfig.dataType = this.screenConfig.dataType; // 子图层保存时也需要保存是否使用缓存数据
    compIds = [...new Set([...compIds, ...mapComKeys(toJS(LayerStore.currentLayerComList))])];

    // 分图层保存不同的变量组
    concatDataStore(res.dataStore || [], GlobalStore.invalidVariableKeys);

    const data = {
      compIds,
      screenConfig,
      componentList,
      layerId: `${LayerStore.activeLayerId}`,
      dataStore: window.dataStore,
    };

    if (bigScreenType === 'page') {
      this.save(data, UserStore, cb, 'layer');
    }

    if (bigScreenType === 'layer') {
      this.saveLayerInfoAPI(data, cb, 'layer');
    }
  };

  /**
   *  App页面单图层保存
   */
  saveAppLayer = async (cb) => {
    const {
      LayerStore,
      PageTabsStore,
      PageTreeStore,
      VersionStore: { apiVersion },
      GlobalStore: { bigScreenId },
    } = this.rootStore;
    const { appPageId } = LayerStore;
    const { selectedKey } = PageTabsStore;
    const { getPageInfo, getMapComponentListByPageId } = PageTreeStore;

    if (!selectedKey) {
      message.warning('请先选择页面');
      if (cb && typeof cb === 'function') {
        cb();
      }
      return;
    }
    if (selectedKey !== appPageId) {
      if (cb && typeof cb === 'function') {
        cb();
      }
      message.warning('页面切换发生错误');
      return;
    }
    try {
      // 查询原始数据
      const res = await AppPageApi.getPageInfo({ appPageId: selectedKey, appId: bigScreenId, version: apiVersion });
      if (Number(res.code) === 200) {
        let componentList = [];
        let mapComponentList = []; // 地图引用
        let pageConfig = {
          layerConfig: {
            activeLayerId: '',
            defaultLayerId: '',
            layers: [],
          },
          dynamicApis: [],
        };
        let jsonConfig = res?.data?.jsonConfig;
        if (jsonConfig) {
          jsonConfig = jsonConfig.replaceAll(/refcomname/gi, 'englishName');
          jsonConfig = JSON.parse(jsonConfig);
          componentList = jsonConfig.componentList || [];
          mapComponentList = jsonConfig.mapComponentList || [];
          pageConfig = jsonConfig.pageConfig || {
            layerConfig: {},
            dynamicApis: [],
          };
        }
        const list = componentList || [];
        // 原始屏图层数据
        const originLayers = pageConfig?.layerConfig?.layers ?? [];
        let activeLayer = originLayers.find((o) => o.layerId === LayerStore.activeLayerId);
        let index = 0;
        // 原始屏中不存在说明是新增的图层还未保存过
        if (activeLayer) {
          // 当前屏选中的图层数据，分图层保存将图层名称和是否可见状态保存起来
          const nowActiveLayer = LayerStore.layers.find((l) => l.layerId === LayerStore.activeLayerId);
          if (nowActiveLayer) {
            activeLayer.layerName = nowActiveLayer.layerName;
            activeLayer.visible = nowActiveLayer.visible;
          }
        } else {
          LayerStore.layers.forEach((l, idx) => {
            if (l.layerId === LayerStore.activeLayerId) {
              activeLayer = l;
              index = idx;
            }
          });
          // 将新增的图层放到原始屏图层数据一起
          originLayers.splice(index, 0, activeLayer);
        }
        // 获取原始屏组件
        const layerComList = originLayers.map((layer) => {
          return {
            layerId: layer.layerId,
            layerName: layer.layerName,
            componentList: list.filter((com) => com.layerId === layer.layerId),
          };
        });
        // 添加当前图层组件
        layerComList.forEach((l) => {
          if (l.layerId === LayerStore.activeLayerId) {
            l.componentList = LayerStore.currentLayerComList;
          }
        });
        // 引用地图组件添加当前图层地图子组件
        const currentMapComponentList = getMapComponentListByPageId(selectedKey);
        mapComponentList = mapComponentList.filter((m) => currentMapComponentList.some((c) => c.key === m.key)); // 过滤掉已删除的引用地图
        if (!mapComponentList || mapComponentList.length === 0) {
          mapComponentList = toJS(currentMapComponentList);
        } else {
          mapComponentList.forEach((m) => {
            const mapComp = currentMapComponentList.find((v) => v.key === m.key);
            if (mapComp) {
              const oldLayers = m.layers.filter((v) => v.layerId !== LayerStore.activeLayerId);
              const newLayers = mapComp.layers.filter((v) => v.layerId === LayerStore.activeLayerId);
              m.layers = [...oldLayers, ...newLayers];
            }
          });
        }
        // 生成需要保存的完整组件列表
        componentList = layerComList.flatMap((layer) => {
          return layer.componentList || [];
        });
        // 需要保存的图层信息
        const pageInfo = getPageInfo(selectedKey);
        if (pageInfo?.pageConfig) {
          pageConfig.dynamicApis = pageInfo.pageConfig.dynamicApis || [];
        }
        pageConfig.layerConfig = {
          layers: originLayers,
          activeLayerId: LayerStore.activeLayerId,
          defaultLayerId: LayerStore.defaultLayerId,
        };
        const { activeLayerId } = LayerStore;
        // console.log('pageConfig', pageConfig);
        const data = {
          pageConfig,
          pageEvents: jsonConfig?.pageEvents ?? {},
          componentList: toJS(componentList),
          mapComponentList,
        };
        this.saveAppPageApi(data, activeLayerId, selectedKey, originLayers.length === 1, cb);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * 保存应用
   */
  saveAPP = async (appPageId?, cb?) => {
    const {
      GlobalStore,
      PageTabsStore: { selectedKey },
      PageTreeStore: { getPageInfo },
      VersionStore: { apiVersion },
      ControlStore: { setIsDataStoreModify },
      LayerStore,
    } = this.rootStore;
    const { bigScreenId, screenConfig } = GlobalStore;
    let { allPageRefer } = GlobalStore;
    // 查询原始数据
    const res = await InfoApis.GETBYID({
      pageId: bigScreenId,
      version: apiVersion,
    });
    if (Number(res.code) === 200) {
      let curDataStore = [];
      // v8.6.0
      const { jsonConfig, refJsonConfig } = res.data;
      if (jsonConfig) {
        try {
          const jsonConfigStr = jsonConfig.replaceAll(/refcomname/gi, 'englishName');
          const jsonConfigObj = JSON.parse(jsonConfigStr);
          curDataStore = jsonConfigObj.dataStore || [];
        } catch {
          curDataStore = [];
        }
      }
      // console.log('refer allPageRefer1', allPageRefer);
      const curAppPageId = appPageId || selectedKey;
      if (curAppPageId && allPageRefer[curAppPageId]) {
        const pageName = allPageRefer[curAppPageId].pageName || '';
        // 需要保存的页面信息
        const pageInfo = getPageInfo(curAppPageId);
        const dynamicApis = pageInfo?.pageConfig?.dynamicApis || [];
        // v8.15.0 当前页保存，需要获取实时页面组件列表curAppPageId === selectedKey
        const componentList = curAppPageId === selectedKey ? toJS(LayerStore.comList) : pageInfo?.componentList || [];
        const { varRefer, apiRefer } = getCurPageRefer(pageName, componentList, dynamicApis);
        // console.log('refer varRefer', varRefer);
        // console.log('refer apiRefer', apiRefer);
        // v8.6.0 保存时防止页面覆盖，只更新当前页面
        if (refJsonConfig) {
          // v8.6.0 获取保存的页面最新引用关系
          // console.log('refer refJsonConfig2', refJsonConfig);
          const refJsonConfigStr = refJsonConfig.replaceAll(/refcomname/gi, 'englishName');
          const oldAllPageRefer = JSON.parse(refJsonConfigStr);
          oldAllPageRefer[curAppPageId] = {
            appPageId: curAppPageId,
            pageName,
            varRefer,
            apiRefer,
          };
          allPageRefer = oldAllPageRefer;
        } else {
          // console.log('refer refJsonConfig3', refJsonConfig);
          allPageRefer[curAppPageId].varRefer = varRefer;
          allPageRefer[curAppPageId].apiRefer = apiRefer;
        }
      }
      allPageRefer = toJS(allPageRefer);
      // console.log('refer allPageRefer2', allPageRefer);
      concatDataStore(curDataStore, GlobalStore.invalidVariableKeys);
      const appConfig = cloneDeep(toJS(screenConfig));
      delete appConfig.layerConfig;
      delete appConfig.dynamicApis;
      // 处理变量中的data字段
      handleStoreData(window.dataStore);
      const data = {
        dataStore: window.dataStore || [],
        appConfig: toJS(appConfig),
      };
      const loadConfig = JSON.stringify(appConfig.loading);
      const jsonConfigStr = JSONfn.stringify(data);
      const refJsonConfigStr = JSONfn.stringify(allPageRefer);
      // 存放标记变量
      const remarkVarInfo = [];
      window.dataStore.forEach((child) => {
        child.children.forEach((item) => {
          if (!item.mapCompIds) {
            item.mapCompIds = [];
          }
        });

        // 收集标记变量
        const arr = child.children?.filter((item) => item.isMark) || [];
        const copyChild = {
          ...child,
          children: arr,
        };
        remarkVarInfo.push(copyChild);
      });

      // 构造参数
      const paramsInfo = {
        pageId: bigScreenId,
        jsonConfig: escape(jsonConfigStr).split('').reverse().join(''),
        jsonMockConfig: '11',
        jsonPureConfig: '11',
        remarkVarInfo: JSON.stringify(remarkVarInfo),
        refJsonConfig: escape(refJsonConfigStr).split('').reverse().join(''),
        loadConfig,
        version: apiVersion,
      };
      const res2 = await InfoApis.ADDITEM(paramsInfo);
      if (res2 && res2.code === '200') {
        setIsDataStoreModify(false);
      }
      cb && cb();
    }
  };

  // 右侧应用属性面板保存应用
  debounceSaveAPP = debounce(this.saveAPP, 500);

  /** 保存app页面 */
  saveAppPageApi = async (data, layerId, appPageId, isFinished, cb?, from?: string) => {
    // 保存App页面时，也保存一下应用变量，防止遗漏变量修改。
    await this.saveAPP(appPageId); // 改成同步执行，这样 cb 是在所有接口返回后执行，切换版本需要确保这个时机
    const {
      OssStore,
      PageTreeStore,
      GlobalStore: { bigScreenType, bigScreenId },
      VersionStore: { apiVersion, currentVersion },
    } = this.rootStore;
    const { savePageInfo, resetPageState } = PageTreeStore;
    const { ossPathInfo } = OssStore;
    const isPage = bigScreenType === 'page';
    // 构造 jsonConfigStr
    // 获取组件列表
    data.componentList = handleData(data.componentList, layerId, 'save'); // 删除 instance
    data.mapComponentList = handleData(data.mapComponentList, layerId, 'save'); // 删除 instance

    DataI.each(data.componentList, (component) => {
      /* 此处代码的作用是将动作组配置转换为兼容低版本的事件配置(后期不存在8.11以下版本的孔雀时可以删除) */
      component.eventSetings = restoreEventSettings(component.eventSetings);
    });

    const jsonConfigStr = JSONfn.stringify(data);

    // 提取引用关系
    // 自定义组件
    const refInfoListCustomComp = findCustomComponents(data.componentList, isPage && currentVersion);
    // GIS图层
    const refInfoListGISLayer = findGISLayers(data.componentList, isPage && currentVersion);
    const refInfoListGISLayerReferenceMap = findGISLayers(data.mapComponentList, isPage && currentVersion); // 引用地图的图层引用关系
    // 业务图层
    const refInfoListLayerPage = await findLayerPages(data.componentList, isPage && currentVersion);
    const refInfoList = [
      ...refInfoListCustomComp,
      ...refInfoListGISLayer,
      ...refInfoListLayerPage,
      ...refInfoListGISLayerReferenceMap,
    ];

    // 迁移非本屏目录下的资源
    const filteredDataJson = filterCardUrl(jsonConfigStr, ossPathInfo, bigScreenType);

    // 构造参数
    const paramsInfo = {
      appId: bigScreenId,
      appPageId,
      jsonConfig: escape(filteredDataJson.filteredData).split('').reverse().join(''),
      refInfoList,
      version: apiVersion,
    };
    // 调用 API
    if (filteredDataJson.fileCopy === 'copyed') {
      const rs = await AppPageApi.savePage(paramsInfo);
      if (Number(rs.code) === 200) {
        if (from !== 'allEditingPages') message.success('页面保存成功！');
        runInAction(() => {
          if (isFinished) {
            const pageInfo = {
              componentList: data.componentList,
              // mapComponentList: data.mapComponentList,  // mapComponentList 可能不是最新的，不这样更新 savePageInfo 里会合并
              pageConfig: data.pageConfig,
              pageEvents: data.pageEvents,
            };
            savePageInfo(appPageId, pageInfo);
            resetPageState(appPageId);
          }
          if (cb && typeof cb === 'function') {
            cb();
          }
        });
      }
    } else {
      try {
        const fileCopyRs = await filteredDataJson.fileCopy;
        if (fileCopyRs && Number(fileCopyRs.code) === 200 && fileCopyRs.data) {
          const rs = await AppPageApi.savePage(paramsInfo);
          if (Number(rs.code) === 200) {
            if (from !== 'allEditingPages') message.success('页面保存成功！');
            runInAction(() => {
              if (isFinished) {
                const pageInfo = {
                  componentList: data.componentList,
                  pageConfig: data.pageConfig,
                };
                savePageInfo(appPageId, pageInfo);
                resetPageState(appPageId);
              }
              if (cb && typeof cb === 'function') {
                cb();
              }
            });
          }
        } else {
          message.error('文件迁移失败！');
          const rs = await AppPageApi.savePage(paramsInfo);
          if (Number(rs.code) === 200) {
            if (from !== 'allEditingPages') message.success('页面保存成功！');
            runInAction(() => {
              if (isFinished) {
                const pageInfo = {
                  componentList: data.componentList,
                  pageConfig: data.pageConfig,
                };
                savePageInfo(appPageId, pageInfo);
                resetPageState(appPageId);
              }
              if (cb && typeof cb === 'function') {
                cb();
              }
            });
          }
        }
      } catch (error) {
        console.error('资源迁移失败', error);
        if (from !== 'allEditingPages') message.error('保存失败，请检查网络！');
      }
    }
  };

  /**
   * 保存应用子页面信息，保存当前选中子页面
   * @param cb
   */
  saveAppPageInfo = (cb) => {
    const { LayerStore, PageTabsStore, PageTreeStore } = this.rootStore;
    const { selectedKey } = PageTabsStore;
    const { getPageInfo, getMapComponentListByPageId, getCurrentPageEvents } = PageTreeStore as PageTree;
    const { defaultLayerId, activeLayerId, layers } = LayerStore;
    if (!selectedKey) {
      message.warning('请先选择页面');
      return;
    }
    const pageInfo = getPageInfo(selectedKey);
    if (!pageInfo) {
      message.warning('页面还没加载完成');
      return;
    }
    const { pageConfig } = pageInfo;
    const componentList = toJS(LayerStore.comList);
    const mapComponentList = getMapComponentListByPageId(selectedKey);
    pageConfig.layerConfig = {
      defaultLayerId,
      activeLayerId,
      layers,
    };
    const data = {
      componentList,
      mapComponentList,
      pageConfig,
      pageEvents: getCurrentPageEvents,
    };
    // console.log('saveAppPageInfo pageConfig', pageConfig);
    this.saveAppPageApi(data, activeLayerId, selectedKey, true, cb);
  };

  /**
   * 保存页面封面
   * @param base64
   * @param identifyCode
   */
  savePagePreviewImg = (base64, identifyCode) => {
    const params = {
      id: identifyCode,
      previewImg: base64,
    };
    return InfoApis.POSTPAGEPREVIEWIMGURL(params);
  };

  /**
   * 保存卡片封面
   * @param base64
   * @param identifyCode
   */
  saveCardPreviewImg = (base64, identifyCode) => {
    const params = {
      id: identifyCode,
      previewImg: base64,
    };
    const src = GetQueryString('src');
    if (src === 'market') {
      return MARKETCARDPREVIEWIMGURL(params); // 更新卡片集市中的卡片预览图片
    }
    return CARDPREVIEWIMGURL(params);
  };

  /**
   * 保存业务图层封面
   * @param base64
   * @param identifyCode
   */
  saveLayerPreviewImg = (base64, identifyCode) => {
    const params = {
      id: identifyCode,
      previewImg: base64,
    };
    return InfoApis.UPDATELAYERPREIMAGE(params);
  };

  /**
   * 保存封面
   * @param base64
   */
  savePreviewImg = (base64) => {
    const { GlobalStore } = this.rootStore;
    const { bigScreenType, bigScreenId } = GlobalStore;
    if (bigScreenType === 'card') {
      this.saveCardPreviewImg(base64, bigScreenId); // 卡片保存
    } else if (bigScreenType === 'layer') {
      this.saveLayerPreviewImg(base64, bigScreenId); // 业务图层保存
    } else {
      this.savePagePreviewImg(base64, bigScreenId); // 页面保存
    }
  };

  // 查询字体列表
  queryFontList = (data) => {
    return FontApis.GETFONTLIST(data);
  };

  // 上传字体
  uploadFont = (data) => {
    return FontApis.UPLOADFONT(data);
  };

  // 删除字体
  deleteFontById = (fontId) => {
    return FontApis.DELETEFONT(fontId);
  };

  /**
   * 保存业务图层封面
   * @param base64
   * @param identifyCode
   */
  getAllPageInfo = () => {
    const { GlobalStore } = this.rootStore;
    const { bigScreenId } = GlobalStore;
    const params = {
      id: bigScreenId,
    };
    return AppPageApi.getAllPageInfo(params);
  };
}
