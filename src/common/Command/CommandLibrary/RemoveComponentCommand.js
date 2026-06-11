/*
 * @Author: zengwei
 * @Date: 2021-09-08 16:38:52
 * @Last Modified by: zengwei
 * @Last Modified time: 2024-08-13 10:18:20
 */
import { deepDestoryInstance } from '@/utils/componentUtils';
import { Store } from '@/store/index';
import Command from './BaseCommand';

const getComponent = window.DataI.getComponentByKey;
const { editorStore, layerStore, globalStore } = Store;

/**
 * 组件删除命令
 * 逻辑:
 * 1. 普通组件删除、组内组件删除、动态面板内部组件删除
 * 2. 删除时记录被删除组件和索引，用于回退操作
 * 3. 动态面板删除时还需要记录激活面板索引
 */
export default class RemoveComponentCommand extends Command {
  constructor(comps) {
    super();
    this.comps = comps; // 待删除组件列表
    this.compsInfo = null; // 待删除组件和索引记录，用于撤销时还原到componentList或组或动态面板
    this.group = null; // 如果删除的是组内组件，记录该组
    this.sortKeys = []; // 降序key，用于从大到小删除和插入，不破坏数组结构
    this.dyComp = {}; // 动态面板
    this.childIndex = -1; // 动态面板激活索引
    this.layerId = comps[0].layerId;
  }

  static cmdType = 'RemoveComponentCommand';

  execute() {
    // 执行命令
    const { activeLayerId, layerComList, currentLayerComList, updateCurrentLayerComList, updateComponentList } =
      layerStore;
    const compsInfo = {};
    let componentList = currentLayerComList; // layerStore.comList;
    if (this.layerId !== activeLayerId && editorStore.editModePaths.length === 0) {
      // 兼容执行重做方法时，已经不在之前删除组件时所在的图层
      const layer = layerComList.find((l) => l.layerId === this.layerId);
      if (!layer) {
        console.warn('组件所在图层不存在');
        return;
      }
      componentList = layer.componentList;
    }
    this.comps.forEach((com) => {
      let index = -1;
      // 动态面板内部删除
      if (editorStore.editModePaths.length > 0) {
        // 获取动态面板
        const group = getComponent(editorStore.editModePaths[0]);
        if (group.classType === 'group' || group?.type === 'CustomList' || group?.type === 'CustomCell') {
          // 兼容删除多级组下组件
          const parentGroup = getComponent(com.groupKey);
          this.group = parentGroup;
          index = parentGroup.childComList.findIndex((v) => v.key === com.key);
        } else if (group.type === 'DynamicPanel' || group.type === 'CollapsePanel') {
          this.dyComp = group;
          // 查找到动态面板所在的激活面板索引
          const childIndex = group.children.findIndex((child) =>
            child.AntdChildComponents.some((v) => v.key === com.key),
          );
          if (childIndex !== -1) {
            this.childIndex = childIndex;
            // 从当前激活面板子组件中查找被删除组件索引
            index = group.children[childIndex].AntdChildComponents.findIndex((v) => v.key === com.key);
          }
        }
        // else if (group.type === 'CollapsePanel') {
        //   // v8.17新增折叠面板
        //   this.dyComp = group;
        //   // 查找到折叠面板所在的激活系列
        //   const childIndex = group.children.findIndex((child) =>
        //     child.AntdChildComponents.some((v) => v.key === com.key),
        //   );
        //   if (childIndex !== -1) {
        //     this.childIndex = childIndex;
        //     // 从当前激活面板子组件中查找被删除组件索引
        //     index = group.children[childIndex].AntdChildComponents.findIndex((v) => v.key === com.key);
        //   }
        // }
      } else if (com.groupKey) {
        // 组内组件
        // 获取当前组件所在的组
        const group = getComponent(com.groupKey);
        this.group = group;
        index = group.childComList.findIndex((v) => v.key === com.key);
      } else {
        index = componentList.findIndex((v) => v.key === com.key);
      }

      if (index !== -1) {
        compsInfo[index] = com;
      }
    });
    // 删除组件时删除映射
    window.DataI.removeComKeyMap(this.comps);
    // 对compInfo中的key降序，便于遍历时从后向前删除，不会破坏数组结构导致漏删
    this.sortKeys = Object.keys(compsInfo)
      .sort((a, b) => Number.parseInt(b) - Number.parseInt(a))
      .map((v) => Number.parseInt(v));

    // 删除动态面板内部组件
    if (this.dyComp && this.childIndex !== -1) {
      this.sortKeys.forEach((v) => {
        this.dyComp.children[this.childIndex].AntdChildComponents.splice(v, 1);
      });
    } else {
      // 从组中删除组内组件
      console.log('从组中删除组内组件');
      if (this.group) {
        this.sortKeys.forEach((v) => {
          this.group.childComList.splice(v, 1);
        });
      } else {
        // 从componentList中删除组件
        this.sortKeys.forEach((v) => {
          componentList.splice(v, 1);
        });
      }
    }

    // 更新被删除组件父组
    if (this.group) {
      this.group._accurate_update = true;
    }
    if (this.dyComp) {
      this.dyComp._accurate_update = true;
    }

    // console.log(this.sortKeys, compsInfo);
    this.compsInfo = compsInfo;
    Object.values(compsInfo).forEach((v) => deepDestoryInstance(v));

    if (this.layerId === activeLayerId) {
      updateCurrentLayerComList(componentList);
    } else {
      updateComponentList(this.layerId, componentList);
    }

    // 删除完组件将选中key置空
    editorStore.setChangeKeys([]);
    // layerStore.updateComList(componentList);
    // editorStore.forceUpdate();
  }

  undo() {
    // console.log('RemoveComponentCommand --> undo');
    // 撤销命令

    const { updateComponentList, layerComList, activeLayerId, updateCurrentLayerComList } = layerStore;

    if (this.dyComp && this.childIndex !== -1) {
      // 将删除的组件还原到动态面板内部
      this.sortKeys.forEach((v) => {
        this.dyComp.children[this.childIndex].AntdChildComponents.splice(v, 0, this.compsInfo[v]);
      });
    } else {
      // 将删除的组件还原到组内部
      console.log('从组中删除组内组件');
      if (this.group) {
        this.sortKeys.forEach((v) => {
          this.group.childComList.splice(v, 0, this.compsInfo[v]);
        });
      } else {
        // 将删除的组件还原到componentList内部
        // 考虑到执行撤销操作时不一定位于组件被删除时所在的图层，所以不能全部使用updateCurrentLayerComList去进行更新
        const layer = layerComList.find((l) => l.layerId === this.layerId);
        if (!layer) {
          console.warn('组件所在图层不存在');
          return;
        }
        const { componentList } = layer;

        this.sortKeys.forEach((v) => {
          const com = this.compsInfo[v];
          componentList.splice(v, 0, com);
        });

        if (this.layerId === activeLayerId) {
          updateCurrentLayerComList(componentList);
        } else {
          // 当切换到了其他图层执行撤销操作
          updateComponentList(this.layerId, componentList);
        }
      }
    }

    // 撤销删除时还原组件映射
    this.sortKeys.forEach((v) => {
      window.DataI.addComKeyMap(this.compsInfo[v]);
    });

    // 更新被删除组件父组
    if (this.group) {
      this.group._accurate_update = true;
    }
    if (this.dyComp) {
      this.dyComp._accurate_update = true;
    }
    // editorStore.forceUpdate();
  }
}
