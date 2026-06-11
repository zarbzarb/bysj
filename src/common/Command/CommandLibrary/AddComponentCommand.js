/* eslint-disable no-underscore-dangle */
/*
 * @Author: zengwei
 * @Date: 2021-09-08 16:38:52
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2023-05-30 10:34:49
 */
import _ from 'lodash';
import { deepDestoryInstance } from '@/utils/componentUtils';
import { Store } from '@/store';
import Command from './BaseCommand';

const { editorStore, layerStore } = Store;
const getComponent = window.DataI.getComponentByKey;

const replaceCompLevel = (list, level) => {
  list.forEach((child) => {
    child.level = level;
    if (child.classType === 'group' || child?.isDragContainer) {
      replaceCompLevel(child.childComList, child.level + 1);
    }
  });
};

/**
 * 组件添加命令(不支持地图子组件添加回退)
 * 逻辑:
 * 1. 添加时将组件更新到当前图层currentLayerList中，默认都是放到当前图层中的第一个位置，索引为0
 * 2. 回退: 从currentLayerList中删除组件
 * 3. 重做: 根据执行重做命令时在哪个图层，选择更新currentLayerList还是其他
 * 注意: 如果回退和重做命令都是在当前同一个图层操作，直接更新currentLayerList即可，如果新增了组件，切换到了其他图层
 * 再去执行回退重做之类的命令，则需要考虑不要更新错了图层(总是更新被操作组件所在的图层)，删除功能的命令和这个逻辑类似
 */
export default class AddComponentCommand extends Command {
  constructor(el, groupKey = null, targetList = []) {
    super();
    this.el = _.isArray(el) ? el : [el]; // 组件
    this.editType = 'normal';
    this.editComp = null;
    this.target = groupKey;
    this.targetList = targetList;

    if (editorStore.editModePaths.length > 0) {
      this.editComp = editorStore.getEditComp(editorStore.editModePaths);
      if (this.editComp?.isDragContainer) {
        this.editType = 'DragContainer';
      } else if (this.editComp.type === 'DynamicPanel' || this.editComp.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        this.editType = 'dynamicPanel';
      } else if (this.editComp.type === '@yl/dataq-com-group-basic') {
        this.editType = 'group';
      }
    }
  }

  static cmdType = 'AddComponentCommand';

  execute() {
    // console.log('AddComponentCommand --> exec', this.el);
    const {
      activeLayerId,
      layerComList,
      updateCurrentLayerComList,
      updateComponentList,
      // getComponentByCurrentLayerList,
    } = layerStore;

    if (this.target) {
      // 有粘贴目标组时，是一次性拷贝过来
      const targetItem = getComponent(this.target);
      targetItem._accurate_update = true;
      this.el.forEach((em) => {
        window.DataI.addComKeyMap(em);
      });
      this.targetList.unshift(...this.el);
    } else {
      let componentList = editorStore.getCompList(true);
      // 无粘贴目标组时，是一个个拷贝过来，需要做倒序处理
      this.el.forEach((com) => {
        // 图层中的添加
        if (this.editType === 'normal') {
          if (com.layerId !== activeLayerId) {
            // 兼容执行重做方法时，已经不在之前添加组件时所在的图层
            const layer = layerComList.find((l) => l.layerId === com.layerId);
            if (!layer) {
              console.warn('组件所在图层不存在');
              return;
            }
            componentList = layer.componentList;
          }
          const currentLevel = componentList.length > 1 ? componentList[0].level : 1;
          replaceCompLevel([com], currentLevel);
          // 将组件新增到当前列表的第一个
          window.DataI.addComKeyMap(com);
          componentList.unshift(com);
          if (com.layerId === activeLayerId) {
            updateCurrentLayerComList(componentList);
          } else {
            updateComponentList(com.layerId, componentList);
          }
        } else {
          const currentLevel = componentList.length > 1 ? componentList[0].level : 1;
          replaceCompLevel([com], currentLevel);
          window.DataI.addComKeyMap(com);
          componentList.unshift(com);
        }

        if (this.editType === 'group' || this.editType === 'DragContainer') {
          com.groupKey = this.editComp.key;
          replaceCompLevel(componentList, this.editComp.level + 1);
        } else if (this.editType === 'dynamicPanel') {
          replaceCompLevel([com], 1);
        }
        editorStore.changeComponents([com.key]);
      });
    }
  }

  undo() {
    // console.log('AddComponentCommand --> undo');
    const {
      activeLayerId,
      currentLayerComList,
      layerComList,
      updateCurrentLayerComList,
      updateComponentList,
      // getComponentByCurrentLayerList,
    } = layerStore;
    if (this.target) {
      const targetItem = getComponent(this.target);
      targetItem._accurate_update = true;
      // 删除组件的key映射
      window.DataI.removeComKeyMap(this.el);
      this.targetList.splice(0, this.el.length);
    } else {
      this.el.forEach((com) => {
        // 撤销数据更新
        // 1. 组内、动态面板内的组件
        if (['group', 'dynamicPanel', 'DragContainer'].includes(this.editType)) {
          const componentList = editorStore.getCompList();
          const removeComList = componentList.splice(0, 1);
          window.DataI.removeComKeyMap(removeComList);
          return;
        }
        // 2. 图层中的组件
        // 从当前图层中删除
        if (com.layerId === activeLayerId) {
          const removeComList = currentLayerComList.splice(0, 1);
          window.DataI.removeComKeyMap(removeComList);
          updateCurrentLayerComList(currentLayerComList);
        } else {
          // 从其他图层删除
          const layer = layerComList.find((l) => l.layerId === com.layerId);
          if (!layer) {
            console.warn('组件所在图层不存在');
            return;
          }
          const { componentList } = layer;
          const removeComList = componentList.splice(0, 1);
          window.DataI.removeComKeyMap(removeComList);
          updateComponentList(com.layerId, componentList);
        }

        deepDestoryInstance(com);
        // v7.6.0 删除完组件将选中key置空，后续添加判断是否是添加的key
        editorStore.setChangeKeys([]);
      });
    }
  }
}
