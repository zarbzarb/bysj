/*
 * @Author: zengwei
 * @Date: 2021-09-13 10:03:20
 * @Last Modified by: zengwei
 * @Last Modified time: 2022-12-28 22:33:30
 */

import Command from './BaseCommand';
/**
 * 地图子组件操作
 */
export default class MapLayersCommand extends Command {
  constructor(com, parent, options) {
    super();
    this.com = com; // 子组件
    this.parent = parent; // 地图
    this.options = options;
  }

  static cmdType = 'MapLayersCommand';

  resetRender(com) {
    // v8.3: 普通页引用地图的子组件不需要渲染，重置 render 函数
    com.initCom.prototype._compType = com.compType; // 引用地图和其子组件都会加 compType = 'referenceMap'
    let render = com.initCom.prototype.render;
    com.initCom.prototype.render = function (...args) {
      const constructor = Object.getPrototypeOf(this);
      if (constructor._compType === 'referenceMap') return;
      render.apply(this, args);
    };
  }

  execute() {
    // console.log('MapLayersCommand --> exec', this.com, this.parent);
    if (!this.parent) {
      console.warn('地图不存在');
      return;
    }
    if (!this.parent.layers) {
      this.parent.layers = [];
    }
    const { type, index, copyInstance, editName, visible } = this.options;
    const { com } = this;
    const zIndex = this.parent.layers?.length || 0;
    const map = this.parent.instance._map || {};

    switch (type) {
      case 'add':
        this.resetRender(com); // 重写下 render 函数，实现引用地图及其组件不渲染
        com.instance = new com.initCom(undefined, undefined, undefined, map);
        // 改变组件层级
        com.instance.mergeAttr({
          zIndex,
        });
        this.parent.layers.unshift(com);
        break;

      case 'del':
        this.parent.layers.splice(index, 1);
        com.instance.destroy();
        break;

      // case 'copy':
      //   // v8.5.0 修改拷贝为复制
      //   if (!this.parent.layers) {
      //     this.parent.layers = [];
      //   }
      //   com.instance = new com.initCom(undefined, copyInstance._config, copyInstance._attr, map);
      //   this.resetRender(com);
      //   com._data = copyInstance._data;
      //   com.instance._data = copyInstance.instance._data;
      //   com.instance.mergeAttr({
      //     relation_layer_code: copyInstance.instance.compAttr.relation_layer_code, // 选中的图层
      //   });
      //   com.name = `${copyInstance.name}_copy`;
      //   this.parent.layers.splice(index, 0, com);
      //   break;
      case 'paste':
        // v8.5.0 修改拷贝为粘贴
        if (!this.parent.layers) {
          this.parent.layers = [];
        }
        // 初始化地图子图层实例
        com.instance = new com.initCom(undefined, copyInstance._config, copyInstance._attr, map);
        this.resetRender(com);
        com._data = copyInstance._data;
        com.instance._data = copyInstance._data;

        com.name = `${copyInstance.name}_copy`;
        this.parent.layers.unshift(com);
        // 改变组件层级
        com.instance.mergeAttr({
          zIndex,
          relation_layer_code: copyInstance._attr.relation_layer_code, // 选中的图层
        });
        // v8.9 粘贴组件强制显示
        com.instance.visible = true;
        com.instance.show();
        break;

      case 'edit':
        com.name = editName;
        break;

      case 'visible':
        if (visible) {
          com.instance.visible = false;
          com.instance.hide();
        } else {
          com.instance.visible = true;
          com.instance.show();
        }
        break;

      default:
        break;
    }
  }

  undo() {
    // console.log('MapLayersCommand --> undo', this.com, this.parent);
    if (!this.parent) {
      console.warn('地图不存在');
      return;
    }
    if (!this.parent.layers) {
      this.parent.layers = [];
    }
    const { type, index, layerName, visible } = this.options;
    const { com } = this;
    const map = this.parent.instance._map;
    switch (type) {
      case 'add':
        if (this.parent) {
          this.parent.layers.splice(0, 1);
          com.instance.destroy();
        }
        break;

      case 'del':
        com.instance = new com.initCom(undefined, com._config, com._attr, map);
        this.resetRender(com);
        this.parent.layers.splice(index, 0, com);
        break;

      // case 'copy':
      //   this.parent.layers.splice(index, 1);
      //   com.instance.destroy();
      //   break;
      // v8.5.0 修改拷贝为粘贴
      case 'paste':
        if (this.parent) {
          this.parent.layers.splice(0, 1);
          com.instance.destroy();
        }
        break;

      case 'edit':
        com.name = layerName;
        break;

      case 'visible':
        if (visible) {
          com.instance.visible = true;
          com.instance.show();
        } else {
          com.instance.visible = false;
          com.instance.hide();
        }
        break;

      default:
        break;
    }
  }
}
