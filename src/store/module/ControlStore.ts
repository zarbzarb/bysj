import { makeAutoObservable } from 'mobx';
import PageCompsListIcon from '@/assets/newIcon/TopKitBar/PageCompsList.svg';
import CompsMenuIcon from '@/assets/newIcon/TopKitBar/CompsMenu.svg';
import CardListIcon from '@/assets/newIcon/TopKitBar/CardList.svg';

import PageCompsListActiveIcon from '@/assets/newIcon/TopKitBar/PageCompsList_Active.svg';
import CompsMenuActiveIcon from '@/assets/newIcon/TopKitBar/CompsMenu_Active.svg';
import CardListActiveIcon from '@/assets/newIcon/TopKitBar/CardList_Active.svg';

/**
 * 左上角菜单栏存储对象
 */
export default class ControlStore {
  rootStore = null;

  // 左上角菜单栏配置信息
  tabList = [
    { label: '页面/组件列表', activeIcon: PageCompsListActiveIcon, icon: PageCompsListIcon, value: 'layer' },
    { label: '组件库', activeIcon: CompsMenuActiveIcon, icon: CompsMenuIcon, value: 'com' },
    { label: '卡片列表', activeIcon: CardListActiveIcon, icon: CardListIcon, value: 'card' },
  ];

  // 选中菜单栏
  selectedTabs = [];

  comList = [];

  // 地图子组件
  comQueue = {};

  // 2d地图子组件
  map2dLayers = [];

  // gl地图子组件
  mapGlLayers = [];

  // 3d地图子组件
  map3dLayers = [];

  /**
   * 数据管理弹框显示
   */
  dataVisible = false;

  /**
   * 数据管理弹框组件
   */
  DataDialog = null;

  /**
   * 数据变量是否被增删改
   */
  IsDataStoreModify = false;

  // 构造函数
  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  // 数据管理弹窗切换
  toggleDataVisible = () => {
    if (this.dataVisible) {
      this.dataVisible = false;
    } else {
      import('@/pages/Platform/DataManage')
        .then(({ default: DataManage }) => {
          this.DataDialog = DataManage;
          this.dataVisible = true;
        })
        .catch((error) => console.warn(error));
    }
  };

  /**
   * 卡片列表显隐通过数据权限控制
   * @param configs
   */
  setConfig = (configs) => {
    if (!configs.cardMenu) {
      this.tabList = this.tabList.filter((tab) => tab.label !== '卡片'); // 卡片列表显隐通过数据权限控制
    }
  };

  /**
   * 点击菜单按钮
   * @param value 菜单名称
   * @param isSearch
   */
  changeTabsHandler = (menuName, isSearch = false) => {
    // 是否已经选中当前菜单menuName
    const { bigScreenType, bigScreenId } = this.rootStore.GlobalStore;
    const index = this.selectedTabs.indexOf(menuName);
    if (index < 0) {
      // 没有选中,添加当前值value
      this.selectedTabs.push(menuName);
    } else if (!isSearch) {
      // 已经选中的，则删除当前值value
      // 如果是组件定位，则不会导致图层关闭，只打开。
      this.selectedTabs.splice(index, 1);
    }
    // push、splice方法都可以改变元素组,不需要添加
    // this.selectedTabs = this.selectedTabs.slice();
    // v7.7保存状态值，保证下次打开页面显示对应菜单容器
    const key = `${bigScreenType}-${bigScreenId}-changeTabs`;
    const value = JSON.stringify(this.selectedTabs);
    localStorage.setItem(key, value);
  };

  /**
   * 获取本地缓存的菜单选中值
   */
  getLocalStorageTabs = () => {
    const { bigScreenType, bigScreenId } = this.rootStore.GlobalStore;
    const key = `${bigScreenType}-${bigScreenId}-changeTabs`;
    const value = localStorage.getItem(key);
    this.selectedTabs = JSON.parse(value) || [];
  };

  setIsDataStoreModify = (bool: boolean) => {
    if (this.IsDataStoreModify !== bool) {
      this.IsDataStoreModify = bool;
    }
  };
}
