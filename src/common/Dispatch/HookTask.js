class Hook {
  constructor(pageId) {
    this.isLoaded = false;
    this.isCompeted = false;
    this.pageId = pageId;
  }

  loaded() {
    this.isLoaded = true;
  }

  competed() {
    this.isCompeted = true;
  }
}

class HookTask {
  constructor() {
    this.hooks = {};
  }

  addHook(pageId) {
    this.hooks[pageId] = new Hook(pageId);
  }
}
export default new HookTask();
