/*
 * @Author: zengwei
 * @Date: 2023-05-08 14:21:36
 * @Last Modified by: zengwei
 * @Last Modified time: 2023-05-08 14:55:30
 * 隐藏组件切换为显示状态模块数据状态
 */
import { makeAutoObservable } from 'mobx';

export default class LayoutStore {
  layoutCount = 0;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * 配置界面用于重新创建组件的刷新
   * 目前只用于隐藏组件切换为显示状态的逻辑 VisibleCommand.js
   */
  forceUpdateLayout = () => {
    this.layoutCount += 1;
  };
}
