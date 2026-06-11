/*
 * @Author: zengwei
 * @Date: 2021-08-23 11:35:35
 * @Last Modified by: zengwei
 * @Last Modified time: 2024-07-29 10:24:17
 */

import { cloneDeep, get } from 'lodash';
import Command from './BaseCommand';
import { isPlainObject } from '@/utils/utils';
/**
 * 数据状态命令类(antd组件更新styles)
 */
export default class UpdateAttrCommand extends Command {
  constructor(el, field, value, parentField = null) {
    super();

    let undoValue = null;
    if (isPlainObject(field)) {
      undoValue = Object.fromEntries(Object.entries(field).map(([key]) => [key, get(el.styles, key)]));
    } else {
      undoValue = get(el.styles, field);
      if (parentField) {
        undoValue = get(el[parentField], field);
      }
      if (typeof undoValue === 'object') {
        undoValue = cloneDeep(undoValue);
      }
    }

    this.el = el;
    this.field = field;
    this.value = value;
    this.undoValue = undoValue;
    this.parentField = parentField;
  }

  static cmdType = 'UpdateAttrCommand';

  execute() {
    // console.log('UpdateAttrCommand --> exec', this.field, this.value, this.el);
    // 执行数据更新
    this.updateAttr(this.el, this.field, this.value, this.parentField);
  }

  undo() {
    // console.log('UpdateAttrCommand --> undo', this.undoValue);
    // 撤销数据更新
    if (isPlainObject(this.field)) {
      return this.updateAttr(this.el, this.undoValue);
    }
    this.updateAttr(this.el, this.field, this.undoValue, this.parentField);
  }
}
