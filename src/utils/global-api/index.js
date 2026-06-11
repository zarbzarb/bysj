import DataI from './core';
window.pageLoadLogs = [];

const removeComs = (comps) => {
  comps.forEach((com) => {
    if (com.groupKey) {
      const group = DataI.getComList(com.groupKey);
      if (group.length > 0) {
        const index = group[0].childComList.findIndex((cp) => cp.key === com.key);
        group[0].childComList.splice(index, 1);
      }
    } else {
      // const index = LayerStore.comList.findIndex((cp) => cp.key === com.key);
      // LayerStore.comList.splice(index, 1);
    }
  });
  // ComStore && ComStore.forceUpdate();
};

DataI.extend({
  remove(selector) {
    if (!DataI.isConfigPage()) {
      return console.warn('预览页不支持删除组件!');
    }
    const comps = DataI.getComList(selector);
    if (comps.length > 0) {
      removeComs(comps);
    }
    return comps;
  },
  copy(selector) {
    if (!DataI.isConfigPage()) {
      return console.warn('预览页不支持复制组件!');
    }
    const keys = DataI.getComList(selector).map((com) => com.key);
    // CopyComp(keys, ComStore);
    // ComStore.forceUpdate();
  },
  save() {
    if (!DataI.isConfigPage()) {
      return console.warn('预览页不支持保存接口!');
    }
    window.globalEventEmitter.emit('saveScreen');
  },
  comList() {
    // return LayerStore.comList;
  },
  pageLoad(pageId) {
    console.error('页面开始渲染->>>>', pageId);
    const start = new Date().getTime();

    const loadInstance = window.pageLoadLogs.find((pageInfo) => pageInfo.pageId == pageId);
    if (!loadInstance) {
      window.pageLoadLogs.push({
        pageId,
        start,
      });
    } else {
      // 切换页面重新更新当前页面的初始渲染时间
      loadInstance.start = start;
    }
  },
  padeLoaded(pageId) {
    console.error('页面渲染完毕->>>>', pageId);
    const end = new Date().getTime();

    let loadInstance = window.pageLoadLogs.find((pageInfo) => pageInfo.pageId == pageId);
    if (!loadInstance) return;

    const renderTime = end - loadInstance.start;

    // loadInstance = {
    //   ...loadInstance,
    //   end,
    //   renderTime,
    // };

    // window.pageLoadLogs.forEach((page) => {
    //   if (page.pageId == pageId) {
    //     page = loadInstance;
    //   }
    // });

    console.error('页面加载渲染时间->>>>', renderTime);
  },
});

DataI.fn.extend({
  remove(selector) {
    if (!DataI.isConfigPage()) {
      return console.warn('预览页不支持删除组件!');
    }
    let comps = [];
    comps = !selector ? this.toArray() : this.find(selector).toArray();
    removeComs(comps);
    return this.pushStack(comps);
  },
  copy(selector) {
    if (!DataI.isConfigPage()) {
      return console.warn('预览页不支持复制组件!');
    }
    let keys = [];
    keys = !selector ? this.map((com) => com.key) : this.find(selector).map((com) => com.key);
    // const comps = CopyComp(keys, ComStore);
    // ComStore.forceUpdate();
    return this.pushStack(comps);
  },
  save() {
    if (!DataI.isConfigPage()) {
      return console.warn('预览页不支持保存接口!');
    }
    DataI.save();
  },
});

export default DataI;
