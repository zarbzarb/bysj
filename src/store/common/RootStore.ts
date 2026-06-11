/*
 * @Author: zengwei
 * @Date: 2023-05-08 14:50:57
 * @Last Modified by: zengwei
 * @Last Modified time: 2023-05-17 19:47:29
 */

import { makeAutoObservable } from 'mobx';
import GlobalStore from './global';
import ComStore from '../module/ComStore';
import ControlStore from '../module/ControlStore';
import CompLibStore from '../module/ComLibStore';
import LayerManagerStore from '../layerManager';
import OssStore from '../module/OssStore';
import EditorStore from '../module/EditorStore';
import ServiceStore from '../module/ServiceStore';
import DynamicApiStore from '../module/DynamicApiStore';
import CardStore from '../module/CardStore';
import HookStore from '../module/HookStore';
import UserStore from '../module/UserStore';
import MapStore from '../module/MapStore';
import PageTreeStore from '../pageTree';
import PageTabsStore from '../pageTabs';
import VersionStore from '../module/VersionStore';

class RootStore {
  /**
   * 全局公共状态
   */
  GlobalStore;

  /**
   * 左上角菜单控制栏管理
   */
  ControlStore;

  /**
   * 组件管理
   */
  ComStore;

  /**
   * 图层管理
   */
  LayerStore;

  /**
   * 组件库管理
   */
  CompLibStore;

  /**
   * oss资源管理
   */
  OssStore;

  /**
   * 编辑器画布
   */
  EditorStore;

  /**
   * 请求数据交互
   */
  ServiceStore;

  /**
   * 动态数据
   */
  DynamicApiStore;

  /**
   * 卡片管理
   */
  CardStore;

  /**
   * HooK
   */
  HookStore;

  /**
   * 用户信息
   */
  UserStore;

  /** 地图相关
   */
  MapStore;

  /**
   * 页面树
   */
  PageTreeStore;

  /**
   * 页面导航列表
   */
  PageTabsStore;

  /**
   * 版本相关
   */
  VersionStore;

  constructor() {
    makeAutoObservable(this);
    this.GlobalStore = new GlobalStore(this);
    this.ControlStore = new ControlStore(this);
    this.CompLibStore = new CompLibStore(this);
    this.ComStore = new ComStore(this);
    this.LayerStore = new LayerManagerStore(this);
    this.OssStore = new OssStore(this);
    this.EditorStore = new EditorStore(this);
    this.ServiceStore = new ServiceStore(this);
    this.DynamicApiStore = new DynamicApiStore(this);
    this.CardStore = new CardStore(this);
    this.HookStore = new HookStore(this);
    this.UserStore = new UserStore(this);
    this.MapStore = new MapStore(this);
    this.PageTreeStore = new PageTreeStore(this);
    this.PageTabsStore = new PageTabsStore(this);
    this.VersionStore = new VersionStore(this);
  }
}
export default new RootStore();
