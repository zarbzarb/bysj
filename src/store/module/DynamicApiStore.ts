import { makeAutoObservable } from 'mobx';

class DynamicApiStore {
  rootStore = null;

  apiVisiable = false;

  mapVisiable = false;

  dataMapList = [];

  item = undefined;

  // 构造函数
  constructor(rootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  toggleApiVisiable = () => {
    this.apiVisiable = !this.apiVisiable;
  };

  toggleMapVisiable = () => {
    this.mapVisiable = !this.mapVisiable;
  };

  showModal = (item = {}) => {
    this.item = item;
  };

  hideModal = () => {
    this.item = undefined;
  };
}

export default DynamicApiStore;
