/*
 * @Author: zengwei
 * @Date: 2021-08-20 21:01:21
 * @Last Modified by: zengwei
 * @Last Modified time: 2024-05-06 17:25:36
 */

import _ from 'lodash';

import cmdManager from './CommandManager';
// 配置栏更新props
import UpdateFieldCommand from './CommandLibrary/UpdateFieldCommand';
// 配置栏更新styles
import UpdateAttrCommand from './CommandLibrary/UpdateAttrCommand';
// 拖动组件更新styles
import DragAndMoveCommand from './CommandLibrary/DragAndMoveCommand';
// 右键菜单成组操作
import BunchingCommand from './CommandLibrary/BunchingCommand';
// datai组件属性配置面板样式更新
import CssPageCommand from './CommandLibrary/CssPageCommand';
// 向大屏中新增组件操作
import AddComponentCommand from './CommandLibrary/AddComponentCommand';
// 右键菜单删除组件
import RemoveComponentCommand from './CommandLibrary/RemoveComponentCommand';
// 右键菜单锁定命令
import LockCommand from './CommandLibrary/LockCommand';
// 组件显隐操作命令
import VisibleCommand from './CommandLibrary/VisibleCommand';
// 组件上下移动排序
import SortCommand from './CommandLibrary/SortCommand';
// 更新组件数据源
import UpdateDataSourceCommand from './CommandLibrary/UpdateDataSourceCommand';
// 更新组件交互事件
import InteractionCommand from './CommandLibrary/InteractionCommand';
// 图层操作
import LayerCommand from './CommandLibrary/LayerCommand';
// 地图子组件操作
import MapLayersCommand from './CommandLibrary/MapLayersCommand';
// 批量移动组件
import MoveCompsCommand from './CommandLibrary/MoveCompsCommand';
import TemplateCommand from './CommandLibrary/TemplateCommand';

/**
 * 登记新 command 记得在 index.d.ts 里进行补充
 */
const commandActionList = {
  updateField(...args) {
    return new UpdateFieldCommand(...args);
  },
  updateAttr(...args) {
    return new UpdateAttrCommand(...args);
  },
  dragComponent(...args) {
    return new DragAndMoveCommand(...args);
  },
  Bunching(...args) {
    return new BunchingCommand(...args);
  },
  UpdateCssPage(...args) {
    return new CssPageCommand(...args);
  },
  AddCompCommand(...args) {
    return new AddComponentCommand(...args);
  },
  RemoveCompCommand(...args) {
    return new RemoveComponentCommand(...args);
  },
  LockCommand(...args) {
    return new LockCommand(...args);
  },
  VisibleCommand(...args) {
    return new VisibleCommand(...args);
  },
  SortCommand(...args) {
    return new SortCommand(...args);
  },
  UpdateDataSourceCommand(...args) {
    return new UpdateDataSourceCommand(...args);
  },
  InteractionCommand(...args) {
    return new InteractionCommand(...args);
  },
  LayerCommand(...args) {
    const cmd = new LayerCommand(...args);
    cmdManager.execute(cmd);
  },
  MapLayersCommand(...args) {
    const cmd = new MapLayersCommand(...args);
    cmdManager.execute(cmd);
  },
  MoveCompsCommand(
    ...args: [
      any[],
      {
        [k: string]: [number, number];
      },
    ]
  ) {
    const cmd = new MoveCompsCommand(...args);
    cmdManager.execute(cmd);
  },
  TemplateCommand(...args: [any, string]) {
    const cmd = new TemplateCommand(...args);
    cmdManager.execute(cmd);
  },
  undo() {
    cmdManager.undo();
  },

  redo() {
    cmdManager.redo();
  },

  clearStack() {
    cmdManager.clearStack();
  },
};
// window.commandActionList = commandActionList;

/**
 * executeCommand 设置为全局方法
 * @param {String | Command} cmd
 * @param {any[]} args
 */
window.executeCommand = (cmd, ...args) => {
  if (_.isString(cmd)) {
    switch (cmd) {
      case 'redo': {
        cmdManager.redo();
        break;
      }
      case 'undo': {
        cmdManager.undo();
        break;
      }
      case 'clearStack': {
        cmdManager.clearStack();
        break;
      }
      default: {
        cmdManager.execute(commandActionList[cmd](...args));
      }
    }
  } else {
    cmdManager.execute(cmd(...args));
  }
};
