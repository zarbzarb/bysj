/*
 * @Author: zengwei
 * @Date: 2021-09-13 10:03:20
 * @Last Modified by: zengwei
 * @Last Modified time: 2023-05-08 17:30:08
 */

import { unLock, lock } from '@/EventHandlers/ContextMenuEvent';
import Command from './BaseCommand';
/**
 * 右键菜单锁定操作
 */
export default class LockCommand extends Command {
  constructor(isLock, keys) {
    super();
    this.isLock = isLock; // true:锁定 false:取消锁定
    this.keys = keys; // 当前选中组件key集合
  }

  static cmdType = 'LockCommand';

  execute() {
    // console.log('LockCommand --> exec', this.isLock, this.keys);

    if (this.isLock) {
      // 锁定: undo 时对应着取消锁定
      lock(this.keys);
    } else {
      // 取消锁定: undo 时对应着锁定
      unLock(this.keys);
    }
  }

  undo() {
    // console.log('LockCommand --> undo', this.isLock, this.keys);

    if (this.isLock) {
      unLock(this.keys);
    } else {
      lock(this.keys);
    }
  }
}
