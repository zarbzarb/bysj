/*
 * @Author: zengwei
 * @Date: 2021-08-20 20:52:48
 * @Last Modified by: zengwei
 * @Last Modified time: 2023-04-15 19:10:56
 */
import Command from './BaseCommand';
/**
 * 数据状态命令类(antd组件更新props)
 */
export default class UpdateFieldCommand extends Command {
  constructor(el, field, value) {
    super();
    // 执行属性更新之前组件原始数据，用于撤销回退(也可记录单一字段)
    const props = JSON.parse(JSON.stringify(el.props));
    this.el = el;
    this.field = field;
    this.value = value;
    this.undoProps = props;
  }

  static cmdType = 'UpdateFieldCommand';

  execute() {
    // 执行数据更新
    this.updateField(this.el, this.field, this.value);

    // antd类型组件组件级刷新
    if (this.el.refresh && typeof this.el.refresh === 'function') {
      this.el.refresh();
    }
  }

  undo() {
    // 撤销数据更新
    this.el.props = this.undoProps;

    // antd类型组件组件级刷新
    if (this.el.refresh && typeof this.el.refresh === 'function') {
      this.el.refresh();
    }
  }
}
