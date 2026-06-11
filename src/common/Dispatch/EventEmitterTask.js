class EventEmitterTask {
  constructor() {
    // 单例
    if (EventEmitterTask.instance instanceof EventEmitterTask) {
      return EventEmitterTask.instance;
    }
    EventEmitterTask.instance = this;
    return this;
  }

  events = {};

  addEvents(type, listener, pageId) {
    const appPageId = pageId;
    const field = Symbol(type);
    this.events[appPageId] = {
      ...(this.events[appPageId] ?? {}),
      [field]: {
        type,
        listener,
      },
    };
  }

  removeEvents(pageId) {
    // 1. 调用globalEventEmitter.removeListener方法删除
    const currentPageEvents = this.events[pageId];
    const keys = Object.getOwnPropertySymbols(currentPageEvents);

    const pageEvents = keys.map((key) => currentPageEvents[key]);
    pageEvents.forEach(({ type, listener }) => window.globalEventEmitter.removeListener(type, listener));

    // 2. 从队列中删除
    delete this.events[pageId];
  }

  removeAllEvents() {
    const appId = screenConfig.appId;
    const homePageId = screenConfig.homePageId;
    for (const pageId in this.events) {
      if (homePageId != pageId && appId != pageId) {
        this.removeEvents(pageId);
      }
    }
  }
}
const eventEmitterTask = new EventEmitterTask();
window.eventEmitterTask = eventEmitterTask;
export default eventEmitterTask;
