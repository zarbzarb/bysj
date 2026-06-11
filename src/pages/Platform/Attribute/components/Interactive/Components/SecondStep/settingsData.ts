import { GetQueryString } from '@/utils/BrowserUtils';

/**
 * 交互初始化数据结构
 */
const animateIn = {
  animationStep: [
    { animationType: 'flash', hasEnd: false, duration: 2, delay: 1 },
    { animationType: 'swing', hasEnd: false, duration: 3, delay: 3 },
    { animationType: 'bounceIn', hasEnd: false, duration: 4, delay: 6 },
  ],
  startPosition: {
    x: 8,
    y: 15,
  },
};

const animateLoop = {
  animationStep: [
    { animationType: 'flash', hasEnd: false, duration: 2, delay: 1 },
    { animationType: 'swing', hasEnd: false, duration: 3, delay: 3 },
    { animationType: 'bounceIn', hasEnd: false, duration: 4, delay: 6 },
  ],
  startPosition: {
    x: 8,
    y: 15,
  },
};

const animateOut = {
  animationStep: [
    { animationType: 'flash', hasEnd: false, duration: 2, delay: 1 },
    { animationType: 'swing', hasEnd: false, duration: 3, delay: 3 },
    { animationType: 'bounceIn', hasEnd: false, duration: 4, delay: 6 },
  ],
  startPosition: {
    x: 8,
    y: 15,
  },
};

const animateSettings = {
  animationSettings: [],
};

const variableSettings = {
  variable: undefined,
  type: 'input',
  value: '',
};

const createToggle = {
  compKey: '',
  createFlag: 1, // 默认创建
  appPageId: '', // 切换页面的 appPageId
};

const visiableToggle = {
  compKey: '',
  visiable: '1', // 默认隐藏
  appPageId: '', // 切换页面的 appPageId
};
// 事件发布
const eventEmit = {
  eventKey: '',
  eventType: '1', // v8.3 之前使用
  eventValue: '', // v8.3 之前使用
  dataParams: [], // v8.3 新增, 代替上面旧的结构
};

const gisEventEmit = {
  eventKey: '',
  eventType: '1',
  eventValue: '',
  mapConfig: {},
  mapAction: [],
};

const sceneInteraction = {
  scenekey: '', // 场景组件key
  actionKey: '', // 动作key
};

const videoInteraction = {
  compKey: '', // 组件key
  actionKey: '', // 动作key
  appPageId: '', // 切换页面的 appPageId
};

// v6.19 新增全屏显示设置
const fullScreenSetting = {
  fullScreen: '1', // '1' 全屏,'0' 恢复,'2' 切换
};

// v7.4 跳转页面设置
const jumpPageSetting = {
  target: GetQueryString('type') === 'page' ? '_router' : '_self', // '_self' 覆盖当前页面,'_blank' 打开标签页, '_router' 切换页面
  url: '',
  appPageId: '', // 切换页面的 appPageId
};

// v7.9 刷新数据源
const refreshDataSource = {
  compKey: '', // 组件key
  dataParams: [],
  appPageId: '', // 切换页面的 appPageId
};

// v8.3.0 更新数据
const updateData = {
  compKey: '', // 组件key
  dataParams: [],
};

// v8.5.0触发组件特定动作
const comSpecialAction = {
  compKey: '', // 组件key
  actionParam: '', // 触发组件动作参数
};

// v8.16.0触发远程事件
const remoteEvent = {
  appPageId: '', // 页面id
  eventKey: '', // 事件key
  dataParams: [], // 事件参数
};

const crossOriginMessage = {
  targetType: 'iframe', // iframe, parent
  compKey: '', // 组件key
  appPageId: '',
  isTarget: false,
  targetUrl: [
    {
      updateType: 1,
      inputVal: undefined,
      compKey: undefined,
      compDataItem: undefined,
      compDataItemOptions: [],
      variableKey: undefined,
    },
  ],
  sendData: [
    {
      updateType: 1,
      inputVal: undefined,
      compKey: undefined,
      compDataItem: undefined,
      compDataItemOptions: [],
      variableKey: undefined,
    },
  ],
};

const dataQuery = {};

const SetPramsAction = {
  compKey: '', // 组件key
  dataParams: [],
};

export default {
  animateIn,
  animateOut,
  animateLoop,
  animateSettings, // 动画设置
  variableSettings, // 变量设置
  createToggle, // 创建销毁
  visiableToggle, // 显示隐藏
  eventEmit, // 发布事件
  gisEventEmit, // 地图交互
  sceneInteraction, // 场景互动
  videoInteraction, // 视频交互
  // v6.19 新增全屏显示
  fullScreen: fullScreenSetting,
  // v7.4 跳转页面设置
  jumpPage: jumpPageSetting,
  // v7.9 刷新数据源
  refreshDataSource,
  // v8.3.0 更新数据
  updateData,
  // v8.5.0 触发组件特定动作
  comSpecialAction,
  remoteEvent,
  // 数据请求
  dataQuery,
  crossOriginMessage,
  SetPramsAction,
} as const;
