/*
 * @Author: zengwei
 * @Date: 2021-08-25 10:29:21
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2023-05-30 10:37:34
 */
import { bunchFn } from '@/components/ContextMenu/Operation';
import { splitGroupByItem } from '@/utils/configPageUtils';
import { Store } from '@/store/index';
import Command from './BaseCommand';

const getComponent = window.DataI.getComponentByKey;
const { editorStore, layerStore, globalStore, pageTabsStore } = Store;

/**
 * 成组取消成组操作命令
 */
export default class BunchingCommand extends Command {
  constructor(keys, type) {
    super();
    this.keys = keys; // 选中组或组件的key集合
    this.type = type; // 用于判断是成组还是取消组
    this.groupItem = undefined; // 成组后的组
    this.groupItemKeys = undefined; // 取消组后的组件key
    this.dismissGroupItem = undefined; // 取消的组
    this.dismissGroupParentKey = undefined; // 取消组的父级
  }

  static cmdType = 'BunchingCommand';

  execute() {
    // console.log('BunchingCommand --> exec', this.keys, this.type);
    if (this.type === 'create') {
      // 右键菜单成组
      const item = bunchFn(layerStore, pageTabsStore, globalStore.bigScreenType, this.keys);
      if (!item) return;
      item._accurate_update = true;
      window.DataI.addComKeyMap(item);
      editorStore.changeComponents([item.key]);
      this.groupItem = item;
    } else if (this.type === 'dismiss') {
      // 右键菜单取消组
      if (this.keys.length === 1) {
        // 取消的组
        this.dismissGroupItem = getComponent(this.keys[0]);
        window.DataI.removeCom(this.dismissGroupItem);
        this.groupItemKeys = splitGroupByItem(this.dismissGroupItem);
        // 取消的父组下的组,记录父组用于回退
        if (this.dismissGroupItem.groupKey) {
          this.dismissGroupParentKey = this.dismissGroupItem.groupKey;
          // 选中取消组的父祖
          editorStore.changeComponents([this.dismissGroupParentKey]);
        } else {
          // 取消组无父祖，取消选中
          editorStore.changeComponents([]);
          // 取消组无父祖，选中取消组内的组件
          // editorStore.changeComponents(this.groupItemKeys || []);
        }
        // editorStore.forceUpdate();
      }
    } else {
      // console.log('other');
    }
  }

  undo() {
    // console.log('BunchingCommand --> undo');

    if (this.type === 'create') {
      // 成组对应的回退操作
      splitGroupByItem(this.groupItem);
      window.DataI.removeCom(this.groupItem);
      // editorStore.forceUpdate();
    } else if (this.type === 'dismiss') {
      // 取消组对应的回退操作
      const item = bunchFn(
        layerStore,
        pageTabsStore,
        globalStore.bigScreenType,
        this.groupItemKeys,
        this.dismissGroupItem.key,
        this.dismissGroupItem.styles,
        this.dismissGroupParentKey,
        this.dismissGroupItem.name,
      );
      window.DataI.addComKeyMap(item);
      if (item && item.key) {
        editorStore.changeComponents([item.key]);
      }
    }
  }
}
