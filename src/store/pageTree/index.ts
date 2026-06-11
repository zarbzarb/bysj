import { message } from 'antd';
import shortid, { SUUID } from 'short-uuid';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { makeObservable, runInAction, toJS, action, observable, computed } from 'mobx';

import { generateId } from '@/utils/random';
import { filter } from '@/utils/constant';
import { refreshPageTreeRefer } from '@/utils/pageListRefer';
import * as AppPageApi from '@/services/apis/appPageApi';
import { initInstance, initMapInstance } from '@/pages/Platform/Components/utils';
import * as PageEvent from '@/staticJson/PageEvent';
import { produce } from 'immer';
import { Actions as ActionsList } from '@/staticJson/AnimationComponentsList';
import actionInitJson from '@/pages/Platform/Attribute/components/Interactive/Components/SecondStep/settingsData';

import { cloneDeep, omit } from 'lodash';

import { compatibleEventSettings } from '@/utils/componentUtils';
import { LayerItem } from '../layerManager';

/**
 * 应用页面树
 */
// 页面类型
export enum PageType {
  folder = 0, // 文件夹691
  page = 1, // 页面
}

// 页面状态
export enum PageState {
  unnamed = 0, // 未命名
  named = 1, // 已命名
}

// 页面节点数据
export interface PageItem {
  appId: string; // 应用id
  appPageId: string; // 页面id
  children: PageItem[]; // 选项卡头显示内容
  id: string; // 对应 唯一标识
  isHomePage: boolean; // 是否主页
  isHomePageResidency: boolean; // 是否主页常驻
  name: string; // 文件夹/页面名称
  parentId: string; // 父类文件夹id
  sort: string; // 用于排序
  type: PageType; // 页面类型
  state: PageState; // 0 页面状态
  level: number; // 层级 从1开始
}

/**
 * 页面配置
 */
export interface PageConfig {
  dynamicApis: any[]; // 动态数据源引用的接口
  layerConfig: {
    // 图层信息
    defaultLayerId: string;
    activeLayerId: string;
    layers: Array<LayerItem>;
  };
}

/**
 * 页面信息
 *
 */
export interface PageInfo {
  // appPageId: string; // 对应 页面唯一标识
  pageConfig: PageConfig; // 页面配置
  componentList: any[]; // 组件列表
  mapComponentList?: any[]; // 引用地图列表
}

// 删除，需要校验子孙级是否存在页面，存在页面禁止删除
const hasPageNode = (list: PageItem[]) => {
  for (const node of list) {
    if (node.type === PageType.page) {
      return true;
    }
    if (node.children && hasPageNode(node.children)) {
      return true;
    }
  }
  return false;
};

/**
 * 遍历树查找key并进行操作
 * @param data
 * @param key
 * @param callback
 * @returns
 */
const loopTree: (
  data: PageItem[],
  key: string,
  callback: (node: PageItem, i: number, page: PageItem[]) => void,
) => any = (data, key, callback) => {
  for (let i = 0; i < data.length; i++) {
    if (data[i].appPageId === key) {
      return callback(data[i], i, data);
    }
    if (data[i].children) {
      loopTree(data[i].children, key, callback);
    }
  }
  return false;
};

export default class PageTreeStore {
  @observable rootStore;

  @observable isMount = false;

  // 页面树配置信息
  @observable pageTree: PageItem[] = [];

  @observable pageEvents: Record<string, PageEvent.PageEvents> = {};

  @observable eventClipboard?: {
    type?: 'event' | 'action';
    goods?: (typeof this.eventClipboard)['type'] extends 'event'
      ? PageEvent.PageEvent | PageEvent.CompEvent
      : PageEvent.Action;
  } = {};

  @observable selectedEventOrAction: AnyKey | null = null;

  // 页面信息存储
  @observable.shallow pageInfoMap: Record<string, PageInfo> = {};

  // 事件交互里的跨页面选择信息存储, 不用上面 pageInfoMap 是因为交互里根据页面拉取组件不需要渲染画布
  @observable.shallow actionPageInfoMap: Record<string, PageInfo> = {};

  // 普通页引用地图存储
  @observable.shallow mapReferenceMap: Record<string, any> = {};

  // 页面状态存储
  @observable pageStateMap: Record<string, number> = {};

  // 页面状态存储
  @observable pageInitStateMap: Record<string, number> = {};

  // 页面资源加载是否完成存储
  @observable pageSourceLoadedMap: Record<string, boolean> = {};

  // 选中节点key
  @observable selectedPageIds: string[] = [];

  // 选中节点数据
  @observable selectedItem: PageItem = null;

  // 上一个重命名节点数据
  @observable preItem: PageItem = null;

  // 主页面id
  @observable homePageId = '';

  // homePageBase64 = '';

  // 主页常驻
  @observable isHomePageResidency = false;

  // 当前普通页引用主页的地图列表
  @observable.shallow currentMapComponentList = [];

  // constructor(rootStore) {
  //   makeAutoObservable(this);
  //   this.rootStore = rootStore;
  // }
  constructor(rootStore) {
    this.rootStore = rootStore;
    makeObservable(this);
  }

  @computed get isCloseAble() {
    const { PageTabsStore } = this.rootStore;
    const { pageKeyList } = PageTabsStore;
    return !pageKeyList.some((appPageId) => {
      const step = this.pageStateMap[appPageId] ?? 0;
      const initStep = this.pageInitStateMap[appPageId] ?? 0;
      console.log('step', step);
      console.log('initStep', initStep);
      return step !== initStep;
    });
  }

  @computed get isHomePage() {
    const {
      PageTabsStore: { selectedKey },
    } = this.rootStore;
    return this.homePageId === selectedKey;
  }

  /**
   * 重置属性或状态
   */
  reset = () => {
    this.pageTree = [];
    this.pageInfoMap = {};
    this.actionPageInfoMap = {};
    this.mapReferenceMap = {};
    this.pageStateMap = {};
    this.pageInitStateMap = {};
    this.pageSourceLoadedMap = {};
    this.selectedPageIds = [];
    this.selectedItem = null;
    this.homePageId = '';
    this.isHomePageResidency = false;
    this.currentMapComponentList = [];
  };

  @action mount = () => {
    if (this.isMount) this.isMount = true;
  };

  /**
   * 获取编辑中的页面 id 列表
   * @returns
   */
  @action getEditingPages = () => {
    const { PageTabsStore } = this.rootStore;
    const { pageKeyList } = PageTabsStore;
    const list = pageKeyList.filter(
      (id) => Number(this.pageStateMap[id] ?? 0) !== Number(this.pageInitStateMap[id] ?? 0),
    );
    return list;
  };

  /**
   * 加载页面树
   * @param appId 应用id
   */
  @action loadPageTree = async (appId: string, isFirst?: boolean) => {
    try {
      const {
        VersionStore: { apiVersion },
      } = this.rootStore;
      // const res = await AppPageApi.getPageList(appId, { version: apiVersion });
      const res = {
        code: '200',
        data: {
          appPageId: '1895378761658929152',
          id: '8382',
          isHomePageResidency: false,
          sysAppPageRefVOList: [
            {
              appId: '1895378739046699008',
              appPageId: '1895378761658929152',
              id: '8382',
              isHomePage: true,
              isHomePageResidency: false,
              level: 1,
              name: '主页',
              parentId: 0,
              sort: 1,
              type: 1,
            },
          ],
        },
        message: '处理成功',
        success: true,
      };

      if (Number(res.code) === 200) {
        const { sysAppPageRefVOList } = res.data;
        // 无页面时添加默认主页
        if (sysAppPageRefVOList.length === 0) {
          const params = {
            appId,
            name: '主页',
            parentId: '0',
            type: PageType.page,
            version: apiVersion,
          };
          try {
            const res2 = await AppPageApi.addPageOrFolder(params);
            if (Number(res2.code) === 200) {
              // message.success('添加成功');
              runInAction(() => {
                this.loadPageTree(appId, true);
              });
            } else {
              message.warning(res.message);
            }
          } catch (error) {
            console.error(error);
          }
        } else {
          runInAction(() => {
            this.setPageListInfo(res.data);
            if (isFirst) {
              this.selectedPageIds = [this.homePageId];
              loopTree(this.pageTree || [], this.homePageId, (item) => {
                this.setSelectedItem(item);
                const { PageTabsStore } = this.rootStore;
                PageTabsStore.addTab(item);
              });
              this.fetchPageInfoByAppPageId(this.homePageId).catch((error) => {
                console.error('加载主页信息失败:', error);
              });
            }
          });
        }
      } else {
        message.warning(res.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   *
   * @param data 获取页面信息
   * @returns
   */
  @action fetchPageInfoByAppPageId = async (appPageId: string) => {
    const {
      ServiceStore,
      GlobalStore,
      PageTabsStore,
      VersionStore: { apiVersion, versionLoading, setVersionLoading },
    } = this.rootStore;
    try {
      const { bigScreenId } = GlobalStore;
      // const res = await AppPageApi.getPageInfo({ appPageId, appId: bigScreenId, version: apiVersion });
      const res = {
        code: '200',
        data: {
          appId: '1895378739046699008',
          appPageId: '1895378761658929152',
          id: 8062,
          jsonConfig: null,
        },
        message: '处理成功',
        success: true,
      };
      if (appPageId !== PageTabsStore.selectedKey) return; // v8.10：修复切换页面比接口返回快的时候，画布会显示其他页面组件的问题
      if (versionLoading) {
        setVersionLoading(false);
        // 切换版本不能立马清除而是放在接口后清除，因为切换过程中可能有界面渲染执行获取组件逻辑
        window.DataI.destroy();
      }
      if (Number(res.code) === 200) {
        let componentList = [];
        let mapComponentList = [];
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
            ] as Array<LayerItem>,
          },
          // v8.10 页面对应的滤镜配置
          filter: { ...filter },
        };
        let pageEvents;
        let jsonConfig = res?.data?.jsonConfig;
        if (jsonConfig) {
          jsonConfig = jsonConfig.replaceAll(/refcomname/gi, 'englishName');
          jsonConfig = JSON.parse(jsonConfig);
          componentList = jsonConfig.componentList || [];
          mapComponentList = jsonConfig.mapComponentList || [];
          if (jsonConfig.pageConfig) {
            pageConfig = jsonConfig.pageConfig;
            // 兼容旧屏没有 filter 配置情况，手动加上
            if (!jsonConfig.pageConfig.filter) pageConfig.filter = { ...filter };
          }
          if (jsonConfig.pageEvents) pageEvents = jsonConfig.pageEvents;
        }

        window.DataI.each(componentList, (component) => {
          // 兼容事件动作组
          const evts = component.eventSetings ?? [];
          component.eventSetings = compatibleEventSettings(evts);
        });

        runInAction(async () => {
          await ServiceStore.updateComponentList(componentList, pageConfig, appPageId);
          const pageInfo: PageInfo = {
            pageConfig,
            componentList,
            mapComponentList,
          };
          this.pageEvents[appPageId] = this.setActionKeysIfNotExistForEvents(pageEvents ?? {});
          this.pageInfoMap[appPageId] = pageInfo;
          this.pageStateMap[appPageId] = 0;
          this.pageInitStateMap[appPageId] = 0;
          window.pageInfoMap = this.pageInfoMap; // 方便测试
        });
      } else {
        message.warning(res.message);
      }
    } catch (error) {
      console.error(error);
      if (versionLoading) setVersionLoading(false);
    }
  };

  setActionKeysIfNotExistForEvents = (evts: PageEvent.PageEvents): PageEvent.PageEvents =>
    Object.fromEntries(
      Object.entries(evts).map(([key, evt]) => [
        key,
        {
          activeIdx: 0,
          ...(omit(evt, ['conditions', 'actions']) as PageEvent.PageEvent),
          groups: evt.groups
            ? evt.groups
            : [
                {
                  key: shortid.generate().toString(),
                  conditions: [],
                  actions: evt.actions.map((act) => ({
                    ...act,
                    actionKey: act.actionKey ?? shortid.generate().toString(),
                  })),
                },
              ],
        },
      ]),
    );

  /**
   * v8.3: 涉及跨页面交互有用到
   * @param data 只获取页面信息，不渲染画布
   * @returns
   */
  @action simpleFetchPageInfoByAppPageId = async (appPageId: string, cb: () => void) => {
    try {
      const {
        GlobalStore: { bigScreenId },
        VersionStore: { apiVersion },
      } = this.rootStore;
      const res = await AppPageApi.getPageInfo({ appPageId, appId: bigScreenId, version: apiVersion });
      if (Number(res.code) === 200) {
        let componentList = [];
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
            ] as Array<LayerItem>,
          },
        };
        let jsonConfig = res?.data?.jsonConfig;
        if (jsonConfig) {
          jsonConfig = jsonConfig.replaceAll(/refcomname/gi, 'englishName');
          jsonConfig = JSON.parse(jsonConfig);
          componentList = jsonConfig.componentList || [];
          if (jsonConfig.pageConfig) {
            pageConfig = jsonConfig.pageConfig;
          }
        }
        // 先存起来是为了跨页面交互中执行 getComponentByKey 能拿到组件（不会影响左侧页面选择）
        window.DataI.each(componentList, (component) => {
          // 组件树转为map映射
          if (!window.DataI.COMINFOMAP[component.key]) {
            window.DataI.setComInfoMap(component);
          }
        });
        const pageInfo = {
          pageConfig,
          componentList,
        };
        this.actionPageInfoMap[appPageId] = pageInfo;
        cb && cb(); // 执行回调
      } else {
        message.warning(res.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * 设置页面列表信息
   * @param data
   * @param isRefresh 是否需要刷新页面引用关系
   */
  @action setPageListInfo = (data, isRefresh = true) => {
    const { GlobalStore } = this.rootStore;
    const { allPageRefer, updateAllPageRefer } = GlobalStore;

    const { appPageId, isHomePageResidency, sysAppPageRefVOList } = data;
    this.pageTree = sysAppPageRefVOList;
    this.homePageId = appPageId;
    this.isHomePageResidency = isHomePageResidency;

    // v8.6.0 刷新页面引用关系
    if (isRefresh) {
      const newAllPageRefer = refreshPageTreeRefer(sysAppPageRefVOList, allPageRefer);
      // console.log('refer newAllPageRefer', newAllPageRefer);
      updateAllPageRefer(newAllPageRefer);
    }
  };

  /**
   * 新建文件或者页面
   * @param type 区分文件夹和页面
   */
  @action addItem = async (type: PageType, appId: string) => {
    const {
      VersionStore: { apiVersion },
    } = this.rootStore;
    const name = type === PageType.folder ? '文件夹' : '页面';
    // 获取父节点
    let parentId = '0';
    if (this.selectedItem) {
      // 选中文件夹
      if (this.selectedItem.type === PageType.folder && this.selectedItem.level === 5) {
        message.info('列表层级限制到5级！');
        return;
      }
      // 选中页面
      if (this.selectedItem.type === PageType.page && this.selectedItem.level > 5) {
        message.info('列表层级限制到5级！');
        return;
      }
      parentId = this.selectedItem.type === PageType.folder ? this.selectedItem.id : this.selectedItem.parentId;
    }
    try {
      const params = {
        appId,
        name,
        parentId,
        type,
        version: apiVersion,
      };
      const res = await AppPageApi.addPageOrFolder(params);
      if (Number(res.code) === 200) {
        message.success('添加成功');
        this.loadPageTree(appId);
      } else {
        message.warning(res.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * 设置选中节点keys数组
   * @param keys
   */
  @action setSelectedPageIds = (keys: string[]) => {
    this.selectedPageIds = keys;
  };

  /**
   * 设置选中节点数组
   * @param keys
   */
  @action setSelectedItem = (item?: PageItem) => {
    this.selectedItem = item;
    if (item && item.isHomePage) {
      this.currentMapComponentList = [];
    }
  };

  /**
   * 删除页面/文件夹
   */
  @action deleteItem = async () => {
    if (!this.selectedItem) {
      message.info('请先选择页面或者文件夹');
      return;
    }
    if (this.selectedItem.children && hasPageNode(this.selectedItem.children)) {
      message.info('当前文件夹下存在页面禁止删除！');
      return;
    }
    try {
      const { id, appId, type, appPageId } = this.selectedItem;
      const res = await AppPageApi.deletePageOrFolder({ id });

      if (Number(res.code) === 200) {
        message.success('删除成功');
        this.setSelectedPageIds([]);
        this.loadPageTree(appId);
        // 页面删除，tab栏也要做对应的删除
        if (type === PageType.page) {
          const { PageTabsStore } = this.rootStore;
          const { deleteTab } = PageTabsStore;
          deleteTab(appPageId);
        }
      } else {
        message.warning(res.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * 设置主页
   */
  @action setMainPage = async () => {
    if (!this.selectedItem) {
      message.info('请先选择页面');
      return;
    }
    const { appId, appPageId } = this.selectedItem;
    const {
      VersionStore: { apiVersion },
    } = this.rootStore;
    try {
      const res = await AppPageApi.setHomePage({ appId, appPageId, version: apiVersion });
      if (Number(res.code) === 200) {
        message.success('设置主页面成功');
        this.resetMapComponentList(); // 重置普通页的引用地图数据
        this.loadPageTree(appId);
      } else {
        message.warning(res.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * 重命名
   */
  @action rename = () => {
    if (!this.selectedItem) {
      message.info('请先选择页面或者文件夹');
      return;
    }
    if (this.preItem && this.preItem.state === PageState.unnamed) {
      this.preItem.state = PageState.named;
    }
    this.selectedItem.state = PageState.unnamed;
    this.preItem = this.selectedItem;
  };

  /**
   *
   * @param item 重命名保存
   */
  @action saveRename = async (item) => {
    try {
      const { id, name, appId } = item;
      const res = await AppPageApi.renamePageOrFolder({ id, name });

      if (Number(res.code) === 200) {
        this.loadPageTree(appId);
      } else {
        message.warning(res.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * 设置主页常驻
   */
  @action setMainPageResidence = async (operation) => {
    if (!this.selectedItem) {
      message.info('请先选择主页面');
      return;
    }
    try {
      const { appId, id } = this.selectedItem;
      const res = await AppPageApi.setHomePageResidency({ id, operation });

      if (Number(res.code) === 200) {
        message.success(operation ? '设置主页面常驻成功' : '取消主页面常驻成功');
        this.loadPageTree(appId);
      } else {
        message.warning(res.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * 拖拽更新列表
   */
  @action updatePageList = async (params, appId) => {
    try {
      const res = await AppPageApi.updatePageList(params);
      if (Number(res.code) === 200) {
        this.loadPageTree(appId);
      } else {
        message.warning(res.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * 导出页面
   * @param params
   */

  @action exportAppPage = async (params: { idList: string[]; ossNeed: boolean; type: number; version: any }) => {
    try {
      const res = await AppPageApi.exportAppPage(params);
      if (+res.code === 200) {
        message.success('导出任务创建成功，请前往导出任务列表下载');
      } else {
        message.warning(res.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * 复制页面
   */
  @action copyAppPage = async () => {
    const { id, appId } = this.selectedItem;
    const res = await AppPageApi.copyAppPage(id);
    try {
      if (+res.code === 200) {
        message.success('复制成功');
        this.loadPageTree(appId);
      } else {
        message.warning(res.message);
      }
    } catch {
      console.log('res', res);
    }
  };

  /**
   * 设置当前选中页面操作步骤
   * @param step
   */
  @action setPageInfoStep = (step: number) => {
    const { PageTabsStore } = this.rootStore;
    const { selectedKey } = PageTabsStore;
    if (selectedKey) {
      let curStep = this.pageStateMap[selectedKey];
      curStep += step;
      this.pageStateMap[selectedKey] = curStep;
    }
  };

  /** 获取当前页面信息
   * # Return
   * - PageInfo: 当前页面信息
   *
   * # Nullable
   * 此页面上不存在事件
   *
   * # Example
   * @example
   * const { pageTreeStore } = Store;
   * pageTreeStore.currentPage // Object {...}
   */
  @computed get getCurrentPage(): PageInfo | null {
    const { selectedKey } = this.rootStore.PageTabsStore;
    const currentPage = this?.pageInfoMap?.[selectedKey];
    return currentPage ?? null;
  }

  @action setCurrentPage = (fn: (p: PageInfo) => void): PageInfo | null => {
    const { selectedKey } = this.rootStore.PageTabsStore;
    const currentPage = this?.pageInfoMap?.[selectedKey];

    produce(currentPage, fn);

    return null;
  };

  @action eventCopy = <T extends 'event' | 'action'>(
    type: T,
    goods: T extends 'event' ? PageEvent.PageEvent | PageEvent.CompEvent : PageEvent.Action,
  ) => {
    this.eventClipboard.type = type;
    this.eventClipboard.goods = goods;
  };

  @action selectEvtOrAct = (key: AnyKey | null) => (this.selectedEventOrAction = key);

  /** 获取当前页面事件
   * # Return
   * - PageEvent.Events: 当前页面事件
   *
   * # Nullable
   * 此页面上不存在事件
   *
   * # Example
   * @example
   * const { pageTreeStore } = Store;
   * pageTreeStore.getCurrentPageEvents // Object {...}
   */
  @computed get getCurrentPageEvents(): PageEvent.PageEvents | null {
    const { selectedKey } = this.rootStore.PageTabsStore;
    const evt = this?.pageEvents?.[selectedKey];
    return evt ?? null;
  }

  /** 修改页面事件组
   * # Nullable
   * 正常执行返回 `null`
   *
   * # Error
   * - `'NoExistCurrentPage'`: 无法找到`当前页面`
   *
   * # Example
   * @example
   * const { pageTreeStore } = Store;
   * pageTreeStore.setEventsCollection('Hooks 执行前'); // null
   */
  @action setEventsCollection = (fn: (evts: PageEvent.PageEvents) => void): null | 'NoExistCurrentPage' => {
    const { selectedKey } = this.rootStore.PageTabsStore;

    const currentPage = this?.pageInfoMap?.[selectedKey];

    if (!currentPage) return 'NoExistCurrentPage';

    if (!this.pageEvents?.[selectedKey]) this.pageEvents[selectedKey] = {};
    const events = this.pageEvents[selectedKey];

    fn(events);

    return null;
  };

  /** 为当前页面添加事件
   * # Return
   * - SUUID: 插入正常, 返回插入事件的 Key
   *
   * # Error
   * - `'NoExistCurrentPage'`: 无法找到`当前页面`
   * - `'ExistingSingleOnlyEventType'`: 这个事件在一个页面中只能存在一个(`once === true`), 而页面中已经存在这样的事件了
   *
   * # Example
   * @example
   * const { pageTreeStore } = Store;
   * pageTreeStore.addEventsCurrent('Hooks 执行前'); // '7DQk7goLAqJMxbBN75LLfo'
   */
  @action addEventCurrentPage = (
    eventType: PageEvent.PageEventType,
  ): SUUID | 'NoExistCurrentPage' | 'ExistingSingleOnlyEventType' => {
    const { selectedKey } = this.rootStore.PageTabsStore;

    const currentPage = this?.pageInfoMap?.[selectedKey];

    if (!currentPage) return 'NoExistCurrentPage';

    if (!this.pageEvents?.[selectedKey]) this.pageEvents[selectedKey] = {};
    const events = this.pageEvents[selectedKey];

    const isOnce = PageEvent.EventsList[eventType].once;

    if (isOnce && Object.entries(events).some(([, e]) => e.eventType === eventType))
      return 'ExistingSingleOnlyEventType';

    const suuid = shortid.generate();

    events[suuid.toString()] = {
      eventType,
      isActive: true,
      activeIdx: 0,
      groups: [{ key: shortid.generate(), actions: [], conditions: [] }],
    };

    return suuid;
  };

  /** 移除当前页面中的指定事件
   * # Return
   * - null: 成功移除
   *
   * # Error
   * - `'NoExistKeyMapEvent'`: 不存在提供的 Key 对应的事件
   * - `'NoExistCurrentPage'`: 无法找到`当前页面`
   * - `'NoEventsExist'`: 当前页面中的 `events` 对象未初始化 (会在第一次添加事件的时候自动初始化)
   *
   * # Example
   * @example
   * const { pageTreeStore } = Store;
   * const key = pageTreeStore.addEventsCurrent('Hooks 执行前');
   * pageTreeStore.removeEventsCurrentByKey(key); // null
   */
  @action removeEventCurrentByKey = (
    key: string | SUUID,
  ): null | 'NoExistCurrentPage' | 'NoEventsExist' | 'NoExistKeyMapEvent' => {
    const { selectedKey } = this.rootStore.PageTabsStore;

    const currentPage = this?.pageInfoMap?.[selectedKey];

    if (!currentPage) return 'NoExistCurrentPage';

    if (!this.pageEvents?.[selectedKey]) return 'NoEventsExist';
    const events = this.pageEvents[selectedKey];

    const tarEvent = events[key.toString()];

    if (!tarEvent) return 'NoExistKeyMapEvent';

    delete events[key.toString()];

    return null;
  };

  /** 设置当前页面中的指定事件
   * # Return
   * - null: 成功设置
   *
   * # Error
   * - `'NoExistKeyMapEvent'`: 不存在提供的 Key 对应的事件
   * - `'NoExistCurrentPage'`: 无法找到`当前页面`
   * - `'NoEventsExist'`: 当前页面中的 `events` 对象未初始化 (会在第一次添加事件的时候自动初始化)
   *
   * # Example
   * @example
   * const { pageTreeStore } = Store;
   * const key = pageTreeStore.addEventsCurrent('Hooks 执行前');
   * pageTreeStore.setEventCurrentByKey(key, (evt) => evt.customName = "DON'T PANIC"); // null
   */
  @action setEventCurrentByKey = (
    key: string | SUUID,
    fn: (evt: PageEvent.PageEvent) => void,
  ): null | 'NoExistCurrentPage' | 'NoEventsExist' | 'NoExistKeyMapEvent' => {
    const { selectedKey } = this.rootStore.PageTabsStore;

    const currentPage = this?.pageInfoMap?.[selectedKey];

    if (!currentPage) return 'NoExistCurrentPage';

    if (!this.pageEvents?.[selectedKey]) return 'NoEventsExist';
    const events = this.pageEvents[selectedKey];

    const tarEvent = events[key.toString()];

    if (!tarEvent) return 'NoExistKeyMapEvent';

    fn(events[key.toString()]);

    return null;
  };

  /** 为当前页面的一个事件添加动作
   * # Return
   * - number: 插入正常, 返回索引
   *
   * # Error
   * - `'NoExistKeyMapEvent'`: 不存在提供的 Key 对应的事件
   * - `'NoExistCurrentPage'`: 无法找到`当前页面`
   * - `'NoEventsExist'`: 当前页面中的 `events` 对象未初始化 (会在第一次添加事件的时候自动初始化)
   *
   * # Example
   * @example
   * const { pageTreeStore } = Store;
   * const key = pageTreeStore.addEventsCurrent('Hooks 执行前'); // '7DQk7goLAqJMxbBN75LLfo'
   * pageTreeStore.addActionForEventCurrentPage(key, 'updateData');
   */
  @action pushActionForEventCurrentPage = (
    evtKey: string | SUUID,
    actionType: PageEvent.ActionType,
  ): number | 'NoExistCurrentPage' | 'NoEventsExist' | 'NoExistKeyMapEvent' => {
    const { selectedKey } = this.rootStore.PageTabsStore;

    const currentPage = this?.pageInfoMap?.[selectedKey];

    if (!currentPage) return 'NoExistCurrentPage';

    if (!this.pageEvents?.[selectedKey]) return 'NoEventsExist';
    const events = this.pageEvents[selectedKey];

    const tarEvent = events[evtKey.toString()];
    const curGroup = tarEvent.groups[tarEvent.activeIdx];

    return curGroup.actions.push({
      actionName: ActionsList.find(({ value }) => value === actionType).name,
      actionType,
      actionKey: shortid.generate(),
      isActive: true,
      actionSettings: actionInitJson[actionType],
    });
  };

  /** 设置当前页面下一个事件下的动作
   * # Prams
   * - @param evtKey 事件的索引
   *
   * - @param actIdx 事件中动作数组的索引
   *
   * - @param fn 修改函数(参考 `immer produce`)
   *
   * # Return
   * - null: 修改正常
   *
   * # Error
   * - `'NoExistKeyMapEvent'`: 不存在提供的 Key 对应的事件
   * - `'NoExistCurrentPage'`: 无法找到`当前页面`
   * - `'NoEventsExist'`: 当前页面中的 `events` 对象未初始化 (会在第一次添加事件的时候自动初始化)
   * - `'ActionsNotLongEnoughForIdx'`: 动作索引超出了动作数组尺寸
   *
   * # Example
   * @example
   * const { pageTreeStore } = Store;
   * const key = pageTreeStore.addEventsCurrent('Hooks 执行前'); // '7DQk7goLAqJMxbBN75LLfo'
   * const idx = pageTreeStore.addActionForEventCurrentPage(key, 'updateData');
   * pageTreeStore.setActionCurrentPage(
   *   key,
   *   idx,
   *   (act) => act.actionName = "So Long, and Thanks for All the Fish!"
   * );
   */
  @action setActionCurrentPage = (
    evtKey: string | SUUID,
    actIdx: number,
    fn: (act: PageEvent.Action) => void,
  ): null | 'NoExistCurrentPage' | 'NoEventsExist' | 'NoExistKeyMapEvent' | 'ActionsNotLongEnoughForIdx' => {
    const { selectedKey } = this.rootStore.PageTabsStore;

    const currentPage = this?.pageInfoMap?.[selectedKey];

    if (!currentPage) return 'NoExistCurrentPage';

    if (!this.pageEvents?.[selectedKey]) return 'NoEventsExist';
    const events = this.pageEvents[selectedKey];

    const tarEvent = events[evtKey.toString()];

    if (!tarEvent) return 'NoExistKeyMapEvent';

    const curGroup = tarEvent.groups[tarEvent.activeIdx];

    const tarAct = curGroup?.actions?.[actIdx];

    if (!tarAct) return 'ActionsNotLongEnoughForIdx';

    const tmp = cloneDeep(tarAct);

    fn(tmp);

    curGroup.actions[actIdx] = tmp;

    return null;
  };

  /** 删除当前页面下一个事件下的动作
   * # Prams
   * - @param evtKey 事件的索引
   *
   * - @param actIdx 事件中动作数组的索引
   *
   * # Return
   * - null: 删除正常
   *
   * # Error
   * - `'NoExistKeyMapEvent'`: 不存在提供的 Key 对应的事件
   * - `'NoExistCurrentPage'`: 无法找到`当前页面`
   * - `'NoEventsExist'`: 当前页面中的 `events` 对象未初始化 (会在第一次添加事件的时候自动初始化)
   * - `'ActionsNotLongEnoughForIdx'`: 动作索引超出了动作数组尺寸
   *
   * # Example
   * @example
   * const { pageTreeStore } = Store;
   * const key = pageTreeStore.addEventsCurrent('Hooks 执行前'); // '7DQk7goLAqJMxbBN75LLfo'
   * const idx = pageTreeStore.addActionForEventCurrentPage(key, 'updateData');
   * pageTreeStore.removeActionCurrentPage(key, idx);
   */
  @action removeActionCurrentPage = (
    evtKey: string | SUUID,
    actIdx: number,
  ): null | 'NoExistCurrentPage' | 'NoEventsExist' | 'NoExistKeyMapEvent' | 'ActionsNotLongEnoughForIdx' => {
    const { selectedKey } = this.rootStore.PageTabsStore;

    const currentPage = this?.pageInfoMap?.[selectedKey];

    if (!currentPage) return 'NoExistCurrentPage';

    if (!this.pageEvents?.[selectedKey]) return 'NoEventsExist';
    const events = this.pageEvents[selectedKey];

    const tarEvent = events[evtKey.toString()];

    if (!tarEvent) return 'NoExistKeyMapEvent';

    const curGroup = tarEvent.groups[tarEvent.activeIdx];
    const tarAct = curGroup.actions?.[actIdx];

    if (!tarAct) return 'ActionsNotLongEnoughForIdx';

    curGroup.actions = curGroup.actions.filter((_act, idx) => idx !== actIdx);

    return null;
  };

  @action savePageInfo = (appPageId: string, pageInfo: PageInfo) => {
    if (appPageId) {
      const _pageInfo = this.pageInfoMap[appPageId];
      this.pageInfoMap[appPageId] = _pageInfo
        ? {
            ..._pageInfo,
            ...toJS(pageInfo),
          }
        : toJS(pageInfo);
    }
  };

  @action getPageInfo = (appPageId: string): PageInfo => {
    if (appPageId) {
      const _pageInfo = this.pageInfoMap[appPageId] as PageInfo;
      if (_pageInfo) {
        return toJS(_pageInfo);
      }
    }
    return null;
  };

  @action removePageInfo = (appPageId: string) => {
    if (appPageId) {
      this.pageInfoMap[appPageId] = undefined;
      this.pageStateMap[appPageId] = 0;
      this.pageInitStateMap[appPageId] = 0;
    }
  };

  @action resetPageState = (appPageId: string) => {
    if (appPageId) {
      this.pageInitStateMap[appPageId] = this.pageStateMap[appPageId];
      // this.pageStateMap[appPageId] = 0;
    }
  };

  @action setPageSourceLoaded = (appPageId: string, isLoaded: boolean) => {
    if (appPageId && this.pageSourceLoadedMap[appPageId] !== isLoaded) {
      this.pageSourceLoadedMap[appPageId] = isLoaded;
    }
  };

  /**
   * v8.5： 保存所有编辑中的页面，也就是未保存的页面
   */
  @action saveAllEditingPages = (list: (string | number)[], cb?: (status: string) => void) => {
    const {
      ServiceStore,
      PageTabsStore: { selectedKey },
      ControlStore: { IsDataStoreModify },
      LayerStore,
    } = this.rootStore;
    const appPageIds = list || this.getEditingPages();
    // 页面保存请求
    const request = (appPageId: string) => {
      const pageInfo = this.getPageInfo(appPageId);
      // console.log('pageInfo==>', pageInfo);
      let { componentList, pageConfig, mapComponentList } = pageInfo;
      const { activeLayerId } = pageConfig.layerConfig;
      // 当前选中页面，获取实时值
      if (appPageId === selectedKey) {
        componentList = LayerStore.comList;
      }
      componentList = toJS(componentList);
      pageConfig = toJS(pageConfig);
      mapComponentList = toJS(mapComponentList);
      const data = {
        componentList,
        mapComponentList,
        pageConfig,
      };
      return new Promise((resolve) => {
        ServiceStore.saveAppPageApi(
          data,
          activeLayerId,
          appPageId,
          true,
          () => {
            resolve(appPageId);
          },
          'allEditingPages',
        );
      });
      // .catch((error) => {
      //   console.warn(`页面 ${appPageId} 保存失败`);
      // });
    };

    // 应用保存请求，为了保存变量
    const appSaveRequest = () => {
      return new Promise((resolve) => {
        ServiceStore.saveAPP(() => {
          resolve(null);
        });
      });
    };

    let promiseList = [];
    // 有页面修改则保存页面(保存页面的时候也会自动保存应用配置也就包含变量信息)，如果只有变量修改则只保存应用
    if (appPageIds && appPageIds.length > 0) {
      promiseList = appPageIds.map((id: string) => request(id));
    } else if (IsDataStoreModify) {
      promiseList.push(appSaveRequest());
    }

    Promise.all(promiseList)
      .then((res) => {
        // console.log(res);  // res 是 appPageId 数组
        message.success('保存成功');
        cb && cb('success');
      })
      .catch((error) => {
        // console.log(error)
        message.error('有保存出错，请检查');
        cb && cb('error');
      })
      .finally(() => {
        console.log('saveAllEditingPage end');
        // cb && cb('finally');
      });
  };

  // @action setHomePageBase64 = (base64: string) => {
  //   this.homePageBase64 = base64;
  // };

  // 普通页获取引用地图数据（普通页才执行）
  @action getMapReferenceList = (selectedKey) => {
    // const { PageTabsStore } = this.rootStore;
    const comList = this.pageInfoMap[this.homePageId]?.componentList || [];
    const mapCompList = [];
    window.DataI.each(comList, (component: any) => {
      if (['MapFoundationPlan', 'Map3DFoundationPlan', 'MapGlFoundationPlan'].includes(component.englishName)) {
        mapCompList.push(component);
      }
    });
    const appPageId = selectedKey; // 这个更准确些，selectedItem 有时没及时更新
    let mapList = [];
    if (this.pageInfoMap[appPageId]?.mapComponentList?.length) {
      // 有数据则取映射里的
      const list = this.pageInfoMap[appPageId].mapComponentList;
      mapList = mapCompList.map((comp) => {
        const _mapComp = list.find((v) => v.key === comp.key);
        return {
          ...comp,
          realAppPageId: comp.appPageId,
          realLayerId: comp.layerId,
          appPageId,
          layerId: '',
          comLock: false, // 固定不锁定，不能使用 comp 的 comLock，否则主页地图锁定的话会导致引用地图属性面板显示错误
          compType: 'referenceMap',
          layers: _mapComp ? _mapComp.layers : [],
        };
      });
    } else {
      mapList = mapCompList.map((comp) => {
        return {
          ...comp,
          realAppPageId: comp.appPageId,
          realLayerId: comp.layerId,
          appPageId,
          layerId: '',
          comLock: false,
          compType: 'referenceMap',
          layers: [],
        };
      });
    }
    this.setMapLayerInstance(mapList); // 给引用地图和地图子组件生成 instance
    if (this.pageInfoMap[appPageId]) {
      this.pageInfoMap[appPageId].mapComponentList = mapList; // 换成最新的
    }
    this.currentMapComponentList = mapList;
    window.mapComponentList = mapList;
    return mapList;
  };

  @action setMapLayerInstance = (list) => {
    if (list && list.length > 0 && !this.isHomePage) {
      // 非主页且有引用地图
      list.forEach((mapComp: any) => {
        try {
          // const originMapComp = window.DataI.getComponentByKey(mapComp.key);
          if (!mapComp.instance) initMapInstance(mapComp, 'referenceMap'); // 生成地图的 instance
          if (mapComp.layers && mapComp) {
            mapComp.layers.forEach((layer) => {
              // 地图子组件生成 instance
              !layer.instance && initInstance(mapComp, mapComp.instance, [layer], 'referenceMap');
            });
          }
        } catch (error) {
          console.warn(error);
        }
      });
    }
  };

  @action getMapComponentListByPageId = (appPageId) => {
    if (this.pageInfoMap[appPageId]) {
      return this.pageInfoMap[appPageId].mapComponentList || [];
    }
    return [];
  };

  @action resetMapComponentList = () => {
    const loop = (tree: PageItem[]) => {
      tree.forEach((it) => {
        if (it.children && it.children.length > 0) {
          loop(it.children);
        } else if (this.pageInfoMap[it.appPageId] && it.type === 1) {
          this.pageInfoMap[it.appPageId].mapComponentList = [];
        }
      });
    };
    loop(this.pageTree);
    this.currentMapComponentList = [];
  };

  @action getReferenceMapComp = (key: string) => {
    const {
      PageTabsStore: { selectedKey },
    } = this.rootStore;
    const list = this.pageInfoMap[selectedKey]?.mapComponentList || [];
    const comp = list.find((item) => item.key === key);
    if (!comp) console.error('找不到引用地图组件');
    return comp;
  };

  // 获取左侧组件列表选中的组件
  @action getSelectedComp = (key) => {
    const {
      EditorStore: { isSelectedReferenceMapComp },
    } = this.rootStore;
    return isSelectedReferenceMapComp ? this.getReferenceMapComp(key) : window.DataI.getComponentByKey(key);
  };

  // 普通页删除逻辑图层的时候需要把引用地图上的对应图层子组件删掉
  @action delMapLayerByLogicalLayer = (layerId: string | number) => {
    const {
      PageTabsStore: { selectedKey },
    } = this.rootStore;
    if (!this.isHomePage) {
      const mapList = this.pageInfoMap[selectedKey].mapComponentList;
      mapList.forEach((map) => {
        if (map.layers && map.layers.length > 0) {
          map.layers = map.layers.filter((v) => v.layerId !== layerId);
        }
      });
    }
  };

  @action updateCurrentMapComponentList = (mapComponentList) => {
    this.currentMapComponentList = mapComponentList;
    window.mapComponentList = mapComponentList;
  };
}
