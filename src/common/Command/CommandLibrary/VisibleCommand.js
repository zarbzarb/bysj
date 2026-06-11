/*
 * @Author: zengwei
 * @Date: 2022-12-07 10:36:41
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2023-06-16 11:41:37
 */

import { visibleWithLoop, visibleWithSelf } from '@/EventHandlers/ContextMenuEvent';
import { cloneDeep } from 'lodash';
import { Store } from '@/store/index';
import $ from 'jquery';
import Command from './BaseCommand';

const { layerStore, editorStore } = Store;

const toggleLayerVisible = (layerId, layers, updateLayersState, visible) => {
  const data = cloneDeep(layers);
  data.forEach((v) => {
    if (v.layerId === layerId) {
      // 组件显示时，图层显示
      v.visible = visible; //! v.visible;
    }
  });
  updateLayersState(data);
};

export default class VisibleCommand extends Command {
  constructor(comps, type) {
    super();
    this.comps = comps;
    this.visible = type === 'invisible';
    this.flag = true; // 控制图层和组件显隐联动
    this.layerId = this.comps[0].layerId;
  }

  static cmdType = 'VisibleCommand';

  execute() {
    // console.log('VisibleCommand --> exec', this.comps, this.type);
    const { layers, updateLayersState } = layerStore;
    // visibleWithLoop(this.comps, this.visible);
    // 显示隐藏只控制自己的状态
    visibleWithSelf(this.comps, this.visible);

    // 显示组件时需要显示图层)
    if (!this.visible) {
      // 显示: 需要图层眼睛图标显示
      toggleLayerVisible(this.layerId, layers, updateLayersState, !this.visible);
    }

    /* 图层显隐和组件显隐不再进行联动
    // 图层显隐和组件显隐联动效果
    if (this.visible) {
      // 隐藏: 判断是否图层下所有组件都隐藏，眼睛图标隐藏
      const currentLayer = layerComList.find(
        (layer) => layer.layerId == this.layerId
      );
      const { componentList } = currentLayer;

      for (let index = 0; index < componentList.length; index++) {
        const com = componentList[index];
        // 有组件显示
        if (com.comInvisible == false) {
          this.flag = false;
          break;
        }
      }
      // 组件全部隐藏,图层隐藏
      if (this.flag) {
        toggleLayerVisible(this.layerId, layers, updateLayersState);
      }
    } else {
      // 显示: 需要图层眼睛图标显示
      toggleLayerVisible(this.layerId, layers, updateLayersState);
    }
    */

    if (!this.visible) {
      // console.log('visible', this.visible);
      const item = this.comps[0];
      // 如果组件DOM存在，则不需要重新创建
      if ($(`[data-key="${item.key}"]`).get(0)) return;
      if (!item.comCreated) {
        item._accurate_update = true;
      }
      // 设置组件是否需要创建的状态为true
      item.comCreated = true;
      // layoutStore.forceUpdateLayout();
      editorStore.forceUpdateVisible();
    }
  }

  undo() {
    // console.log('VisibleCommand --> undo');
    const { layers, updateLayersState } = layerStore;
    // visibleWithLoop(this.comps, !this.visible);
    visibleWithSelf(this.comps, !this.visible);

    if (!this.visible) {
      toggleLayerVisible(this.layerId, layers, updateLayersState, this.visible);
    }

    // if (this.visible) {
    //   if (this.flag) {
    //     toggleLayerVisible(this.layerId, layers, updateLayersState);
    //   }
    // } else {
    //   toggleLayerVisible(this.layerId, layers, updateLayersState);
    // }
  }
}
