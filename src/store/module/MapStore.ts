/*
 * @Author: lvbowen
 * @Date: 2023-05-22 14:21:36
 * @Last Modified by: lvbowen
 * @Last Modified time: 2023-05-22 14:55:30
 * 地图相关
 */
import { makeAutoObservable, makeObservable, observable, action } from 'mobx';
import _, { cloneDeep } from 'lodash';
import { initComponent } from '@/utils/initComs';

const getComponent = window.DataI.getComponentByKey;

export default class MapStore {
  @observable rootStore;

  /**
   * 地图子组件 (@observable.ref 禁止自动深拷贝)
   */
  @observable.ref layerItem = null;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeObservable(this);
  }

  @action backMapAttr = (layer) => {
    layer && (layer.backMapCloseIndex = 999);
    this.layerItem = undefined;
  };

  /**
   * 显示地图子组件配置面板
   * @param item 地图子组件
   */
  @action showLayer = (item: any) => {
    this.layerItem = item;
  };

  @action delLayer = (i: number) => {
    const {
      EditorStore,
      PageTreeStore: { getSelectedComp },
    } = this.rootStore;
    const parentItem = getSelectedComp(EditorStore.changeKeys[0]);
    const com = parentItem.layers[i];
    // 记录子组件的配置信息
    com._attr = com.instance.compAttr;
    window.executeCommand('MapLayersCommand', com, parentItem, {
      type: 'del',
      index: i,
    });
  };

  // @action copyLayer = (item: any, index?: any, instance?: any) => {
  //   const {
  //     EditorStore,
  //     PageTreeStore: { getSelectedComp },
  //   } = this.rootStore;
  //   const { LayerStore, GlobalStore } = this.rootStore;
  //   const { activeLayerId } = LayerStore;
  //   const { bigScreenType } = GlobalStore;
  //   const parentCom = getSelectedComp(EditorStore.changeKeys[0]);
  //   if (parentCom === undefined) {
  //     const com = initComponent(item, activeLayerId, bigScreenType);
  //     //   this.comList.unshift(com); 暂时
  //   } else {
  //     const com = initComponent(item, activeLayerId, bigScreenType);
  //     const copyInstance = cloneDeep(instance);
  //     //
  //     window.executeCommand('MapLayersCommand', com, parentCom, {
  //       type: 'copy',
  //       index: index + 1,
  //       copyInstance,
  //     });
  //   }
  // }；

  /**
   * v8.5.0 修改拷贝地图子图层为粘贴地图子图层
   * @param item 粘贴模板
   * @param copyInstance 复制模板
   */
  @action pasteLayer = (item: any, copyInstance?: any) => {
    const {
      EditorStore,
      PageTreeStore: { getSelectedComp },
    } = this.rootStore;
    const { LayerStore, GlobalStore } = this.rootStore;
    const { activeLayerId } = LayerStore;
    const { bigScreenType } = GlobalStore;
    // 获取当前地图
    const parentCom = getSelectedComp(EditorStore.changeKeys[0]);
    if (parentCom) {
      // 初始化地图子图层
      const com = initComponent(item, activeLayerId, bigScreenType);
      com.createFlag = copyInstance.createFlag;
      com.showFlag = copyInstance.showFlag;
      window.executeCommand('MapLayersCommand', com, parentCom, {
        type: 'paste',
        copyInstance,
      });
    }
  };

  @action editLayer = (item: any, index: number, value: any) => {
    const {
      EditorStore,
      PageTreeStore: { getSelectedComp },
    } = this.rootStore;
    const parentItem = getSelectedComp(EditorStore.changeKeys[0]);
    const editInstance = parentItem.layers[index];
    window.executeCommand('MapLayersCommand', editInstance, parentItem, {
      type: 'edit',
      editName: value,
      layerName: editInstance.name,
    });
  };
}
