/**
 * 定时任务统一调度，方便在切换页面时清除
 */
class TimerTask {
  constructor() {
    // 单例
    if (TimerTask.instance instanceof TimerTask) {
      return TimerTask.instance;
    }
    TimerTask.instance = this;
    return this;
  }

  tasks = {};

  addTask(options) {
    const { taskId } = options;
    this.tasks[taskId] = options;
  }
  /**
   * 根据Id清除定时任务
   * @param {定时任务Id} taskId
   */
  removeTask(id) {
    const { taskId, taskType } = this.tasks[id];

    switch (taskType) {
      case 'interval':
        clearInterval(taskId);
        break;
      case 'timeout':
        clearTimeout(taskId);
        break;

      default:
        clearInterval(taskId);
        break;
    }
    delete this.tasks[taskId];
  }
  /**
   * 清除所有定时器
   * @param {主页Id} homePageId 主页Id存在时，不需要清除主页定时器
   */
  removeAllTask(homePageId) {
    for (const taskId in this.tasks) {
      if (homePageId) {
        const task = this.tasks[taskId];
        if (task.appPageId !== homePageId) {
          this.removeTask(taskId);
        }
      } else {
        this.removeTask(taskId);
      }
    }
  }
}
const timerTask = new TimerTask();
window.timerTask = timerTask;
export default timerTask;
