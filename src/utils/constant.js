/**
 * 初始的screenConfig
 */
export const SCREENTCONFIG = {
  fonts: [],
  pcSize: '1920X1080',
  width: '1920',
  height: '1080',
  opacity: '1',
  fontVar: 'font',
  title: '面向数字孪生的低代码平台',
  baseUrl: '',
  scale: 'initSize',
  favicon: '/assets/datai/icons/favicon.ico',
  filter: null,
  layerConfig: null,
  // 桶名
  bucketName: 'ioc-screen',
  // 租户
  tenantId: 'default',
  // 环境变量()
  environment: {},
  pageId: '',
  // 是否使用缓存数据
  dataType: 0, // 0:不使用，1:使用，默认不使用缓存数据
  // 加载页配置
  loading: {
    backgroundColor: '#040C1F',
    imgSrc: '/assets/datai/icons/loading.png',
  },
  // 动态数据源缓存最近使用的6个接口
  dynamicApis: undefined,
  // minio地址
  ossProxy: '',
};

// 数据源为单一对象数组的组件Type
export const SingleObjectArrayCompType = [
  {
    classType: 'antd',
    comType: 'Text',
  },
  {
    classType: 'antd',
    comType: 'Button',
  },
  {
    classType: 'antd',
    comType: 'Statistic',
  },
  {
    classType: 'antd',
    comType: 'UniversalPlayer',
  },
  {
    classType: 'antd',
    comType: 'JessiucaPlayer',
  },
  {
    classType: 'antd',
    comType: 'ColorPicker',
  },
  {
    classType: 'antd',
    comType: 'IFrame',
  },
  {
    classType: 'antd',
    comType: 'PanoramaMap',
  },
  {
    classType: 'com',
    comType: 'MediaImageDynamic',
  },
  {
    classType: 'com',
    comType: 'MediaImageBasic',
  },
  {
    classType: 'com',
    comType: 'FlopBasic',
  },
  {
    classType: 'com',
    comType: 'TextMarquee',
  },
  {
    classType: 'com',
    comType: 'TextScore',
  },
  {
    classType: 'com',
    comType: 'TextPagination',
  },
  {
    classType: 'com',
    comType: 'ProgressBar',
  },
  {
    classType: 'com',
    comType: 'ChartSemicircle',
  },
  {
    classType: 'com',
    comType: 'ChartRingGauge',
  },
  {
    classType: 'com',
    comType: 'ChartGauge',
  },
  {
    classType: 'com',
    comType: 'ChartDGauge',
  },
];
// 数据源为多对象数组的组件Type
export const MultipleObjectArrayCompType = [];

export const HOST_INDICATOR = '/indicator'; // 指标接口域名
export const URL_INDICATORS_VALUES = '/x-indicator-service/indicators/values'; // 获取指标的值 Url
export const URL_DIMENSIONS_VALUES = '/x-indicator-service/dimensions/values'; // 获取维度的值 Url

export const designToken = {
  // 全局 token
  token: {
    // colorPrimary: '#007693',
    colorPrimary: '#2D9CB8',
    colorInfo: '#2d9cb8',
    // borderRadius: 2,
  },
  // 组件 token
  components: {
    Slider: {
      handleColor: '#056977',
      handleActiveColor: '#056977',
      trackBg: '#2D9CB8',
      trackHoverBg: '#2D9CB8',
      colorBgElevated: '#2D9CB8',
      colorPrimaryBorderHover: '#056977',
    },
    Radio: {
      dotSize: 8,
    },
  },
};

// v8.10 页面对应的滤镜配置
export const filter = {
  switchVal: false,
  hueRotate: 0,
  saturation: 0,
  brightness: 0,
  contrastRatio: 0,
  opacity: 100,
};

// v8.16 支持的远程事件
export const SUPPORT_REMOTE_EVENTS = [
  {
    label: '单击',
    value: 'click',
  },
  {
    label: '选中值',
    value: 'changeValue',
  },
];
