/* eslint-disable @typescript-eslint/no-unused-vars */
const CIM = 'http://61.183.76.122:9017'; // 外部场景组件调试使用
const GIS = 'http://172.26.30.146:31700';
const INDICATOR = 'http://172.30.13.177:30067'; // 指标接口测试环境

const INNER = 'http://console.inner.ioc'; // IOC开发环境
const DELIVER = 'http://console.deliver.ioc'; // IOC生产环境

const NEW_DEV = 'http://172.26.30.146:30136'; // 中台开发环境
const NEW_SAAA_DEV = 'http://172.26.30.146:39631'; // 中台 saas 开发环境
const NEW_WT_DEV = 'http://172.26.30.146:39632'; // 完全独立部署开发环境
const NEW_SAAA_SIT = 'http://172.26.30.146:39633'; // 中台 saas 测试环境
const NEW_SIT = 'http://172.26.30.146:39634'; // 完全独立部署测试环境
const CIM_SIT = 'http://172.26.30.146:30346'; // CIM集成环境
const IOC_SIT = 'http://172.26.30.142:31497'; // IOC集成环境
const SAAS = 'https://wutong.yunlizhihui.com'; // 新的生产环境
const QL_SAAS = 'https://ql.yunlizhihui.com'; // 青鸾生产环境
const PRE = 'http://172.26.30.151:31116';

const LOCAL_BACKEND = 'http://localhost:8080';

const gateway = NEW_WT_DEV; // 配置运行时环境（用于外部接口）
const backend = LOCAL_BACKEND; // 本地后端（优先使用）
const addProxy = (target, changeOrigin = true, pathRewrite) => {
  return {
    target,
    pathRewrite,
    changeOrigin,
    auth: 'admin:admin123',
  };
};

const gisAuthBypass = function (req, res, next) {
  if (req.path.includes('/api/gis/api/authentication/check')) {
    console.log('[GIS Auth Bypass] Mocking authentication check success');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ code: 200, message: 'success', data: { authorized: true } }));
    return true;
  }
  return false;
};

const proxySettings = {
  // 本地Spring Boot后端API接口（优先匹配）
  '/api/sys/data/userInfo/**': addProxy(backend), // 用户相关接口
  '/api/datai/**': addProxy(backend), // 数据大屏相关接口
  '/api/page/**': addProxy(backend), // 页面相关接口
  '/api/storage/**': addProxy(backend), // 存储相关接口
  '/api/dataSet/**': addProxy(backend), // 数据集相关接口
  '/api/dataset/**': addProxy(backend), // 数据集相关接口（新）
  '/api/ofc/**': addProxy(backend), // 组件相关接口
  '/uploads/**': addProxy(backend), // 上传文件访问

  // 外部服务接口（保留原有配置）
  '/gw/**': addProxy(gateway), // 中台网关
  '/auth/*': addProxy(gateway), // 新版用户中心
  '/iocoss': addProxy(gateway), // 存储服务
  '/oss': addProxy(gateway), // 存储服务， cim 那边图片是 oss 开头
  '/gis/**': addProxy(GIS), // GIS
  '/gis-platform/**': addProxy(GIS), // 时空地理
  '/imageproxy/**': addProxy(gateway), // 图片代理
  '/cim-platform/**': addProxy(gateway), // CIM 环境
  '/cim-visual-template/**': addProxy(gateway), // CIM 环境孪生底板
  '/mid-platform-devplatform/**': addProxy(gateway), //
  '/proxy': addProxy(gateway), // datai iframe 同源限制
  '/easydata': addProxy(gateway), // easydata接口
  '/cimcity/**': addProxy(CIM), // 外部场景组件使用
  '/managementdist/**': addProxy(CIM), // 外部场景组件使用
  '/indicator/**': addProxy(INDICATOR, true, { '^/indicator': '' }), // 指标接口
};

Object.keys(proxySettings).forEach((key) => {
  const setting = proxySettings[key];
  const originalBypass = setting.bypass;
  setting.bypass = function (req, res, proxyOptions) {
    if (gisAuthBypass(req, res)) return false;
    if (typeof originalBypass === 'function') return originalBypass(req, res, proxyOptions);
    return undefined;
  };
});

module.exports = proxySettings;
