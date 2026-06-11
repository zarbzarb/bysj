/*
 * @Author: zengwei
 * @Date: 2022-12-12 16:33:32
 * @Last Modified by: zengwei
 * @Last Modified time: 2023-04-15 19:17:28
 */

import Command from './BaseCommand';
/**
 * 数据状态命令类(antd组件更新props)
 */
export default class UpdateDataSourceCommand extends Command {
  constructor(el, field, value) {
    super();
    this.el = el;
    this.field = field;
    this.value = value;
    this.oldValue = JSON.parse(JSON.stringify(this.el.dataset[this.field]));
  }

  static cmdType = 'UpdateDataSourceCommand';

  execute() {
    // console.log('UpdateFieldCommand --> exec', this.field, this.value);
    // 执行数据更新
    this.el.dataset[this.field] = this.value;
    if (this.el.refresh && typeof this.el.refresh === 'function') {
      this.el.refresh();
    }
  }

  undo() {
    // console.log('UpdateFieldCommand --> undo', this.undoProps);
    // 撤销数据更新
    this.el.dataset[this.field] = this.oldValue;
    if (this.el.refresh && typeof this.el.refresh === 'function') {
      this.el.refresh();
    }
  }
}
