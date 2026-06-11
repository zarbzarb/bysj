import { makeAutoObservable } from 'mobx';
import * as Api from '@/services/apis/comApi';
import {
  map2dList,
  mapGlList,
  map3dList,
  mapTypeList,
  compVersionList,
  categoryListTree,
} from '@/staticJson/DataICompList';
import { templateThumbnailListType, chartCompTemplatesMap } from '@/staticJson/CompTemplates';
import { cloneDeep } from 'lodash';

/**
 * 左上角菜单栏存储对象
 */
export default class CompLibStore {
  rootStore = null;

  /** 所有datai组件列表 */
  comList = [];

  /** 地图子组件字典 */
  comQueue = {};

  /**  */
  categoryTree = [];

  /** 2d地图子组件 */
  map2dLayers = [];

  /** gl地图子组件 */
  mapGlLayers = [];

  /** 3d地图子组件 */
  map3dLayers = [];

  /** 自定义组件列表 */
  customList = [];

  /** 资源文件加载，可以包含地图资源 */
  sourceLoaded = false;

  /** 地图资源加载 */
  mapResLoaded = false;

  // 左侧模板列表显示
  showTempListByLib: boolean = false;

  // 右侧模板列表显示
  showTempListByAttr: boolean = false;

  currentComItem = null;

  // v8.12: 当前组件模板列表图片
  currentCompTemps: templateThumbnailListType = [];

  // 构造函数
  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  /**
   * 获取地图子组件字典和datai组件列表
   */
  getCategoryList = (environment) => {
    const { bigScreenType } = this.rootStore.GlobalStore;
    const comMap = {};
    for (const mapItem of mapTypeList) {
      for (const com of mapItem.mapList) {
        comMap[com.componentCode] = com;
      }
    }
    // 地图子组件字典
    this.comQueue = comMap;
    // 2d地图子组件
    this.map2dLayers = map2dList;
    // gl地图子组件
    this.mapGlLayers = mapGlList;
    // 3d地图子组件
    this.map3dLayers = environment.cimVisualTemplateShow
      ? map3dList
      : map3dList.filter((m) => m.englishName !== 'Map3DCimVisualTemplate');
    // 所有datai组件列表 122
    this.comList = compVersionList;

    let categoryTree = cloneDeep(categoryListTree); // data;
    if (bigScreenType === 'card') {
      // 卡片去掉地图
      categoryTree = categoryTree.filter((item) => {
        return item.categoryCode !== 'map';
      });
    }

    // 非 cim 环境不显示云端渲染组件
    if (!environment?.cimSource) {
      for (const item of categoryTree) {
        if (item.categoryCode === 'map') {
          for (const child of item.children) {
            if (child.categoryCode === 'mapControls') {
              const index = child.versions.findIndex((v) => v.englishName === 'UnrealEngine');
              if (index !== -1) {
                child.versions.splice(index, 1);
              }
            }
          }
        }
      }
    }
    // 大屏地图组件显隐通过数据权限控制
    if (!environment?.gisSandbox) {
      for (const item of categoryTree) {
        if (item.categoryCode === 'map') {
          // 智研院项目的场景互动基础组件
          item.children = (item.children as Array<any>).filter((v) => v.categoryCode === 'mapControls');
          for (const child of item.children) {
            if (child.categoryCode === 'mapControls') {
              child.versions = (child.versions as Array<any>).filter((v) => v.englishName === 'SceneFrame');
            }
          }
        }
      }
    }
    this.categoryTree = categoryTree;
  };

  /**
   * 获取自定义组件列表
   * @returns
   */
  getCustomComList = () => {
    if (this.customList.length > 0) return;
    const params = {
      currentPage: 1,
      pageSize: 2000,
    };
    /* Api.GETCUSTOMCOMPLIST(params)
      .then((rs) => {
        if (!rs.code) return false;
        if (Number(rs.code) !== 0 && Number(rs.code) !== 200) {
          return false;
        }
        // console.log('rs.data.records', rs.data.records);
        this.setCustomComList(rs.data.records.filter((v) => v.status === '2'));
        return rs;
      })
      .catch((error) => {
        console.error(error);
      }); */
  };

  /**
   * 设置自定义组件列表
   * 并且更新设置组件库分类树
   * @param data
   */
  setCustomComList = (data) => {
    // console.log('data', data);
    const comList = [];
    for (const v of data) {
      const comp = {
        parentType: 'customCom',
        compType: 'customCom',
        author: 'zengwei',
        enableFalg: 1,
        componentName: v.name,
        englishName: v.componentCode, // componentCode
        imgUrl: v.previewImg,
        releaseUrl: v.releaseUrl,
        supportMobile: true,
      };
      comList.push(comp);
    }
    this.customList = comList;
    this.updateCategoryTree(this.categoryTree, this.customList);
  };

  /**
   * 更新组件库分类树自定义组件列表
   */
  updateCategoryTree = (categoryTree, customList) => {
    for (const category of categoryTree) {
      if (category.categoryCode === 'custom') {
        // 获取自定义组件列表
        category.children[0].versions = customList;
      }
    }
  };

  /**
   * 资源文件加载是否完成 可以包含地图
   * @param flag true加载完成
   */
  setSourceLoaded = (flag) => {
    this.sourceLoaded = flag;
  };

  /**
   * 地图资源文件是否加载完成
   * @param flag
   */
  setMapResLoaded = (flag) => {
    this.mapResLoaded = flag;
  };

  setCurrentCompTemps = (list: templateThumbnailListType) => {
    this.currentCompTemps = list;
  };

  setShowTempListByLib = (bool: boolean) => {
    if (!bool) {
      Object.values(chartCompTemplatesMap).forEach((item) => {
        item.isActive = false;
      });
    }
    this.showTempListByLib = bool;
  };

  setShowTempListByAttr = (bool: boolean) => {
    if (!bool) {
      Object.values(chartCompTemplatesMap).forEach((item) => {
        item.isActive = false;
      });
    }
    this.showTempListByAttr = bool;
  };

  setCurrentComItem = (comItem) => {
    this.currentComItem = comItem;
  };
}
