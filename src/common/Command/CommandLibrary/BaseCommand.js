/* eslint-disable class-methods-use-this */
/*
 * @Author: zengwei
 * @Date: 2021-08-20 20:37:47
 * @Last Modified by: zengwei
 * @Last Modified time: 2024-07-29 10:29:01
 */
import { isPlainObject } from '@/utils/utils';
import { set } from 'lodash';
// 命令基类
export default class Command {
  // constructor() {}

  execute() {
    throw new Error('未重写execute方法！');
  }

  undo() {
    throw new Error('未重写undo方法！');
  }

  // antd组件更新样式执行此方法(配置栏第一栏)
  updateAttr(el, field, value, parentField) {
    if (isPlainObject(field)) {
      Object.entries(field).forEach(([key, val]) => {
        set(el.styles, key, val);
      });
      el.refresh && el.refresh();
      return;
    }

    if (parentField) {
      set(el[parentField], field, value);
      el.refresh && el.refresh();
      return;
    }
    // 更新属性props
    set(el.styles, field, value);
    el.refresh && typeof el.refresh === 'function' && el.refresh();
  }

  // antd组件更新props都执行此方法(配置栏第二栏)
  updateField(el, field, value) {
    const nextProps = JSON.parse(JSON.stringify(el.props));
    // v8.17新增支同时修改多个属性值
    if (isPlainObject(field)) {
      Object.entries(field).forEach(([key, val]) => {
        set(nextProps, key, val);
      });
    } else {
      set(nextProps, field, value);
    }
    el.props = nextProps;
    el.refresh && typeof el.refresh === 'function' && el.refresh();
  }
}
