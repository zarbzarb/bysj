import ShortUuid from 'short-uuid';
import _ from 'lodash';
import { listenSubLayerVariable } from './componentUtils';

export const stringInfinity = (obj) => {
  for (const key in obj) {
    if (obj[key] === Number.POSITIVE_INFINITY) {
      obj[key] = 'Infinity';
    }
  }
  return obj;
};
export const parseInfinity = (obj) => {
  for (const key in obj) {
    if (obj[key] === 'Infinity') {
      obj[key] = Number.POSITIVE_INFINITY;
    }
  }
  return obj;
};
export const getToken = () => {
  let arr;
  const reg = /(^| )token=([^;]*)(;|$)/;
  // eslint-disable-next-line no-cond-assign
  const token = (arr = document.cookie.match(reg)) ? unescape(arr[2]) : null;
  return token;
};

export const getUrlAllParams = () => {
  // 解决乱码问题
  const url = decodeURI(window.location.href);
  const res = {};
  const urlData = _.split(url, '?').length > 1 ? _.split(url, '?')[1] : null;
  if (!urlData) return null;
  const params = _.split(urlData, '&');
  _.forEach(params, function (item) {
    const key = _.split(item, '=')[0];
    const value = _.split(item, '=')[1];
    res[key] = value;
  });
  return res;
};

export const transformTranslate = (value) => {
  const translate = value
    .replace('translate', '')
    .replace('(', '')
    .replace(')', '')
    .replace(/px/gi, '')
    .replace(/ /gi, '')
    .split(',')
    .map((vl) => Number.parseInt(vl));
  return translate;
};

export const transformCss = (config, type) => {
  let obj = {};
  config = _.cloneDeep(config);
  Object.keys(config).forEach((vl) => {
    let attr = config[vl];
    if (typeof attr === 'object') {
      if (vl === 'borderRadius') {
        const borderKeys = Object.keys(attr);
        attr.borderRadius += 'px';
        borderKeys.forEach((childKey) => {
          if (childKey === 'borderRadius') {
          } else if (attr[childKey]) {
            delete attr[childKey];
            obj[childKey] = `${attr.borderRadius}`;
          } else {
            attr[childKey] = '0px';
          }
        });
      }

      if (vl === 'border') {
        const borderKeys = Object.keys(attr);
        attr.borderWidth += 'px';
        borderKeys.forEach((childKey) => {
          if (childKey === 'borderWidth') {
          } else if (attr[childKey] === true) {
            delete attr[childKey];
            obj[childKey] = `${attr.borderWidth} ${attr.borderStyle} ${attr.borderColor}`;
          } else if (attr[childKey] === false) {
            delete attr[childKey];
            attr[childKey + 'Width'] = '0px';
          }
        });
      }

      if (vl === 'margin') {
        const marginKeys = Object.keys(attr);
        marginKeys.forEach((childKey) => {
          attr[childKey] = `${attr[childKey]}px`;
        });
      }
      if (vl === 'padding') {
        const paddingKeys = Object.keys(attr);
        paddingKeys.forEach((childKey) => {
          attr[childKey] = `${attr[childKey]}px`;
        });
      }

      obj = { ...obj, ...attr };
    } else {
      if (vl === 'opacity') {
        attr /= 100;
      }
      obj[vl] = attr;
    }
  });

  /**
   * 后续删除
   */
  obj.minWidth = obj.width;
  obj.minHeight = obj.height;

  if (type === 'pureRender') {
    obj.maxWidth = obj.width;
    obj.maxHeight = obj.height;
  }

  obj.boxSizing = 'border-box';

  delete obj.borderWidth; // 删除 borderWidth、borderRadius是为了防止覆盖四边的样式
  delete obj.borderRadius;

  return obj;
};

export const createKey = () => {
  return ShortUuid.generate();
};

const isType = (type) => {
  return function (obj) {
    return Object.prototype.toString.call(obj) === `[object ${type}]`;
  };
};

export const isPlainObject = isType('Object');

export const isBoolean = isType('Boolean');

export const isUndefined = isType('Undefined');

export const isFunction = isType('Function');

export const strToJson = (str, def = {}) => {
  let result = def;
  try {
    result = JSON.parse(str);
  } catch {
    result = {};
    console.warn('JSON格式错误');
  }
  return result;
};

export const isEmpty = (str) => {
  return str === null || str === '' || str === undefined;
};

let pid = 0;

export const getRandomKey = (prefix = '__') => `${prefix}$${Math.random().toString(16).slice(2)}${pid++}`;

export const dynamicLoadMapLayer = (opts = {}) => {
  const { layer, baseMap, gisEventType = false } = opts;
  if (!layer?.instance) {
    const { iocStorageUrl } = window;
    const index = window[layer.englishName];
    if (!index) {
      setTimeout(() => {
        dynamicLoadMapLayer(opts);
      }, 500);
      return;
    }
    layer.initCom = index;
    layer.CssPage = undefined;
    if (!baseMap._loadCheckTimes) {
      baseMap._loadCheckTimes = 0;
    }
    if (baseMap?.createFlag !== false && !baseMap.instance && baseMap._loadCheckTimes < 50) {
      setTimeout(() => {
        dynamicLoadMapLayer(opts);
      }, 500);
      baseMap._loadCheckTimes += 1;
      return;
    }
    if (!baseMap.instance) {
      console.info('地图加载过慢');
      return;
    }
    const map = baseMap.instance._map;
    if (!Array.isArray(layer._config._data)) {
      try {
        layer._config._data = JSON.parse(layer._config._data);
        layer._config._initData = JSON.parse(layer._config._initData);
      } catch {
        layer._config._data = [];
        layer._config._initData = [];
      }
    }
    // eslint-disable-next-line new-cap
    if (gisEventType) {
      layer._attr.visible = false;
    }
    layer.instance = new layer.initCom(undefined, layer._config, layer._attr, map, iocStorageUrl);
    layer.createFlag = true;
    layer.showFlag = true;
    if (layer._visible !== undefined) {
      layer.instance.visible = layer._visible;
    }
    if (gisEventType) {
      layer.showFlag = false;
      return;
    }
    const preLayerIndex = baseMap.layers?.findIndex((item) => item.key === layer.key);
    preLayerIndex > -1 && baseMap.layers.splice(preLayerIndex, 1);
    baseMap.layers.push(layer);
    listenSubLayerVariable(layer);
  }
};

export const loadMapLayerRender = (opts = {}) => {
  const { layer, baseMap, gisEventType = false, layerCb } = opts;
  if (!layer?.instance) {
    const { iocStorageUrl } = window;
    const index = window[layer.englishName];
    if (!index) {
      setTimeout(() => {
        loadMapLayerRender(opts);
      }, 500);
      return;
    }
    layer.initCom = index;
    layer.CssPage = undefined;
    if (!baseMap._loadCheckTimes) {
      baseMap._loadCheckTimes = 0;
    }
    if (baseMap?.createFlag !== false && !baseMap.instance && baseMap._loadCheckTimes < 50) {
      setTimeout(() => {
        loadMapLayerRender(opts);
      }, 500);
      baseMap._loadCheckTimes += 1;
      return;
    }
    if (!baseMap.instance) {
      console.info('地图加载过慢');
      return;
    }
    const map = baseMap.instance._map;
    if (!Array.isArray(layer._config._data)) {
      try {
        layer._config._data = JSON.parse(layer._config._data);
        layer._config._initData = JSON.parse(layer._config._initData);
      } catch {
        layer._config._data = [];
        layer._config._initData = [];
      }
    }
    // eslint-disable-next-line new-cap
    if (gisEventType) {
      layer._attr.visible = false;
    }
    layer._attr.layerKey = layer.key;
    layer.instance = new layer.initCom(undefined, layer._config, layer._attr, map, iocStorageUrl);
    layer.createFlag = true;
    layer.showFlag = true;
    if (layer._visible !== undefined) {
      layer.instance.visible = layer._visible;
    }
    layerCb && layerCb(layer);
    if (gisEventType) {
      layer.showFlag = false;
      return;
    }
    const preLayerIndex = baseMap.layers?.findIndex((item) => item.key === layer.key);
    preLayerIndex > -1 && baseMap.layers.splice(preLayerIndex, 1);
    baseMap.layers.push(layer);
    listenSubLayerVariable(layer);
  }
};

export const getImageUrl = (path) => {
  let imgUrl = path;
  // 支持多级目录部署
  if (imgUrl && typeof imgUrl === 'string' && !!!/^(http|https):\/\//.test(imgUrl)) {
    if (imgUrl.includes('/assets')) {
      // 使用默认图片
      imgUrl = imgUrl.replace('./', '/'); // 兼容处理
      imgUrl = window.publicPath + imgUrl;
      imgUrl = imgUrl.replace('//', '/'); // 去重
    } else if (imgUrl.includes('/iocoss') || imgUrl.includes('/imageproxy')) {
      // 使用OSS图片或者走图片代理
      if (
        window.publicPath !== './' &&
        window.publicPath !== '/visual-console/' // 兼容SDK中使用
      ) {
        imgUrl = window.publicPath + imgUrl;
        imgUrl = imgUrl.replace('//', '/'); // 去重
      } else if (
        window.publicPath === './' ||
        window.publicPath === '/visual-console/' // 兼容SDK中使用
      ) {
        if (window.fromSdk === 'layout') {
          // 兼容布局设计器中使用
          imgUrl = window.publicPath === '/visual-console/' ? `/${imgUrl}` : window.publicPath + imgUrl;
        } else {
          imgUrl = `../${imgUrl}`;
        }
        imgUrl = imgUrl.replace('//', '/'); // 去重
      }
      if (imgUrl.includes('/imageproxy')) {
        // 走图片代理的都去掉桶名兼容阿里云OSS
        const pathReg = new RegExp('(/imageproxy/[^/]+/([^/]+/).*)((screen|card|layer|custom)/.+)', 'g');
        const matches = pathReg.exec(imgUrl);
        if (matches && matches.length > 0) {
          let prefix = matches[1];
          const bucketPath = matches[2];
          const p = matches[3]; // 不带桶的路径
          prefix = prefix.replace(bucketPath, '');
          imgUrl = prefix + p;
        }
      }

      // oss资源走单独的域名
      if (window.screenConfig.ossProxy) {
        imgUrl = imgUrl.replace(/.*\/iocoss/, window.screenConfig.ossProxy);
      }
    }
  }
  return imgUrl;
};

export const removeAllEventEmitterListeners = () => {
  // 全局事件不清除（global_）
  const EventEmitter = window.globalEventEmitter;
  // EventEmitter?.removeAllListeners();
  // eslint-disable-next-line no-prototype-builtins
  if (!EventEmitter?.hasOwnProperty('_events')) {
    return;
  }
  for (const key in EventEmitter._events) {
    if (key.startsWith('global_')) continue;
    EventEmitter.removeAllListeners(key);
  }
};

function removeComments(code) {
  const regex = /(^|[^:])\/\/.*|\/\*[\s\S]*?\*\//g;
  return code.replace(regex, (match, group1) => {
    // 保留以 `http://` 或 `https://` 开头的 URL，不处理这些注释
    if (group1 === ':') return match;
    return ''; // 删除正常的注释
  });
}

// 变量表达式
export const babelTransform = (expression = '', data) => {
  expression = removeComments(expression); //expression.replace(/(?<!:)\/\/.*\n|\/\*(\s|.)*?\*\/\n/g, ''); // REVIEW liuming 去掉注释
  if (!expression.includes('return')) {
    expression = `return ${expression}`; // 没带return的带上
  }
  // const body = `(function(data){${expression}}(data))`; // 全部转为立即执行函数
  try {
    // let { code } = BabelTransform(body, {
    //   presets: ['env']
    // });
    // code = code.replace('"use strict";\n\n', ''); // REVIEW liuming 需要特殊处理
    // const pos = code.indexOf('(function (data');
    // code = code.slice(0, pos) + 'return ' + code.slice(pos); // 支持...等特殊的扩展符
    // eslint-disable-next-line no-new-func
    const getFun = new Function(
      'data',
      `
      try {
        ${expression}
      } catch (error) {
        console.error(error, '函数错误error');
        return ((data) => data)(data);
      }
    `,
    );
    const value = getFun(data);
    return value;
  } catch (error) {
    console.error(error);
  }
};

// 变量设置和数据映射的执行语句
export const babelTransform2 = (fragment = '', data = [], expressionValue = []) => {
  fragment = removeComments(fragment);
  // fragment = fragment.replace(/(?<!:)\/\/.*\n|\/\*(\s|.)*?\*\/\n/g, ''); // REVIEW liuming 去掉注释
  // const body = `(function(data, expressionValue){${fragment}}(data, expressionValue))`; // 构造代码执行函数
  try {
    // let { code } = BabelTransform(body, {
    //   presets: ['env']
    // });
    // code = code.replace('"use strict";\n\n', ''); // REVIEW liuming 需要特殊处理
    // const pos = code.indexOf('(function (data');
    // code = code.slice(0, pos) + 'return ' + code.slice(pos); // 支持...等特殊的扩展符
    // eslint-disable-next-line no-new-func
    const getFun = new Function(
      'data',
      'expressionValue',
      `
      try {
        ${fragment}
      } catch (error) {
        console.error(error, '函数错误error');
        return ((data) => data)(data);
      }
    `,
    );
    const value = getFun(data, expressionValue);
    return value;
  } catch (error) {
    console.error(error);
  }
};

// 图表自定义配置的执行语句
export const babelTransform3 = (fragment = '') => {
  fragment = removeComments(fragment);
  // fragment = fragment.replace(/(?<!:)\/\/.*\n|\/\*(\s|.)*?\*\/\n/g, ''); // REVIEW liuming 去掉注释
  // const body = `(function(option, datas, dataset, chart){${fragment}}(option, datas, dataset, chart))`; // 构造代码执行函数
  try {
    // let { code } = BabelTransform(body, {
    //   presets: ['env']
    // });
    // code = code.replace('"use strict";\n\n', ''); // REVIEW liuming 需要特殊处理
    // const pos = code.indexOf('(function (option');
    // code = code.slice(0, pos) + 'return ' + code.slice(pos); // 支持...等特殊的扩展符
    // eslint-disable-next-line no-new-func
    const getFun = new Function(
      'option',
      'datas',
      'dataset',
      'chart',
      'dataSource',
      `
      try {
        ${fragment}
      } catch (error) {
        console.error(error, '函数错误error');
        return ((data) => data)(data);
      }
    `,
    );
    return getFun;
  } catch (error) {
    console.error(error);
  }
};

// 图表自定义配置函数，这个函数暂时用不到
export const babelTransform4 = (fragment = '') => {
  fragment = removeComments(fragment);
  // fragment = fragment.replace(/(?<!:)\/\/.*\n|\/\*(\s|.)*?\*\/\n/g, ''); // REVIEW liuming 去掉注释
  // const body = fragment;
  try {
    // let { code } = BabelTransform(body, {
    //   presets: ['env']
    // });
    // code = code.replace('"use strict";\n\n', ''); // REVIEW liuming 需要特殊处理
    // eslint-disable-next-line no-new-func
    const getFun = new Function(`return ${fragment}`);
    return getFun;
  } catch (error) {
    console.error(error);
  }
};

// 条件渲染变量表达式
export const babelTransform5 = (expression = '', defaultFunc = '') => {
  expression = removeComments(expression);
  // expression = expression.replace(/(?<!:)\/\/.*\n|\/\*(\s|.)*?\*\/\n/g, ''); // REVIEW liuming 去掉注释
  if (!expression.includes('return')) {
    expression = `return ${expression}`; // 没带return的带上
  }
  // const body = `(function(data){${expression}}(data))`; // 全部转为立即执行函数
  try {
    // let { code } = BabelTransform(body, {
    //   presets: ['env']
    // });
    // code = code.replace('"use strict";\n\n', ''); // REVIEW liuming 需要特殊处理
    // const pos = code.indexOf('(function (data');
    // code = code.slice(0, pos) + 'return ' + code.slice(pos); // 支持...等特殊的扩展符
    // eslint-disable-next-line no-new-func
    const getFun = new Function(
      'data',
      `
      try {
        let data = arguments[0];
        if(data===undefined) {
          data = 0;
        }
        ${expression}
      } catch (error) {
        console.error(error, '函数错误error');
        return (${defaultFunc})(data);
      }
    `,
    );
    return getFun;
  } catch (error) {
    console.error(error);
  }
};

// 预览接口请求的执行语句
export const babelTransform6 = (fragment = '', defaultFunc = '') => {
  fragment = removeComments(fragment);
  // fragment = fragment.replace(/(?<!:)\/\/.*\n|\/\*(\s|.)*?\*\/\n/g, ''); // REVIEW liuming 去掉注释
  // const body = `(function(data){${fragment}}(data))`; // 全部转为立即执行函数
  try {
    // let { code } = BabelTransform(body, {
    //   presets: ['env']
    // });
    // code = code.replace('"use strict";\n\n', ''); // REVIEW liuming 需要特殊处理
    // const pos = code.indexOf('(function (data');
    // code = code.slice(0, pos) + 'return ' + code.slice(pos); // 支持...等特殊的扩展符
    // eslint-disable-next-line no-new-func
    const getFun = new Function(
      'data',
      `
      try {
        ${fragment}
      } catch (error) {
        console.error(error, '函数错误error');
        return (${defaultFunc})(data);
      }

    `,
    );
    return getFun;
  } catch (error) {
    console.error(error);
  }
};

/**
 * 部分组件支持数组对象和字符串数据源格式，获取其值（例如文本、按钮、通用播放器、颜色选择器）
 * @param {*} val
 * @param {string} key
 * @returns
 */
export const getArrayOrStringValue = (val = '', key = 'text') => {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    return val.length > 0 ? val[0][key] : '';
  }
  return val;
};

/**
 * 部分组件支持对象和数组对象数据源格式，获取其值（例如指标文本）
 * @param {*} val
 * @param {string} key
 * @returns
 */
export const getArrayObject = (val = {}) => {
  if (Array.isArray(val)) {
    return val.length > 0 ? val[0] : {};
  }
  if (typeof val === 'object' && val !== null) {
    return val;
  }
  return val;
};
/**
 * 部分组件通过数据映射，获取其值（例如iframe）
 * @param {Array} _map
 * @param {Array} _data
 * @returns
 */
export const deepMap = (_map, _data) => {
  if (!Array.isArray(_map) || !Array.isArray(_data)) {
    return [];
  }
  const result = _data.map((item) => {
    const obj = {};
    _map.forEach((field) => {
      obj[field.field] = item[field.mapField];
    });

    return obj;
  });
  return result;
};

// 获取下拉面板父容器
export const getCustomPopupContainer = (opts = {}) => {
  const { triggerNode, screenConfigRef } = opts;
  // eslint-disable-next-line no-undef
  let container = $(triggerNode).parents('.datai-layersearch-wrapper');
  if (container?.length === 0) {
    // eslint-disable-next-line no-undef
    container = $(triggerNode).parents('.screen-wrap');
  }
  if (screenConfigRef?.current.type === 'card') {
    container = container.children('div');
  }
  container = container?.length > 0 ? container[0] : document.querySelector('.screen-wrap');
  return container;
};

// 获取下拉面板偏移
export const getDropdownTransform = (obj, flag) => {
  let matrixRet = [0, 0, 0, 0, 0, 0];
  // let parentContainer = $(obj)?.parents('.com-container');
  // eslint-disable-next-line no-undef
  let parentContainer = flag ? $(obj)?.parent() : $(obj)?.parents('.com-container');

  if (parentContainer?.length < 1) {
    // eslint-disable-next-line no-undef
    parentContainer = $(obj)?.parent();
  } else if (parentContainer?.length > 1) {
    // eslint-disable-next-line no-undef
    parentContainer = $(parentContainer[0]);
  }
  // console.log('parentContainer*****', parentContainer);
  if (parentContainer?.length < 1 || !parentContainer?.attr('data-key')) {
    return matrixRet;
  }
  const containerMatrixStr = parentContainer?.css('transform')?.replace('matrix(', '')?.replace(')', '');

  const containerMatrixArr = containerMatrixStr && String(containerMatrixStr).split(',');
  if (!Array.isArray(containerMatrixArr) && containerMatrixArr.length < 6) {
    return matrixRet;
  }
  const parentMatrixArr = getDropdownTransform(parentContainer, true);
  matrixRet = containerMatrixArr.map((item, index) => Number(item) + Number(parentMatrixArr[index] || 0));

  return matrixRet;
};

export const setObjectStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getObjectStorage = (key) => {
  return JSON.parse(localStorage.getItem(key));
};

/**
 * @param {[]*} data
 * @returns {[]*}
 */
export const flatChildrenForNode = (data) => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const f = (data, parentId = null, acc = []) => {
    if (!data) return data;

    const node = {};
    node.id = data.id;
    node.key = data.key;
    node.title = data.title;
    node.parent = parentId;

    acc.push(node);

    if (data.children && data.children.length > 0)
      return data.children.reduce((p, ch) => f(ch, data.key ?? data.id, p), acc);

    return acc;
  };

  return _.cloneDeep(data)
    .map((i) => f(i))
    .flat();
};

// 获取选中节点的父节点
export const getParentKey = (key, tree) => {
  let parentKey;
  for (const node of tree) {
    if (node.children) {
      if (
        node.children.some((item) => {
          return item.key === key;
        })
      ) {
        parentKey = node.key;
      } else if (getParentKey(key, node.children)) {
        parentKey = getParentKey(key, node.children);
      }
    }
  }
  return parentKey;
};

/**
 * @param {[]*} nodes
 * @returns {[]*}
 */
export const assembledNodeForTree = (nodes) => {
  // eslint-disable-next-line unicorn/no-object-as-default-parameter, @typescript-eslint/no-shadow
  const f = (nodes, parent = { id: null, children: [] }, i = 0) => {
    if (i === nodes.length) return parent;

    const n = nodes[i];

    if (!parent.children) parent.children = [];

    if (n.parent === parent.id) parent.children.push(f(nodes, n, i + 1));

    return f(nodes, parent, i + 1);
  };

  const addKeysAndSupportSelfNullForNodes = (n) => {
    n.key = n.key ?? n.id;

    if (n.id === n.parent || n.parent === undefined) n.parent = null;

    return n;
  };

  return f(_.cloneDeep(nodes.map((node) => addKeysAndSupportSelfNullForNodes(node)))).children;
};

export const compatibleDynamicData = (el, dynamicConfig, mockData) => {
  if (!el.dataset.category) {
    el.dataset.category = el.dataset.isVariable ? 'variableRef' : 'json';

    el.dataset.dynamic = { ...dynamicConfig };
  }

  if (!el.dataset.indicator) {
    el.dataset.indicator = { ...dynamicConfig }; // v7.11 新增，指标接口配置
  }
};

/**
 * 校验数据格式及字段
 * @param {*} sampleData 样例数据
 * @param {*} realData 真实数据
 * @returns
 */
export const handleVerifyData = (sampleData, realData) => {
  // console.log('handleVerifyData***1*', sampleData, realData);
  const ret = true;
  const type = typeof sampleData;
  if (type !== 'object') {
    // 基础数据类型
    // 是否不是对象（数组也是对象）
    // eslint-disable-next-line valid-typeof
    return typeof realData === type;
  }
  // 对象数据类型
  if (Array.isArray(sampleData)) {
    // 数组
    if (!Array.isArray(realData)) {
      return false;
    }
    if (realData.length > 0) {
      // 非空数组
      for (let i = 0, len = realData.length; i < len; i++) {
        const curRet = handleVerifyData(sampleData[0], realData[i]);
        if (!curRet) {
          return false;
        }
      }
    }
  } else {
    // 非数组对象 sampleData不考虑其他函数对象之类的
    const fieldKeys = Object.keys(sampleData);
    for (let i = 0, len = fieldKeys.length; i < len; i++) {
      const item = fieldKeys[i];
      // eslint-disable-next-line no-prototype-builtins
      if (!realData.hasOwnProperty(item)) {
        return false;
      }
      if (typeof realData[item] === 'object') {
        const curRet = handleVerifyData(sampleData[item], realData[item]);
        if (!curRet) {
          return false;
        }
      }
    }
  }

  return ret;
};

/**
 * 一维数组转树形结构
 * @param {*} idStr id字段
 * @param {*} pidStr pid字段
 * @param {*} childStr child字段
 * @param {*} mapField 映射字段
 * @returns
 */
export const transformDataToTree = (data, idStr, pidStr, childStr, mapField = {}) => {
  const result = [];
  const map = {};
  if (!Array.isArray(data)) {
    return result;
  }

  // eslint-disable-next-line no-prototype-builtins
  const checkFieldFlag = data.some((item) => !item.hasOwnProperty(idStr) || !item.hasOwnProperty(pidStr));
  if (checkFieldFlag) {
    return data;
  }
  // 清除之前的children
  data.forEach(function (item) {
    delete item[childStr];
  });
  // 将所有数据的id作为key键，添加到map对象中
  data.forEach(function (item) {
    map[item[idStr]] = item;
  });
  // 处理数据以及层级问题
  data.forEach(function (item) {
    const parent = map[item[pidStr]];
    if (parent) {
      // 添加parent
      if (!parent[childStr]) {
        parent[childStr] = [];
      }
      const mapKeys = Object.keys(mapField);
      mapKeys?.forEach((key) => {
        item[mapField[key]] = item[key];
      });
      parent[childStr].push(item);
    } else {
      result.push(item);
    }
  });
  return result;
};
/**
 * 计算两个数组差集
 * @param {*} arr1
 * @param {*} arr2
 * @returns
 */

export const findDifferentElements = (arr1, arr2) => {
  const diff = [];
  for (const element of arr1) {
    if (!arr2.includes(element)) {
      diff.push(element);
    }
  }
  for (const element of arr2) {
    if (!arr1.includes(element)) {
      diff.push(element);
    }
  }
  return diff;
};

// 检查是否选中文本
export const isTextSelected = () => {
  const selection = window.getSelection();
  return selection.toString().length > 0;
};

// 取消选中文本
export const clearSelection = () => {
  if (window.getSelection) {
    const selection = window.getSelection();
    if (selection.empty) {
      // Chrome
      selection.empty();
    } else if (selection.removeAllRanges) {
      // Firefox
      selection.removeAllRanges();
    }
  }
};

//判断数据是否满足规则
export const conditionFilterDataFun = (data, condition) => {
  const { rules = [] } = condition;
  //规则是且的关系，要求每一个规则都返回true
  //无规则时候返回false
  if (rules.length === 0) {
    return true;
  }
  return rules.every((rule) => {
    const { field, operator, value } = rule;
    // if (!field) {
    //   return true
    // }
    // 获取数据项的值,数据自动获取映射值
    let apiValue = data[field];
    // 获取单个规则返回值
    let res = false;
    switch (operator) {
      // value作为数字处理
      case '>':
        res = apiValue - value > 0;
        break;
      case '<':
        res = apiValue - value < 0;
        break;
      case '>=':
        res = apiValue - value >= 0;
        break;
      case '<=':
        res = apiValue - value <= 0;
        break;
      /** value考虑字符串和数字 */
      case '!=':
        res = apiValue != value;
        break;
      case '=':
        res = apiValue == value;
        break;
      case '包含':
        if (Array.isArray(apiValue)) {
          res = apiValue.findIndex(value) > -1 || apiValue.findIndex(Number(value)) > -1;
        } else {
          res = String(apiValue).includes(value);
        }
        break;
      case '不包含':
        if (Array.isArray(apiValue)) {
          res = apiValue.findIndex(value) == -1 && apiValue.findIndex(Number(value)) == -1;
        } else {
          res = !String(apiValue).includes(value);
        }
        break;
      default:
        break;
    }
    return res;
  });
};

// v8.2.1 新增缓存数据读取
export const readCacheFromSessionStorage = (key) => {
  const cacheData = sessionStorage.getItem(key);
  if (cacheData) {
    const data = JSON.parse(cacheData);
    if (data?.settings?.elKey) {
      data.settings.el = window.DataI.getComponentByKey(data.settings.elKey);
    }
    if (data?.settings?.itemKey) {
      data.settings.item = window.DataI.getComponentByKey(data.settings.itemKey);
    }
    return data;
  }
  // 缓存不存在或版本不匹配，返回空值或执行其他逻辑
  return null;
};

export const writeCacheToSessionStorage = (key, data) => {
  // 需要处理组件参数
  let item = data?.settings?.el;
  if (item && item.classType && item.key) {
    data.settings.elKey = data.settings.el?.key;
    delete data.settings.el;
  }
  item = data?.settings?.item;
  if (item && item.classType && item.key) {
    data.settings.itemKey = data.settings.item.key;
    delete data.settings.item;
  }
  const serializedData = JSON.stringify(data);
  sessionStorage.setItem(key, serializedData);
};

/**
 * 版本号比较大小
 * @param {*} version1
 * @param {*} version2
 * @returns version1 > version2 返回 1， 小于返回 -1， 相等返回  0
 */
export const compareVersion = (version1, version2) => {
  const v1 = version1.split('.');
  const v2 = version2.split('.');
  for (let i = 0; i < v1.length || i < v2.length; ++i) {
    let x = 0,
      y = 0;
    if (i < v1.length) {
      x = parseInt(v1[i]);
    }
    if (i < v2.length) {
      y = parseInt(v2[i]);
    }
    if (x > y) {
      return 1;
    }
    if (x < y) {
      return -1;
    }
  }
  return 0;
};

/**
 * 判断是否全屏
 * returns {boolean}
 */

export const isFullScreen = () => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const screenWidth = screen.width;
  const screenHeight = screen.height;
  let isFull = false;
  // 这里定义了一个阈值，用来判断窗口是否接近全屏
  // 这个阈值可以根据实际情况进行调整
  const threshold = 0.95; // 例如，当窗口尺寸至少达到屏幕尺寸的95%时，认为接近全屏

  // 计算窗口尺寸与屏幕尺寸的比例
  const widthRatio = windowWidth / screenWidth;
  const heightRatio = windowHeight / screenHeight;

  // 如果宽度和高度比例都大于或等于阈值，则认为窗口接近全屏
  if (widthRatio >= threshold && heightRatio >= threshold) {
    console.log('窗口接近全屏');
    isFull = true;
    // 在这里可以执行当窗口接近全屏时需要做的操作
  }
  return isFull;
};
