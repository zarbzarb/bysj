import { makeAutoObservable, runInAction, toJS } from 'mobx';
// import { handlePrint } from '@/components/html2canvas';
import { handleData } from '@/utils/componentUtils';
import { getCurPageRefer } from '@/utils/pageListRefer';
import { debounce } from 'lodash';
import { PageItem, PageType } from '../pageTree';

/**
 * 应用页面导航
 */
export default class PageTabsStore {
  rootStore;

  // 页面字典
  pageDic: Record<string, PageItem> = {};

  // 页面导航列表key值列表
  pageKeyList: string[] = [];

  // 选中节点key
  selectedKey = '';

  // 选中节点序号
  selectedIndex = 0;

  isLoadPage = false;

  constructor(rootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  /**
   * 重置属性或状态
   */
  reset = () => {
    this.pageDic = {};
    this.pageKeyList = [];
    this.selectedKey = '';
    this.selectedIndex = 0;
  };

  /**
   * 新建文件或者页面
   * @param type 区分文件夹和页面
   */
  // addTab = (item: PageItem, callback?: any) => {
  addTab = (item: PageItem) => {
    if (item.type === PageType.folder) {
      return;
    }
    if (!this.pageKeyList.includes(item.appPageId)) {
      this.pageKeyList = [...this.pageKeyList, item.appPageId];
      // this.pageKeyList.push(item.appPageId);
    }
    this.pageDic[item.appPageId] = item;
    // this.setSelectedTab(item.appPageId, callback);
    this.setSelectedTab(item.appPageId);
  };

  /**
   * 设置选中节点
   * @param key
   */
  // setSelectedTab = (key: string, callback?: any) => {
  setSelectedTab = (key: string) => {
    if (this.selectedKey === key) {
      return;
    }
    runInAction(() => {
      this.savePrePage(this.selectedKey);
      this.selectedKey = key;
      this.selectedIndex = this.pageKeyList.indexOf(key);
    });
    this.getNextPage(key);
    // this.debounceGetNextPage(key);
    // if (callback) {
    //   callback()
    // } else {
    //   this.getNextPage(key);
    // }
  };

  /**
   * 删除tab
   */
  // deleteTab = (key: string, callback?: any) => {
  deleteTab = (key: string) => {
    runInAction(() => {
      const index = this.pageKeyList.indexOf(key);
      if (index === -1) {
        return;
      }
      this.pageKeyList.splice(index, 1);
      delete this.pageDic[key];

      if (this.selectedKey === key) {
        if (index === 0) {
          // 删除的是第一个
          if (this.pageKeyList.length === 0) {
            // 全部删除
            this.selectedIndex = 0;
            this.selectedKey = '';
          } else {
            // 取第1个
            this.selectedIndex = 0;
            this.selectedKey = this.pageKeyList[this.selectedIndex];
            this.getNextPage(this.pageKeyList[this.selectedIndex]);
            // if (callback) {
            //   callback()
            // } else {
            //   this.getNextPage(this.pageKeyList[this.selectedIndex]);
            // }
            // this.debounceGetNextPage(this.pageKeyList[this.selectedIndex]);
          }
        } else {
          // 取前1个
          this.selectedIndex -= 1;
          this.selectedKey = this.pageKeyList[this.selectedIndex];
          this.getNextPage(this.pageKeyList[this.selectedIndex]);
          // if (callback) {
          //   callback()
          // } else {
          //   this.getNextPage(this.pageKeyList[this.selectedIndex]);
          // }
          // this.debounceGetNextPage(this.pageKeyList[this.selectedIndex]);
        }
      } else {
        // 删除非选中页面
        // eslint-disable-next-line no-lonely-if
        if (index < this.selectedIndex) {
          this.selectedIndex -= 1;
        }
      }
      // 删除tab影响页面树选择
      const { PageTreeStore } = this.rootStore;
      const { setSelectedPageIds } = PageTreeStore;
      if (this.selectedKey) {
        setSelectedPageIds([this.selectedKey]);
      } else {
        // 全删除
        setSelectedPageIds([]);
      }
    });
  };

  /**
   * 保存前一个页面的配置 特指当前页
   */
  savePrePage = (key) => {
    if (!key) {
      return;
    }
    // console.log('savePrePage----begin', new Date());

    const { PageTreeStore, LayerStore, EditorStore, GlobalStore } = this.rootStore;
    const { appPageId } = LayerStore;
    const { allPageRefer } = GlobalStore;
    const { editModePaths, exitEditMode } = EditorStore;
    const { getPageInfo, savePageInfo } = PageTreeStore;
    this.isLoadPage = true;
    if (editModePaths.length > 0) {
      exitEditMode();
    }
    window.executeCommand('clearStack');

    let pageInfo = getPageInfo(key);
    // console.log('savePrePage1 appPageId', appPageId, 'key', key);
    if (pageInfo && key === appPageId) {
      // console.log('savePrePage2 appPageId', appPageId, 'key', key);
      let componentList = toJS(LayerStore.comList);
      // v8.6.0 离开页面前，获取页面变量引用和接口引用
      const pageName = allPageRefer[key].pageName || '';
      // 需要保存的页面信息
      const dynamicApis = pageInfo?.pageConfig?.dynamicApis || [];
      const { varRefer, apiRefer } = getCurPageRefer(pageName, componentList, dynamicApis);
      allPageRefer[key].varRefer = varRefer;
      allPageRefer[key].apiRefer = apiRefer;
      componentList = handleData(componentList, LayerStore.activeLayerId, 'savePrePage');
      // 使用旧的页面状态和id
      pageInfo = {
        ...pageInfo,
        componentList,
      };
      savePageInfo(key, pageInfo);
    }
    // console.log('savePrePage----end', new Date());
  };

  /** *
   * 获取下一个页面信息
   */
  getNextPage = async (key: string | number) => {
    if (!key) {
      return;
    }
    // console.log('getNextPage----begin', new Date());
    const { PageTreeStore, ServiceStore, EditorStore } = this.rootStore;
    const { changeKeys, setChangeKeys, setZoom } = EditorStore;
    const { getPageInfo, fetchPageInfoByAppPageId } = PageTreeStore;
    const { updateLayer } = ServiceStore;
    changeKeys.length > 0 && setChangeKeys([]);
    // v8.16 重置页面缩放为100%
    setZoom(100);
    const consoleDom = document.querySelector('#MoveScroll [data-type="console"]') as HTMLElement;
    if (consoleDom) {
      consoleDom.style.transform = `scale(${100 / 100})`;
    }
    const pageInfo = getPageInfo(key);
    // console.log('getNextPage----begin2', new Date());
    if (pageInfo) {
      const { componentList, pageConfig } = pageInfo;
      // 重新加载页面，不需要重新初始化组件列表
      await updateLayer(componentList, pageConfig, key);
      this.isLoadPage = false;
      // console.log('getNextPage----end1', new Date());
    } else {
      await fetchPageInfoByAppPageId(key);
      this.isLoadPage = false;
      // console.log('getNextPage----end2', new Date());
    }
  };

  // debounceGetNextPage = debounce(this.getNextPage, 500);

  /** *
   * 交互跨页面选择获取页面信息
   */
  getSimplePage = (key: string | number, cb: () => void) => {
    if (!key) {
      return;
    }
    const { PageTreeStore } = this.rootStore;
    const { simpleFetchPageInfoByAppPageId, actionPageInfoMap, pageInfoMap } = PageTreeStore;
    if (!actionPageInfoMap[key] && !pageInfoMap[key]) {
      simpleFetchPageInfoByAppPageId(key, cb);
    } else {
      cb && cb();
    }
  };
}
