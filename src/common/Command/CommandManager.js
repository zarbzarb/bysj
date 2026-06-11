/*
 * @Author: zengwei
 * @Date: 2021-08-20 20:48:21
 * @Last Modified by: zengwei
 * @Last Modified time: 2023-05-12 00:20:29
 */
import { message } from 'antd';
import { Store } from '@/store';

const { editorStore } = Store;

// 命令管理对象
const cmdManager = (() => {
  let redoStack = []; // 重做栈
  let undoStack = []; // 撤销栈
  const stackSize = 15;

  return {
    /**
     * 需要回退的操作更新数据全部执行此操作命令
     * @param {命令对象} cmd
     */
    execute(cmd) {
      if (!cmd) {
        return;
      }
      // 1. 执行当前操作命令
      cmd.execute(); // 执行execute
      // 2. 放入回退栈
      // undoStack.push(cmd); // 入栈
      cmdManager.inStack(cmd);
      // 3. 清空重做栈
      redoStack = []; // 清空 redoStack
      // 4. 更新存储栈,刷新页面
      editorStore.updateStack(undoStack, redoStack, 'excute');
    },
    /**
     * 回退命令
     */
    undo() {
      if (undoStack.length === 0) {
        message.warning('已经回退到最后一步了');
        return;
      }
      // 1. 取出最后一条执行记录
      const cmd = undoStack.pop();
      // 2. 放入重做栈
      redoStack.push(cmd);
      // 3. 执行撤销命令
      cmd.undo();
      // 4. 更新存储栈,刷新页面
      editorStore.updateStack(undoStack, redoStack, 'undo');
    },
    /**
     * 重做命令
     */
    redo() {
      if (redoStack.length === 0) {
        message.warning('没有可前进的步骤了');
        return;
      }
      // 1. 取出最后一条重做记录
      const cmd = redoStack.pop();
      // 2. 执行重做
      cmd.execute();
      // 3. 放入回退栈
      undoStack.push(cmd);
      // 4. 更新存储栈,刷新页面
      editorStore.updateStack(undoStack, redoStack, 'redo');
    },
    redoStack() {
      return redoStack;
    },
    undoStack() {
      return undoStack;
    },
    clearStack() {
      undoStack = [];
      redoStack = [];
      editorStore.updateStack(undoStack, redoStack, 'clear');
    },
    inStack(cmd) {
      if (undoStack.length >= stackSize) {
        undoStack.shift();
      }
      undoStack.push(cmd); // 入栈
    },
  };
})();
// 挂载到window上方便调试查看，可删除
window.cmdManager = cmdManager;
export default cmdManager;
