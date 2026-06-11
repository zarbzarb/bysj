import $ from 'jquery';
import { matrixToArr, formatPosition } from '@/utils/analysis';
import { toJS } from 'mobx';

const getComponent = window.DataI.getComponentByKey;

const resetRender = (com) => {
  // 普通页引用地图的子组件不需要渲染，重置 render 函数
  com.initCom.prototype._compType = com.compType; // 引用地图和其子组件都会加 compType = 'referenceMap'
  let render = com.initCom.prototype.render;
  com.initCom.prototype.render = function (...args) {
    const constructor = Object.getPrototypeOf(this);
    if (constructor._compType === 'referenceMap') return;
    render.apply(this, args);
  };
};

/**
 * 编辑态生成地图子组件 instance
 * @param {*} item
 * @param {*} instance
 * @param {*} layers
 */
export const initInstance = (item, instance, layers = [], from = '') => {
  // const _layers = isEditMap ? [] : layers && layers.length > 0 ? layers : item.layers;
  const _layers = layers && layers.length > 0 ? layers : item.layers;
  item.instance = instance;
  item.cssStyle = { ...instance.shapeCss, ...item.cssStyle };
  if (_layers) {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      const { iocStorageUrl } = window;
      _layers.forEach((vl, i) => {
        vl = toJS(vl);
        const { index, config } = window[vl.englishName];
        vl.initCom = index;
        vl.CssPage = config;
        if (!item.instance) return;
        let map = item.instance._map;
        if (vl._config && !Array.isArray(vl._config._data)) {
          try {
            vl._config._data = JSON.parse(vl._config._data);
            vl._config._initData = JSON.parse(vl._config._initData);
          } catch {
            vl._config._data = [];
            vl._config._initData = [];
          }
        }
        // 子图层初始不创建增加标识
        if (vl.createFlag === false && map) {
          map._subCreateFlag = false;
        }

        // if (vl.instance) return; // 如果存在就中断
        if (from === 'referenceMap') {
          map = {}; // 不能为 undefined 否则子组件 init 会报错
          resetRender(vl); // 引用地图子组件重置 render 函数，避免 vl.initCom() 生成 instance 时候会渲染子组件
        }
        vl.instance = new vl.initCom(undefined, vl._config, vl._attr, map, iocStorageUrl);
        // 子图层(基础点线面)初始不创建
        if (vl.createFlag === false || from === 'referenceMap') {
          vl.instance.render = () => {};
        }
        if (vl._visible !== undefined) {
          vl.instance.visible = vl._visible;
        }
      });
    }, 1000);
  }
};

/**
 * 地图组件生成 instance
 * @param {} item
 */
export const initMapInstance = (item, compType) => {
  let _config, attr, shape;
  if (item.preAttr) {
    _config = item.preAttr._config;
    attr = item.preAttr._attr;
    shape = item.preAttr._shape;
  }
  // 保存时会删除组件的initCom、instance、CssPage
  if (!item.initCom || !item.CssPage) {
    const { index, config: compConfig } = window[item.englishName];
    item.initCom = index;
    item.CssPage = compConfig;
  }
  let InitFn = item.initCom; // 负责渲染的构造函数
  if (InitFn && InitFn.index) {
    InitFn = InitFn.index;
  }
  const selector = `[data-key='${item.key}']>.dragger-real-container`;
  try {
    item.instance = new InitFn(selector, _config, attr, shape, compType);
  } catch (error) {
    console.error(error, item, item.name, InitFn, '初始化渲染错误信息-----');
  }
};

export const isMovedFn = (item, rect) => {
  const widthMove = item.styles.width !== `${rect.width}px`;
  const heightMoved = item.styles.height !== `${rect.height}px`;
  const transformMoved = item.styles.transform !== rect.transform;
  const bool = widthMove || heightMoved || transformMoved;
  return bool;
};

export const refreshOtherComp = (changeKeys, selfKey) => {
  const otherKey = changeKeys.filter((vl) => vl !== selfKey);
  if (otherKey.length > 0) {
    otherKey.forEach((key) => {
      const comp = getComponent(key);
      comp?.instance?.render?.();
      comp?.refresh?.();
    });
  }
};

// 同步一起拖拽组件的位置和宽高
export const syncMoveComponent = (keys, position) => {
  keys.forEach((key) => {
    const comp = getComponent(key);
    const compPosition = formatPosition(comp.styles.transform);
    compPosition[0] += Number.parseInt(position.x);
    compPosition[1] += Number.parseInt(position.y);
    const transform = `translate(${compPosition[0]}px, ${compPosition[1]}px)`;
    const css = { transform };

    if (position.width !== undefined) {
      let width;
      let height;
      switch (position.type) {
        case 'left':
        case 'control-point-left': {
          width = Number.parseInt(comp.styles.width) - position.width;
          break;
        }
        case 'right':
        case 'control-point-right': {
          width = Number.parseInt(comp.styles.width) + position.width;
          break;
        }
        case 'top':
        case 'control-point-top': {
          height = Number.parseInt(comp.styles.height) - position.height;
          break;
        }
        case 'bottom':
        case 'control-point-bottom': {
          height = Number.parseInt(comp.styles.height) + position.height;
          break;
        }
        case 'control-point-top-left': {
          width = Number.parseInt(comp.styles.width) - position.width;
          height = Number.parseInt(comp.styles.height) - position.height;
          break;
        }
        case 'control-point-bottom-right': {
          width = Number.parseInt(comp.styles.width) + position.width;
          height = Number.parseInt(comp.styles.height) + position.height;
          break;
        }
        case 'control-point-top-right': {
          width = Number.parseInt(comp.styles.width) + position.width;
          height = Number.parseInt(comp.styles.height) - position.height;
          break;
        }
        case 'control-point-bottom-left': {
          width = Number.parseInt(comp.styles.width) - position.width;
          height = Number.parseInt(comp.styles.height) + position.height;
          break;
        }
        default:
      }
      css.width = width;
      css.height = height;
    }

    $(`[data-key='${comp.key}']`).css(css);
  });
};

export const syncBatchRect = (keys) => {
  keys.forEach((key) => {
    const comp = getComponent(key);
    const $el = $(`[data-key='${key}']`);
    let matrix = $el.css('transform');
    matrix = matrixToArr(matrix);
    comp.styles.width = `${$el.width()}px`;
    comp.styles.height = `${$el.height()}px`;
    comp.styles.transform = `translate(${matrix[4]}px, ${matrix[5]}px)`;
  });
};

// 同步组件的transform
export const syncTransformComp = (key, position) => {
  const comp = getComponent(key);
  const compPosition = formatPosition(comp.styles.transform);
  compPosition[0] += Number.parseInt(position.x);
  compPosition[1] += Number.parseInt(position.y);
  const transform = `translate(${compPosition[0]}px, ${compPosition[1]}px)`;
  const css = { transform };
  // comp.styles.transform = transform;
  $(`[data-key='${comp.key}']`).css(css);
  return transform;
};
