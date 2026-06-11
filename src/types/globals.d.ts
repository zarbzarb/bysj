declare module '*.less';
declare module '*.css';
declare module '*.scss';
declare module '*.sass';
declare module 'styled-components';
declare module '@yl/datai-visual-component-library';
declare module '@yl/datai-visual-component-library/es/pureRender';
declare module 'immer';

interface Comp {
  [K: string | number | symbol]: any;
}

interface DataI {
  isArrayLike(tar: any): boolean;
  each(cs: Comp[], fn: (c: Comp) => void): void;
  map(cs: Comp[], fn: (c: Comp, idx: number) => void): void;
  merge(first: Comp[], second: Comp[]): Comp[];
  select(compKey: string): Comp;
  getComList(selector: string, list?: Comp[]): Comp[];
  isConfigPage(): boolean;
  flatten(cs: Comp[]): Comp[];
  [K: string | number | symbol]: any;
}

declare interface Window {
  globalEventEmitter: any;
  screenConfig: Record<>;
  componentList: Array;
  titleName: string;
  pageTypes: string;
  dataStore: Array;
  executeCommand: (cmd: string | Command, ...args: any[]) => void;
  setPageEventsCollection: (fn: (evts: PageEvents) => void) => 'NoExistCurrentPage' | null;
  dataqUi: any;
  DUI: import('@yl/datai-ui');
  DataI: any;
  hookSaveAble: boolean;
  saveAble: boolean; // 页面是否可以保存
  pendingXhrList: any[];
  requestPrefix: string;
  fromSdk: string;
  publicPath: string;
  wutongNsKey: string;
  comList: Record<string, any>;
  layerList: Array;
  servicelayerList: Array;
  servicelayerSearchList: Array;
  initParams: any;
  logList: Log[];
  fontFamilyList: Array;
  mapComponentList: any[];
  pageInfoMap: any;
  appLoading: boolean;
  observerMap: any;
}

declare type Optional<T extends object> = {
  [K in keyof T]+?: T[K];
};

declare type OptionalR<T extends object> = {
  [K in keyof T]+?: T[K] extends object ? Optional<T[K]> : T[K];
};

type Log = {
  info: string;
  /** HH:mm:ss.SSS */
  time: string;
  data: any;
};
