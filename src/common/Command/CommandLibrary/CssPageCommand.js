/*
 * @Author: zengwei
 * @Date: 2021-08-30 15:27:18
 * @Last Modified by: zengwei
 * @Last Modified time: 2023-01-04 11:27:53
 */
import { cloneDeep } from 'lodash';
import Command from './BaseCommand';
/**
 * 数据状态命令类(datai组件配置面板属性更改指令)
 */
export default class CssPageCommand extends Command {
  constructor(instance, value, field, parentFields = [], index = -1, type) {
    super();
    this.instance = instance; // 组件实例
    this.field = field; // 更新字段
    this.value = value; // 更改后属性
    this.parentFields = parentFields;
    this.index = index;
    this.undoValue = undefined; // 用于撤销操作的初始数据
    this.type = type;
  }

  static cmdType = 'CssPageCommand';

  execute() {
    // console.log('CssPageCommand --> exec', this.value, this.field);
    // 执行数据更新

    // 兼容datai组件中将配置栏封装成单个组件后使用updateAttr更新数据(datai组件src/utils)
    if (this.instance.props.CompInstance && !this.instance.state.CompInstance) {
      const { compAttr, CompInstance, attr } = this.instance.props;
      const pField = this.field;
      const { value } = this;
      if (pField) {
        this.undoValue = cloneDeep(compAttr[attr][pField]);
        compAttr[attr][pField] = { ...this.instance.state[pField], ...value };
      } else {
        this.undoValue = cloneDeep(compAttr[attr]);
        compAttr[attr] = { ...this.instance.state, ...value };
      }
      this.instance.setState({
        ...compAttr[attr],
      });
      CompInstance.updateAttr(compAttr);
      return;
    }

    // 兼容datai组件中config.js中使用changeAttr更新数据
    const { compAttr, CompInstance } = this.instance.state;
    const parentField = this.parentFields[0];
    let { index } = this;
    const { type } = this;
    const arr = this?.field?.split('.'); // 属性用点连接

    if (!arr) return;

    const lastField = arr.splice(-1, 1); // 最后一个属性
    if (parentField) {
      if (index === -1) {
        let temp = compAttr[parentField];
        arr.forEach((item) => {
          temp = temp[item]; // 属性嵌套处理
        });
        this.undoValue = cloneDeep(temp[lastField]);
        temp[lastField] = this.value;
      } else if (index !== -1 && this.type) {
        // 兼容地图子组件属性回退（点线面图层）
        index = Number.parseInt(this.index);
        let temp = compAttr[parentField][index][type];
        arr.forEach((item) => {
          temp = temp[item]; // 属性嵌套处理
        });
        this.undoValue = cloneDeep(temp[lastField]);
        temp[lastField] = this.value;
      } else {
        index = Number.parseInt(this.index);
        let temp = compAttr[parentField][index];
        arr.forEach((item) => {
          temp = temp[item]; // 属性嵌套处理
        });
        this.undoValue = cloneDeep(temp[lastField]);
        temp[lastField] = this.value;
      }
    } else {
      let temp = compAttr;
      arr.forEach((item) => {
        temp = temp[item]; // 属性嵌套处理
      });
      this.undoValue = temp[lastField] ? JSON.parse(JSON.stringify(temp[lastField])) : temp[lastField];
      temp[lastField] = this.value;
    }

    if (this.instance.batchUpdateWMS) {
      // 兼容地图子组件属性回退
      this.instance.setState(
        {
          compAttr,
        },
        () => {
          this.instance.batchUpdateWMS(compAttr);
        },
      );
    } else {
      this.instance.setState({
        compAttr: { ...compAttr },
      });
    }

    CompInstance.updateAttr(compAttr);
  }

  undo() {
    // console.log('CssPageCommand --> undo', this.value, this.field);
    // 撤销数据更新
    if (this.instance.props.CompInstance && !this.instance.state.CompInstance) {
      const { compAttr, CompInstance, attr } = this.instance.props;
      const pField = this.field;
      if (pField) {
        compAttr[attr][pField] = this.undoValue;
      } else {
        compAttr[attr] = this.undoValue;
      }
      this.instance.setState({
        ...compAttr[attr],
      });
      CompInstance.updateAttr(compAttr);
      return;
    }

    const { compAttr, CompInstance } = this.instance.state;
    const parentField = this.parentFields[0];
    let { index } = this;
    const { type } = this;
    const arr = this.field.split('.'); // 属性用点连接
    const lastField = arr.splice(-1, 1); // 最后一个属性
    if (parentField) {
      if (index === -1) {
        let temp = compAttr[parentField];
        arr.forEach((item) => {
          temp = temp[item]; // 属性嵌套处理
        });
        temp[lastField] = this.undoValue;
      } else if (index !== -1 && type) {
        index = Number.parseInt(this.index);
        let temp = compAttr[parentField][index][type];
        arr.forEach((item) => {
          temp = temp[item]; // 属性嵌套处理
        });
        temp[lastField] = this.undoValue;
      } else {
        index = Number.parseInt(this.index);
        let temp = compAttr[parentField][index];
        arr.forEach((item) => {
          temp = temp[item]; // 属性嵌套处理
        });
        temp[lastField] = this.undoValue;
      }
    } else {
      let temp = compAttr;
      arr.forEach((item) => {
        temp = temp[item]; // 属性嵌套处理
      });
      temp[lastField] = this.undoValue;
    }

    this.instance.setState({
      compAttr: { ...compAttr },
    });
    CompInstance.updateAttr(compAttr);
  }
}
