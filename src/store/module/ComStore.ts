/*
 * @Author: zengwei
 * @Date: 2023-05-08 14:21:36
 * @Last Modified by: zengwei
 * @Last Modified time: 2024-05-07 16:04:15
 * 组件操作模块数据状态
 */
import { makeAutoObservable } from 'mobx';
import { message } from 'antd';
import { initComponent } from '@/utils/initComs';
import { setCompTransform } from '@/utils/transformUtils';

export default class ComStore {
  rootStore;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  /**
   * 添加组件
   * @param item 添加组件
   * @param parentCom 目标组件
   * @param position 位置
   */
  addCom = (item, parentCom?, position?, templateId?) => {
    const {
      LayerStore,
      GlobalStore,
      EditorStore,
      PageTreeStore: { getSelectedComp },
    } = this.rootStore;
    const { activeLayerId } = LayerStore;
    const { bigScreenType } = GlobalStore;
    // v8.5.0 地图编辑态禁止粘贴组件
    const { isEditMap } = EditorStore;
    if (isEditMap) {
      message.warning('地图编辑态禁止粘贴组件');
      return;
    }
    // 普通组件
    if (parentCom === undefined) {
      const com = initComponent(item, activeLayerId, bigScreenType, templateId);
      if (position) {
        // 拖拽组件设置组件位置
        setCompTransform(com, position[0], position[1]);
      }
      window.executeCommand('AddCompCommand', com);
    } else {
      // console.log(parentCom, item);
      // 地图子组件
      const com = initComponent(item, activeLayerId, bigScreenType);
      const parentItem = getSelectedComp(parentCom);
      if (parentItem && parentItem.compType === 'referenceMap' && com) {
        com.compType = 'referenceMap';
      }
      window.executeCommand('MapLayersCommand', com, parentItem, { type: 'add' });
    }
  };

  /** 编辑器上方的换肤功能下掉的话，这里便用不到  */
  getSkinVlaue = (val: any, attr: any) => {
    // if (attr) {
    //   //修改属性面板修改皮肤回显
    //   this.skinImageVals = []; //置空
    //   this.deepCardTemplates(LayerStore.comList);
    //   let s = this.skinImageVals.every((item) => val == item);
    //   if (s) {
    //     this.skinLabel = this.addCardImageList[val].label;
    //   } else {
    //     this.skinLabel = '';
    //   }
    // } else {
    //   //初始化添加皮肤回显
    //   if (this.skinImageVals.length > 0) {
    //     this.skinLabel = this.addCardImageList[this.skinImageVals[0]].label;
    //   }
    // }
  };
}
