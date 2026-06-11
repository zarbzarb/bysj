import { makeAutoObservable } from 'mobx';
import * as publishApi from '@/services/apis/publishApi';
import { message } from 'antd';
import { clearPendingXhrList } from '@/utils/BrowserUtils';

export default class VersionStore {
  rootStore: any;

  // 版本列表，默认开发版本是主版本
  versionList = [
    {
      version: 'dev',
      isMajorVersion: true,
      versionDescription: '',
    },
  ];

  // 当前版本号
  currentVersion = 'dev';

  // 切换版本 loading
  versionLoading = false;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  // 编辑态传给接口的 version 参数
  get apiVersion() {
    const {
      GlobalStore: { bigScreenType },
    } = this.rootStore;
    return bigScreenType === 'page' ? this.currentVersion : undefined;
  }

  // 当前版本详情
  get currentVersionDetail() {
    const curVersion: any = this.versionList.find((v) => v.version === this.currentVersion);
    return curVersion || {};
  }

  // 当前版本是否是主版本
  get isMajorVersion() {
    return !!this.currentVersionDetail.isMajorVersion;
  }

  // url 上 version 参数值: 预览页面、预览应用
  get urlVersion() {
    const {
      GlobalStore: { bigScreenType },
    } = this.rootStore;
    return this.isMajorVersion || bigScreenType !== 'page' ? '' : this.currentVersion;
  }

  setVersionLoading = (bool) => {
    this.versionLoading = !!bool;
  };

  // 切换版本号并请求对应版本的配置信息
  changeCurrentVersion = (cur = '') => {
    const { PageTreeStore, PageTabsStore, ServiceStore, GlobalStore, LayerStore, ControlStore } = this.rootStore;
    const { bigScreenType, bigScreenId } = GlobalStore;
    this.currentVersion = cur;
    // 置空一些初始值， 释放一些内存
    PageTabsStore.reset();
    PageTreeStore.reset();
    LayerStore.reset();
    ControlStore.setIsDataStoreModify(false);
    window.globalEventEmitter?.removeAllListeners();
    window.dataStore = [];
    window.screenConfig = undefined;
    window.componentList = [];
    window.logList = [];

    // 请求对应版本大屏配置
    this.versionLoading = true;
    clearPendingXhrList(); // 取消 pending 中请求
    ServiceStore.loadScreenInfo(bigScreenType, bigScreenId);
  };

  // 获取版本列表
  getVersionList = async (appId: string) => {
    // const res = await publishApi.GET_VERSION_LIST({ appId });
    const res = {
      code: '200',
      data: [
        {
          isMajorVersion: true,
          pageId: '1895378739046699008',
          version: 'dev',
          versionDescription: '',
        },
      ],
      message: '处理成功',
      success: true,
    };
    if (res?.code === '200' && res.data && res.data.length > 0) {
      this.versionList = res.data;
    }
  };

  // 发布版本
  releaseVersion = async (params: any, cb) => {
    const res = await publishApi.POST_RELEASE_VERSION(params);
    if (res?.code === '200') {
      message.success('发布版本成功');
      this.getVersionList(params.appId);
      cb && cb();
    } else {
      message.error(res.message);
    }
  };
}
