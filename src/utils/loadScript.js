/**
 * 更新时间:
 * vr3d：2023/5/18
 */
import VersionConfig from '@/versionConfig';
import { cloneDeep } from 'lodash';

import $ from 'jquery';
import { getImageUrl } from './utils';
import DataI from './global-api';

const loadCustomJSList = [];

const addVersion = (url) => {
  return `${url}?version=${VersionConfig.screenVersion}`;
};

export const getVersionInfo = () => {
  const versionInfo = `大屏:${VersionConfig.screenVersion} - 大屏sdk:${VersionConfig.sdkVersion} - 发版日期:${VersionConfig.releaseDate}`;
  return versionInfo;
};

export const getScreenSDKVersion = () => {
  const { sdkVersion } = VersionConfig;
  return sdkVersion;
};

class DynamicLoadSource {
  constructor() {
    // 单例
    if (DynamicLoadSource.instance instanceof DynamicLoadSource) {
      return DynamicLoadSource.instance;
    }
    DynamicLoadSource.instance = this;
    this.loadRecord = {}; // 记录每一个动态加载文件的promise，后续如果重复加载该文件时根据已经加载过这个文件的promise状态决定如何resolve
    return this;
  }

  // 获取promise状态
  promiseState = (promise) => {
    const target = {};
    return Promise.race([promise, target]).then(
      (value) => (value === target ? 'pending' : 'fulfilled'),
      () => 'rejected',
    );
  };

  // 重复加载文件时获取之前加载该文件的promise状态，fulfilled时才进行resolve
  loadWithPromiseState = async (path, resolve) => {
    const state = await this.promiseState(this.loadRecord[path]);
    if (state === 'fulfilled') {
      resolve();
    } else {
      const timer = setInterval(() => {
        this.promiseState(this.loadRecord[path])
          .then((statePrm) => {
            if (statePrm === 'fulfilled') {
              resolve();
              clearInterval(timer);
            }
          })
          .catch((error) => console.error(error));
      }, 100);
    }
  };

  // 动态加载js文件
  loadJS = (jsPath) => {
    const originPath = jsPath;
    if (jsPath.includes('libs')) {
      jsPath = `${window.publicPath}${jsPath}`;
    }
    const scripts = document.querySelectorAll('script');
    const srcArr = [...scripts].map((item) => item.src);
    const js = srcArr.find((src) => src.includes(originPath));
    let p = Promise.resolve();
    // 布局设计器多SDK，按顺序加载，支持判断重复加载
    if (!js) {
      p = new Promise((resolve, reject) => {
        const jsDOM = document.createElement('script');
        if (jsPath.includes('libs/gis/yunli-map-5.7.0.js')) {
          jsDOM.dataset.map = 'true'; // 查找GIS引擎
          jsDOM.dataset['gis-2d'] = 'true'; // 查找私有化部署地址
        } else if (jsPath.includes('libs/gis/yunli-map-vr3d-24.4.12.js')) {
          jsDOM.dataset.map = 'true'; // 查找GIS引擎
          jsDOM.dataset['gis-3d'] = 'true'; // 查找私有化部署地址
        } else if (jsPath.includes('libs/gis/yunli-map-gl-24.6.3.js')) {
          jsDOM.dataset.map = 'true'; // 查找GIS引擎
        }
        // gis 资源中的请求路径改为相对路径
        if (jsPath.includes('libs/gis/yunli-map')) {
          let host = '..';
          if (window.fromSdk === 'layout') {
            // 布局设计器中的路径更深，需要计算相对路径
            let { pathname } = window.location;
            pathname = pathname.slice(Math.max(0, pathname.indexOf('visual-app')));
            const depth = pathname.split('/').length;
            let path = '../'.repeat(depth - 1);
            path = path.slice(0, Math.max(0, path.length - 1));
            host = path;
          }
          jsDOM.setAttribute('host', host);
        }
        if (jsPath.includes('/gis/static/js/cesium/Cesium.js')) {
          jsDOM.setAttribute('host', '..');
        }
        // 超图文件不能加版本号
        if (jsPath.includes('libs/iClient2020/Build/Cesium')) {
          jsDOM.setAttribute('src', jsPath);
        } else {
          jsDOM.setAttribute('src', addVersion(jsPath));
        }

        document.body.append(jsDOM);
        jsDOM.addEventListener('load', () => {
          resolve();
        });
      });
      this.loadRecord[jsPath] = p;
    } else {
      // script标签已经存在的情况下判断加载该文件的promise状态决定是否返回执行后续操作
      p = new Promise((resolve) => {
        this.loadWithPromiseState(jsPath, resolve);
      });
    }
    return p;
  };

  // 动态加载css文件
  loadCss = (cssPath) => {
    const originPath = cssPath;
    if (cssPath.includes('libs')) {
      cssPath = `${window.publicPath}${cssPath}`;
      // cssPath = 'http://10.35.60.131:9000' + cssPath; // 临时针对沈阳应急
      // if (window.publicPath === '/') {
      //   cssPath = '/visual-console' + cssPath;
      // }
      // cssPath = 'http://172.26.30.156:33457' + cssPath; // 开发环境
    }
    const links = document.querySelectorAll('link');
    const hrefArr = [...links].map((item) => item.href);
    const css = hrefArr.find((href) => href.includes(originPath));
    let p = Promise.resolve();
    if (!css) {
      p = new Promise((resolve, reject) => {
        const cssDOM = document.createElement('link');
        cssDOM.setAttribute('rel', 'stylesheet');
        cssDOM.setAttribute('href', addVersion(cssPath));
        document.body.append(cssDOM);
        cssDOM.addEventListener('load', () => {
          resolve();
        });
      });
      this.loadRecord[cssPath] = p;
    } else {
      p = new Promise((resolve, reject) => {
        this.loadWithPromiseState(cssPath, resolve);
      });
    }
    return p;
  };
}

const dynamicInstance = new DynamicLoadSource();

export const { loadCss } = dynamicInstance;
export const { loadJS } = dynamicInstance;

export const dynamicLoadCustomComp = (url) => {
  return new Promise((resolve, reject) => {
    if (loadCustomJSList.includes(url)) {
      resolve('loading');
      return;
    }
    loadCustomJSList.push(url);

    fetch(url)
      .then((res) => {
        console.log(res);
        if (res.status !== 200) {
          return Promise.reject(`${res.url} ${res.statusText}`);
        }
        return res.text();
      })
      .then((data) => {
        // 替换桶名
        data = data
          ?.replaceAll('/${bucketName}/', `/${window.screenConfig.bucketName}/`)
          ?.replaceAll('/$[bucketName]/', `/${window.screenConfig.bucketName}/`);
        resolve(data);
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
};

// 预览动态加载视频播放器依赖资源
export const dynamicLoadVideoSource = (comList, isload) => {
  let p = Promise.resolve(); // 视频资源需要按照顺序加载
  p = loadCss('libs/videojs/videojs.css')
    .then(() => loadCss('libs/videojs/yunli-vjs-skin.css'))
    .then(() => loadJS('libs/videojs/video.min.js'))
    .then(() => loadJS('libs/videojs/flv.min.js'))
    .then(() => loadJS('libs/videojs/videojs-flvjs.min.js'))
    .then(() => loadJS('libs/videojs/videojs-flash.min.js'))
    .then(() => loadJS('libs/videojs/yl-vjs-player-sdk.js'));
  return p;
};

export const loadVideoJS = () => {
  let p = Promise.resolve();
  p = loadCss('libs/videojs/videojs.css').then(() => loadJS('libs/videojs/video.min.js'));
  return p;
};

export const hasCompByType = (comList, type) => {
  let hasComp = false;
  const types = new Set([type]);
  const loop = (list) => {
    for (const com of list) {
      if (types.has(com.type)) {
        hasComp = true;
        break;
      } else if (com.classType === 'group') {
        loop(com.childComList || []);
      } else if (com.type === 'DynamicPanel' || com.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        com.children.forEach((child) => {
          loop(child.AntdChildComponents || []);
        });
      }
    }
  };
  loop(comList);
  return hasComp;
};

export const dynamicLoadPlugins = (comList, isload) => {
  let p1 = Promise.resolve();
  let p2 = Promise.resolve();
  let p3 = Promise.resolve();
  let p4 = Promise.resolve();
  const p5 = Promise.resolve();
  let p6 = Promise.resolve();
  let p7 = Promise.resolve();
  let p8 = Promise.resolve();
  let p9 = Promise.resolve();

  if (isload || hasCompByType(comList, '@yl/datai-com-text-wordcloud')) {
    p1 = loadJS('libs/echarts/echarts-wordcloud@2.js'); // 词云
  }

  if (isload || hasCompByType(comList, '@yl/datai-com-dynamic-wordcloud')) {
    p2 = loadJS('libs/jquery/jquery.tagcanvas.min.js'); // 动态词云
  }

  if (isload || hasCompByType(comList, '@yl/datai-com-chart-waterPol')) {
    p3 = loadJS('libs/echarts/echarts-liquidfill@3.js'); // 水球图
  }

  // 时间选择器
  if (isload || hasCompByType(comList, '@yl/datai-com-time-picker')) {
    // p4 = loadCss('libs/datepicker/datepicker.css');
    // p7 = loadCss('libs/timepickerSkin/timepickerSkin.css');
    // p8 = loadJS('libs/datepicker/datepicker.js');
    // p9 = loadJS('libs/datepicker/datepicker.en.js');
    p4 = loadCss('libs/datepicker/datepicker.css')
      .then(() => loadCss('libs/timepickerSkin/timepickerSkin.css'))
      .then(() => loadJS('libs/datepicker/datepicker.js'))
      .then(() => loadJS('libs/datepicker/datepicker.en.js'));
  }
  // ant-icon是为了自定义组件使用才需要在头部导入，动态加载可以判断是否需要使用自定义组件决定是否导入
  // if ((isload || hasCompByType(comList, 'customComp')) && !window.icons) {
  //   p5 = loadJS('libs/react/ant-icon.js');
  // }

  if (isload || hasCompByType(comList, 'PanoramaMap')) {
    p6 = loadJS('libs/gis/yunli-map-panorama.js'); // 全景图
  }

  if (isload || hasCompByType(comList, 'JessiucaPlayer')) {
    p7 = loadJS('libs/jessibuca/jessibuca-pro-demo.js'); // 视频流
  }
  //
  if (isload || hasCompByType(comList, '@yl/datai-com-media-mp4-player')) {
    p8 = loadVideoJS(); // 视频流
  }
  if (isload || hasCompByType(comList, 'UniversalPlayer')) {
    p9 = dynamicLoadVideoSource(); // 视频流
  }
  return Promise.all([p1, p2, p3, p4, p5, p6, p7, p8, p9]);
};

export const loadEchartsGL = () => {
  let p1 = Promise.resolve();
  p1 = loadJS('libs/echarts/echarts-gl@2.0.9.min.js');
  return p1;
};

// 预览动态加载GIS资源
export const dynamicLoadGIS = (comList) => {
  let p1 = Promise.resolve();
  let p2 = Promise.resolve();
  let p3 = Promise.resolve();
  let p4 = Promise.resolve();
  let p5 = Promise.resolve();
  let p6 = Promise.resolve();
  const p7 = Promise.resolve();
  let p8 = Promise.resolve();
  if (hasCompByType(comList, '@yl/datai-com-map-foundationPlan') || hasCompByType(comList, 'PanoramaMap')) {
    p1 = loadCss('/gis/static/css/yunli-map.css');
    p4 = loadJS('libs/gis/yunli-map-5.7.0.js');
  }
  if (hasCompByType(comList, '@yl/datai-com-map-3D-FoundationPlan')) {
    p2 = loadCss('/gis/static/js/cesium/Widgets/widgets.css');

    p5 = loadCss('/gis/static/css/yunli-map-3d.css');

    let cesiumJs = '/gis/static/js/cesium/Cesium.js';
    if (comList.find((item) => item.name === '三维地图(超图)')) {
      cesiumJs = 'libs/iClient2020/Build/Cesium/Cesium.js'; // 超图的JS资源保存在本地
    }

    p6 = loadJS(cesiumJs)
      .then(() => loadJS('libs/gis/yunli-map-vr3d-24.4.12.js'))
      .then(() => loadJS('libs/cim/yunli-cim-sdk-1.10.0.js'));
  }
  if (hasCompByType(comList, '@yl/datai-com-map-gl-FoundationPlan')) {
    p3 = loadCss('/gis/static/css/yunli-map-gl.css');
    p8 = loadJS('libs/gis/yunli-map-gl-24.6.3.js');
  }
  return Promise.all([p1, p2, p3, p4, p5, p6, p7, p8]);
};

export const dynamicLoadGISCom = (comList) => {
  let p1 = Promise.resolve();
  let p2 = Promise.resolve();
  let p3 = Promise.resolve();

  if (hasCompByType(comList, '@yl/datai-com-map-foundationPlan') || hasCompByType(comList, 'PanoramaMap')) {
    p1 = loadJS('libs/datai/previewRender/2DMap.js');
  }
  if (hasCompByType(comList, '@yl/datai-com-map-3D-FoundationPlan')) {
    p2 = loadJS('libs/datai/previewRender/3DMap.js');
  }
  if (hasCompByType(comList, '@yl/datai-com-map-gl-FoundationPlan')) {
    p3 = loadJS('libs/datai/previewRender/GLMap.js');
  }
  return Promise.all([p1, p2, p3]);
};

// 预览动态加载datai组件库
export const dynamicLoadDataiComponents = () => {
  return loadJS('libs/datai/datai-core.js').then(() => loadJS('libs/datai/comp.js'));
};

const fontListObj = {
  siyuan: {
    fontFamily: 'siyuan',
    fontUrl: 'NotoSansCJK-Bold-common.ttf',
    label: '',
  },
  // siyuanregular: {
  //   fontFamily: 'siyuanregular',
  //   fontUrl: 'SourceHanSansCN-Regular.otf',
  //   label: '',
  // },
  // siyuanmedium: {
  //   fontFamily: 'siyuanmedium',
  //   fontUrl: 'SourceHanSansCN-Medium.otf',
  //   label: '',
  // },
  alibaba: {
    fontFamily: 'alibaba',
    fontUrl: 'alibaba.ttf',
    label: '',
  },
  huxiaobo: {
    fontFamily: 'huxiaobo',
    fontUrl: 'huxiaobo.ttf',
    label: '',
  },
  yousebiaozhunhei: {
    fontFamily: 'yousebiaozhunhei',
    fontUrl: 'yousebiaozhunhei.ttf',
    label: '',
  },
  alibabapushiti: {
    fontFamily: 'alibabapushiti',
    fontUrl: 'AlibabaPuHuiTi-H.ttf',
    label: '',
  },
  digital: {
    fontFamily: 'digital',
    fontUrl: 'digital-7.ttf',
    label: '',
  },
  zaozigongfang: {
    fontFamily: 'zaozigongfang',
    fontUrl: 'zaozigongfang.ttf',
    label: '',
  },
  din: {
    fontFamily: 'din',
    fontUrl: 'DINAlternateBold.ttf',
    label: '',
  },
  pangmenzhengdao: {
    fontFamily: 'pangmenzhengdao',
    fontUrl: 'pangmenzhengdao.ttf',
    label: '',
  },
};

export const loadFonts = async (fontFamily, fontUrl) => {
  const font = new FontFace(fontFamily, `url(${fontUrl})`, {
    display: 'swap',
  });

  font.load().then(function (loadFace) {
    document.fonts.add(loadFace);
  });
};

// 动态加载字体
export const dynamicLoadFont = (comList, fonts = []) => {
  const fontListArr = [];
  // 布局设计器更新,comList中可能包含已经初始化的组件
  comList = comList.filter((comp) => {
    return !comp.hasOwnProperty('instance');
  });
  comList = destroyInstanceForJson(cloneDeep(comList));
  const comListStr = JSON.stringify(comList);
  Object.keys(fontListObj).forEach((fonttype) => {
    const matchKey = `"fontFamily":"${fonttype}"`;
    // let matchKey = fonttype;
    if (comListStr.includes(matchKey)) {
      fontListArr.push(fontListObj[fonttype]);
    }
  });
  fontListArr.push(...fonts);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      fontListArr.forEach((fontItem) => {
        if (fontItem.hasOwnProperty('name')) {
          loadFonts(fontItem.name, getImageUrl(fontItem.url));
        } else {
          const preFontUrl = `${window.publicPath}libs/font/subset/${fontItem.fontUrl}`;
          loadFonts(fontItem.fontFamily, addVersion(preFontUrl));
        }
      });
      resolve();
    }, 0);
  }).catch((error) => console.error(error));
};

export const insertFontStyleSheet = () => {
  // console.log('insertFontStyleSheet**********', window.publicPath);
  if ($('[datai-custom-font="true"]')?.length > 0) {
    return;
  }
  // v8.8编辑态统一加载预览态资源
  const preFontUrl = `${window.publicPath}libs/font/subset/`;
  let fontStr = '';
  Object.values(fontListObj).forEach((fonttype) => {
    fontStr += `@font-face {
      font-family: ${fonttype.fontFamily};
      src: url('${preFontUrl}${fonttype.fontUrl}');
      font-display:swap;
      }\n`;
  });

  const styleEle = document.createElement('style');
  styleEle.setAttribute('type', 'text/css');
  styleEle.setAttribute('datai-custom-font', true);
  styleEle.append(document.createTextNode(fontStr));
  const head = document.querySelectorAll('head')[0];
  head.append(styleEle);
};

function destroyInstanceForJson(componentList) {
  function destroyDeep(list) {
    list?.forEach((item, key) => {
      if (item.instance) {
        item._attr = item.instance.compAttr;
        item._data = item.instance._data;
        item._shape = item.instance.shapeCss;
        item._config = item.instance.config;
        item._visible = item.instance.visible;

        delete item.instance;
        delete item.idx;
        delete item.initCom;
        delete item.CssPage;
      }

      if (item.layers) {
        item.layers.forEach((child, index) => {
          if (child.instance) {
            child._attr = child.instance.compAttr;
            child._data = child.instance._data;
            child._shape = child.instance.shapeCss;
            child._config = child.instance.config;
            child._visible = child.instance.visible;
          }
          delete child.instance;
          delete child.initCom;
          delete child.CssPage;
        });
      }

      if (item.children) {
        item.children = item.children.map((child) => {
          const currentChild = child;
          const currentAntdChildComponents = currentChild.AntdChildComponents.map((AntdChild) => {
            if (AntdChild.instance) {
              AntdChild._attr = AntdChild.instance.compAttr;
              AntdChild._data = AntdChild.instance._data;
              AntdChild._shape = AntdChild.instance.shapeCss;
              AntdChild._config = AntdChild.instance.config;
              delete AntdChild.instance;
              delete AntdChild.initCom;
              delete AntdChild.CssPage;
            }
            if (AntdChild?.childComList) {
              destroyDeep(AntdChild.childComList);
            }
            return AntdChild;
          });
          currentChild.AntdChildComponents = currentAntdChildComponents;
          return currentChild;
        });
      }

      if (item.classType === 'group' || item?.childComList) {
        destroyDeep(item.childComList);
      }
    });
  }

  destroyDeep(componentList);

  return componentList;
}

/**
 * 配置页面资源动态加载
 * datai 组件库拆分加载
 * 注意: 地图中需要先加载gis再加载组件库
 */

// 加载datai基础组件
export const dynamicLoadBasic = () => {
  if (window.TextBasic) return Promise.resolve();
  return loadJS('libs/datai/configRender/basicText.js');
};

// 加载报表组件库
export const dynamicLoadChart = () => {
  if (window.ChartLineBasic) return Promise.resolve();
  return loadJS('libs/datai/configRender/chart.js');
};
// 加载2d地图组件库
export const dynamicLoad2D = (comList, isload) => {
  if (window.MapFoundationPlan) return Promise.resolve();
  let p1 = Promise.resolve();
  let p2 = Promise.resolve();
  if (isload || hasCompByType(comList, '@yl/datai-com-map-foundationPlan') || hasCompByType(comList, 'PanoramaMap')) {
    p1 = loadCss('libs/gis/yunli-map.css');
    p2 = new Promise((resolve) => {
      const yunliMapJs = `${window.publicPath}` + 'libs/gis/yunli-map-5.7.0.js';
      const jsDOM = document.createElement('script');
      jsDOM.dataset.map = 'true'; // 查找GIS引擎
      jsDOM.dataset['gis-2d'] = 'true'; // 查找私有化部署地址
      jsDOM.setAttribute('src', addVersion(yunliMapJs));
      document.body.append(jsDOM);
      jsDOM.addEventListener('load', () => {
        loadJS('libs/datai/configRender/2DMap.js').then(() => resolve());
      });
    });
    return Promise.all([p1, p2]);
  }
};

// 加载3d地图组件库
export const dynamicLoad3D = (comList, isload) => {
  if (window.Map3DFoundationPlan) return Promise.resolve();
  let p1 = Promise.resolve();
  let p2 = Promise.resolve();
  let p3 = Promise.resolve();
  if (isload || hasCompByType(comList, '@yl/datai-com-map-3D-FoundationPlan')) {
    p1 = loadCss('libs/gis/widgets.css');
    p2 = loadCss('libs/gis/yunli-map-3d.css');
    p3 = new Promise((resolve) => {
      /**
       *  cesium-js
       * */
      let cesiumJs = 'libs/gis/cesium/Cesium.js';
      if (comList.find((item) => item.name === '三维地图(超图)')) {
        cesiumJs = `${window.publicPath}libs/iClient2020/Build/Cesium/Cesium.js`; // 超图的JS资源保存在本地
      }
      const jsDOM = document.createElement('script');
      jsDOM.setAttribute('src', cesiumJs);
      document.body.append(jsDOM);
      jsDOM.addEventListener('load', () => {
        /**
         *  yunli-map-3d-js
         * */
        const yunliMap3dJs = `${window.publicPath}` + 'libs/gis/yunli-map-vr3d-24.4.12.js';
        const jsDOM = document.createElement('script');
        jsDOM.dataset.map = 'true'; // 查找GIS引擎
        jsDOM.dataset['gis-3d'] = 'true'; // 查找私有化部署地址
        jsDOM.setAttribute('src', addVersion(yunliMap3dJs));
        document.body.append(jsDOM);
        jsDOM.addEventListener('load', () => {
          window.whitelistpass = true;
          loadJS('libs/cim/yunli-cim-sdk-1.10.0.js')
            .then(() => loadJS('libs/datai/configRender/3DMap.js'))
            .then(() => resolve());
        });
      });
    });
    return Promise.all([p1, p2, p3]);
  }
};

// 加载gl地图组件库
export const dynamicLoadGL = (comList, isload) => {
  if (window.MapGlFoundationPlan) return Promise.resolve();
  let p1 = Promise.resolve();
  let p2 = Promise.resolve();
  if (isload || hasCompByType(comList, '@yl/datai-com-map-gl-FoundationPlan')) {
    p1 = loadCss('libs/gis/yunli-map-gl.css');
    p2 = new Promise((resolve) => {
      /**
       *  map-js 5.7.0
       * */
      const yunliMapJs = `${window.publicPath}` + 'libs/gis/yunli-map-gl-24.6.3.js';
      const jsDOM = document.createElement('script');
      jsDOM.dataset.map = 'true'; // 查找GIS引擎
      jsDOM.setAttribute('src', addVersion(yunliMapJs));
      document.body.append(jsDOM);
      jsDOM.addEventListener('load', () => loadJS('libs/datai/configRender/GLMap.js').then(() => resolve()));
    });
    return Promise.all([p1, p2]);
  }
};

export const dynamicLoadDataIComponents = async (comList) => {
  await dynamicLoadDataICore();
  let p1 = Promise.resolve();
  let p2 = Promise.resolve();
  let p3 = Promise.resolve();
  let p4 = Promise.resolve();
  let p5 = Promise.resolve();

  // 新建大屏无组件，不加载任何内容
  if (comList.length > 0) {
    p1 = dynamicLoadBasic();
    p2 = dynamicLoadChart();
    p3 = dynamicLoad2D(comList);
    p4 = dynamicLoad3D(comList);
    p5 = dynamicLoadGL(comList);
  }

  return Promise.all([p1, p2, p3, p4, p5]);
};

export const dynamicLoadDataICore = () => {
  let p = Promise.resolve();
  if (window.BaseComp === undefined) {
    p = loadJS('libs/datai/datai-core.js');
  }
  return p;
};

export function parseCustomCompCode(releaseUrl) {
  let customCode = releaseUrl
    .split('/')
    .filter((v) => v.startsWith('Comp_'))
    .map((v) => v.replace('.js', ''))[0];
  if (!customCode) {
    return customCode;
  }
  const matchArr = customCode?.split('_');
  const arrLen = matchArr?.length;
  // v7.4 防止window.screenConfig覆盖
  const { tenantId } = window.screenConfig;
  if (arrLen === 2 || (tenantId !== 'default' && customCode?.endsWith(tenantId))) {
    return customCode;
  }
  const endPos = matchArr[arrLen - 2] === 'ns' ? arrLen - 2 : arrLen;
  customCode = matchArr.slice(0, endPos).join('_');
  return customCode;
}

// 加载通用资源
export const dynamicLoadCommon = () => {
  let p1 = Promise.resolve();
  let p2 = Promise.resolve();
  let p3 = Promise.resolve();
  let p4 = Promise.resolve();
  let p5 = Promise.resolve();
  // let p6 = Promise.resolve();
  p1 = loadJS('libs/jquery/jquery.min.js');
  p2 = loadJS('libs/moment.js');
  p3 = loadJS('libs/dayjs.min.js').then(() => loadJS('libs/antd/antd.min.js'));
  p4 = loadJS('libs/echarts/echarts@5.5.0.min.js');
  p5 = loadJS('libs/lodash.min.js');
  // p5 = loadJS('libs/antd/antd.min.js');
  // p6 = loadJS('libs/lodash.min.js');
  return Promise.all([p1, p2, p3, p4, p5]);
};

// v8.11.0 加载预加载资源
export const dynamicLoadPreSource = (urls) => {
  if (urls.length >= 0) {
    const task = [];
    for (let index = 0; index < urls.length; index++) {
      let p = Promise.resolve();
      const url = urls[index];
      p = loadJS(url);
      task.push(p);
    }
    return Promise.all(task);
  }
};

// 自定义组件依赖资源
export const dynamicLoadCustomCompSource = () => {
  let p1 = Promise.resolve();
  // let p2 = Promise.resolve();

  p1 = loadJS('libs/antd/ant-icon.js');
  // p2 = loadCss('libs/css/antd.min.css');

  return Promise.all([p1]);
};

// 加载移动端组件库
export const dynamicLoadMobileLibrary = () => {
  if (DataI.isConfigPage())
    return loadJS('libs/datai/datai-core.js').then(() => loadJS('libs/datai/configRender/mobile.js'));
  return loadJS('libs/datai/datai-core.js').then(() => loadJS('libs/datai/previewRender/mobile.js'));
};
