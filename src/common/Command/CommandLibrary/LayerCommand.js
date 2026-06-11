/*
 * @Author: zengwei
 * @Date: 2022-12-26 10:47:50
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2023-08-23 15:05:46
 */

import { cloneDeep } from 'lodash';
import { Store } from '@/store/index';
import DataI from '@/utils/global-api';
import Command from './BaseCommand';

const { editorStore, layerStore, globalStore, pageTreeStore } = Store;

export default class LayerCommand extends Command {
  constructor(layerId, layers, options) {
    super();
    this.layerId = layerId;
    this.layers = cloneDeep(layers); // 修改前的layers
    this.options = options; // {type:{visible,sort,edit,del,add}}
  }

  static cmdType = 'LayerCommand';

  execute() {
    // console.log('LayerCommand --> exec', this.layerId, this.options);
    const { type, layers, dragLayerIndex, activeLayerId, waitRemoveComp = [] } = this.options;
    const { changeActiveLayerId, updateLayersState, toggleLayerVisible, dragChangeComponentList, defaultLayerId } =
      layerStore;
    //
    const { forceUpdateLayout, forceUpdate } = editorStore;

    const data = cloneDeep(layers);
    const otherKey = editorStore.changeKeys.filter((vl) => {
      return !waitRemoveComp.includes(vl);
    });
    switch (type) {
      case 'visible': // 图层显隐
        data.forEach((v) => {
          if (v.layerId === this.layerId) {
            v.visible = !v.visible;
            // 隐藏组时隐藏所有组件，显示组时不影响组件
            // if (v.visible === false) {
            //   toggleLayerVisible(this.layerId, v.visible);
            // }

            // created 为true时表示该图层组件已经被创建过
            // if (!v.created) {
            //   setTimeout(() => {
            //     LayoutStore.forceUpdateLayout();
            //   }, 0);
            // }

            // if (v.visible && !v.created) {
            //   v.created = true;
            // }
          }
        });
        updateLayersState(data);
        break;
      case 'sort': // 图层排序
        updateLayersState(layers);
        dragChangeComponentList(this.layerId, dragLayerIndex);
        break;
      case 'edit': // 修改图层名称
        updateLayersState(layers);
        break;
      case 'del': // 删除图层
        // 被删除图层是选中图层
        if (this.layerId === activeLayerId) {
          // 将选中图层重置为默认基础图层
          changeActiveLayerId(defaultLayerId);
        }
        updateLayersState(layers);
        pageTreeStore.delMapLayerByLogicalLayer(this.layerId);
        // globalStore.delLayerFilter(this.layerId);
        forceUpdate();
        // 删除图层时将图层中的组件的映射删掉
        DataI.removeComKeyMap(waitRemoveComp);
        // 修改选中组件状态
        editorStore.setChangeKeys(otherKey);
        break;
      case 'add': // 添加图层
        updateLayersState(layers);
        // globalStore.addLayerFilter(this.layerId);
        break;
      default:
        console.warn('未知操作');
        break;
    }
  }

  undo() {
    // console.log('LayerCommand --> undo', this.layerId, this.options);

    const { type, layers, activeLayerId, waitRemoveComp, layerFilter } = this.options;
    const {
      changeActiveLayerId,
      updateLayersState,
      toggleLayerVisible,
      dragChangeComponentList,
      updateCurrentLayerComList,
    } = layerStore;
    // const { screenConfig } = globalStore;
    const { forceUpdateLayout, forceUpdate } = editorStore;
    const dragLayerIndex = this.layers.findIndex((l) => l.layerId === this.layerId);
    // const { filter } = screenConfig;
    switch (type) {
      case 'visible': // 图层显隐
        layers.forEach((v) => {
          if (v.layerId === this.layerId) {
            v.visible = !v.visible;
            // toggleLayerVisible(this.layerId, v.visible);
          }
        });
        updateLayersState(layers);
        // forceUpdateLayout();
        break;
      case 'sort': // 图层排序
        updateLayersState(this.layers);
        dragChangeComponentList(this.layerId, dragLayerIndex);
        break;
      case 'edit': // 修改图层名称
        updateLayersState(this.layers);
        break;
      case 'del': // 删除图层
        updateLayersState(this.layers, waitRemoveComp);
        // 撤销删除图层时增加组件映射
        DataI.addComKeyMap(waitRemoveComp);
        if (this.layerId === activeLayerId) {
          // 将删除图层恢复为选中图层
          changeActiveLayerId(this.layerId);
          updateCurrentLayerComList(waitRemoveComp);
        }
        // filter[this.layerId] = layerFilter;
        // globalStore.updateScreenConfig(filter, 'filter');
        forceUpdate();
        break;
      case 'add': // 添加图层
        updateLayersState(this.layers);
        // 删除图层滤镜
        // globalStore.delLayerFilter(this.layerId);
        break;
      default:
        console.warn('未知操作');
        break;
    }
  }
}
