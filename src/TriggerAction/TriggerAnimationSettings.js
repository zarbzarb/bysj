import $ from 'jquery';
// import anime from 'animejs/lib/anime.es.js';
import anime from 'animejs';
import _ from 'lodash';
import { getTransformByMatrix } from '@/utils/compute';
import { reRenderVisibleComp } from '@/utils/componentUtils';
import { handleAfterShowUpOrHidden, handleBeforeShowUpOrHide } from '@/EventHandlers/AnimateEvent';
import { message } from 'antd';
import DataI from '@/utils/global-api';

const compatible = (key) => {
  let selector = `[data-key="${key}"]`;
  if ($(selector).length > 0) {
    return selector;
  }
  selector = `[data-key="@com_${key}"]`;
  if ($(selector).length > 0) {
    return selector;
  }
  return selector;
};
/**
 * 获取当前元素节点的样式，包括透明度opacity、宽度width、高度height、已经偏移量translateX、translateY
 * @param {*} el
 * @returns
 */

const getAllCss = (cssText) => {
  // 解决乱码问题
  const text = decodeURI(cssText);
  const res = {};
  const paramsArr = _.split(text, ';');
  _.forEach(paramsArr, function (item) {
    if (item && item.includes(':')) {
      const key = _.split(item, ':')[0].trim();
      const value = _.split(item, ':')[1].trim();
      res[key] = value;
    }
  });
  return res;
};
const fetchCssStyle = (el, key, animationType) => {
  let cssText = '';
  if ($(el).length > 0) {
    cssText = $(el)[0]?.style?.cssText || '';
  }
  // console.log('cssText', cssText);
  const cssObject = getAllCss(cssText);
  let opacity;
  let visibility;
  // let display = undefined;
  // v7.7.1按动画类型获取css属性，无动画不需要；
  if (animationType === 'showHide') {
    opacity = cssObject.opacity || $(el).css('opacity');
    visibility = cssObject.visibility || $(el).css('visibility');
    // display = cssObject['display'] || $(el).css('display');
  }
  const width = cssObject.width || $(el).css('width');
  const height = cssObject.height || $(el).css('height');
  // v7.7.1只获取有特殊值属性，无值属性返回undefined；
  const minWidth = cssObject['min-width'] || undefined;
  const minHeight = cssObject['min-height'] || undefined;
  const overflow = cssObject.overflow || undefined;
  const initStyle = {
    opacity,
    visibility,
    // display,
    width,
    height,
    minWidth,
    minHeight,
    overflow,
    translateX: undefined, // v7.7.1只获取有特殊值属性，无值属性返回undefined；
    translateY: undefined, // v7.7.1只获取有特殊值属性，无值属性返回undefined；
    scaleX: undefined, // v7.7.1只获取有特殊值属性，无值属性返回undefined；
    scaleY: undefined, // v7.7.1只获取有特殊值属性，无值属性返回undefined；
    key,
  };
  const transformStr = cssObject.transform;

  if (transformStr && transformStr.includes('translate(')) {
    const transformString = transformStr?.replace('translate(', '')?.replace(')', '') || undefined;
    const transform = transformString && String(transformString).split(',');
    const transformX = Number.parseInt(transform[0]);
    const transformY = Number.parseInt(transform[1]);
    Object.assign(initStyle, {
      translateX: transformX || 0,
      translateY: transformY || 0,
    });
  } else if (transformStr && transformStr.includes('translateX(')) {
    const paramsArr = _.split(transformStr, ')');
    const transformObj = {};
    _.forEach(paramsArr, function (item) {
      if (item && item.includes('(')) {
        const curKey = _.split(item, '(')[0].trim();
        const value = _.split(item, '(')[1].trim();
        transformObj[curKey] = Number.parseInt(value) || 0;
      }
    });
    Object.assign(initStyle, { ...transformObj });
  } else {
    const transform = $(el).css('transform');
    let transformObj = {};
    let scales = [];
    if (transform) {
      transformObj = getTransformByMatrix(transform);
      const scalesString = transform?.replace('matrix(', '')?.replace(')', '') || undefined;
      scales = scalesString && String(scalesString).split(',');
    }
    if (Array.isArray(scales) && scales.length > 3) {
      Object.assign(initStyle, {
        transform: transform || 'none',
        translateX: transformObj.x || 0,
        translateY: transformObj.y || 0,
        scaleX: scales[0],
        scaleY: scales[3],
      });
    }
  }
  return initStyle;
};
// const showEl = (key) => {
//   let comp;
//   let compList = DataI.getComList(key);
//   if (compList && compList.length > 0) {
//     comp = compList[0];
//     // v7.7.1使用公共方法
//     reRenderVisibleComp({ ...comp, key }, '0');
//   }
// };
// // 递归组内报表组件重新渲染
// const instanceRender = (list) => {
//   list.forEach((com) => {
//     com.instance && com.instance.render && com.instance.render();
//     if (com.classType === 'group') {
//       instanceRender(com.childComList);
//     } else if (com.type === 'DynamicPanel') {
//       com.children.forEach((child) => {
//         instanceRender(child.AntdChildComponents);
//       });
//     }
//   });
// };
const fetchStyle = (key, animationType) => {
  // console.log('key', key);
  const el = compatible(key);
  const display = $(el).css('display');
  const visibility = $(el).css('visibility');
  // console.log('display', display);
  if ((display === 'none' || visibility === 'hidden') && animationType === 'showHide') {
    $(el).css({ visibility: 'hidden' }).show();
    // let comp;
    const compList = window.DataI.getComList(key);
    if (compList && compList.length > 0) {
      const comp = compList[0];
      // v7.7.1使用公共方法
      reRenderVisibleComp({ ...comp, key }, '0');
      // // 组内所有报表组件需要重新渲染，否则宽高不生效
      // if (comp && comp.englishName == 'GroupBasic') {
      //   instanceRender(comp.childComList);
      // } else {
      //   // 未成组报表组件重新渲染
      //   (comp && comp.render && comp.render()) ||
      //     (comp &&
      //       comp.instance &&
      //       comp.instance.render &&
      //       comp.instance.render());
      // }
    }
    $(el).css({ visibility: 'hidden' });
  }
  const initStyle = fetchCssStyle(el, key, animationType);
  // console.log('initStyle', initStyle);
  return initStyle;
};

/**
 * 获取同一动作同一对象的key
 * @param {*} setting animationSettings 单个动画设置
 * @returns 区分同一动作同一对象的key
 */
const animationKey = (setting) => {
  let key = setting.animationType;
  switch (setting.animationType) {
    case 'showHide':
      key += `-${setting.associatComponents.sort().join('')}`;
      break;
    case 'move':
      key += `-${setting.compKey}`;
      break;
    default:
      key += `-${setting.sizeCompKey}`;
      break;
  }
  return key;
};
/**
 * 将一组动作按同一动作同一对象的key转化为map
 * @param {*} settingList animationSettings 动画动作数组
 * @returns map
 */
const transformToMapFromList = (settingList) => {
  const animationMap = new Map();
  settingList.forEach((setting) => {
    // 获取动画key，key相同按顺序执行，不同同时执行
    const key = animationKey(setting);
    let list = animationMap.get(key);

    if (list === undefined) list = [setting];
    else list.push(setting);

    animationMap.set(key, list);
  });
  return animationMap;
};

/**
 * 生成显示隐藏动画效果
 * @param {*} isVisible 显示/隐藏
 * @param {*} effect  动画效果
 * @param {*} duration 时间
 * @param {*} animationMode 动画类型
 * @param {*} offsetDistance 偏移距离
 * @param {*} isGradual 渐变
 * @param {*} initStyle 初始css样式
 * @returns
 */
const generateEffect = (isVisible, effect, duration, animationMode, offsetDistance, isGradual, initStyle) => {
  const { translateX, translateY, width, height, scaleX = 1, scaleY = 1 } = initStyle;
  const widthNumber = Number(width?.replace('px', '') || 1);
  const heightNumber = Number(height?.replace('px', '') || 1);
  // 透明度取最终透明度
  const opacity = isVisible ? [0, 1] : [1, 0];
  let config = {
    effect,
    duration,
    // animationMode,
    // offsetDistance,
    isGradual,
    opacity,
  };
  switch (effect) {
    case 'gradually':
      config = {
        ...config,
        easing: 'easeInOutSine',
      };
      break;
    case 'slideRight': // v6.18隐藏需要复位
      config =
        animationMode === '2'
          ? {
              ...config,
              translateX: isVisible
                ? [translateX - offsetDistance, translateX]
                : [translateX, translateX + offsetDistance],
            }
          : {
              ...config,
              translateX: isVisible ? [translateX, translateX] : [translateX, translateX + widthNumber],
              width: isVisible ? [1, widthNumber] : [widthNumber, 1],
            };
      break;
    case 'slideLeft':
      config =
        animationMode === '2'
          ? {
              ...config,
              translateX: isVisible
                ? [translateX + offsetDistance, translateX]
                : [translateX, translateX - offsetDistance],
            }
          : {
              ...config,
              translateX: isVisible ? [translateX + widthNumber, translateX] : [translateX, translateX],
              width: isVisible ? [1, widthNumber] : [widthNumber, 1],
            };
      break;
    case 'slideTop':
      config =
        animationMode === '2'
          ? {
              ...config,
              translateY: isVisible
                ? [translateY + offsetDistance, translateY]
                : [translateY, translateY - offsetDistance],
            }
          : {
              ...config,
              translateY: isVisible ? [translateY + heightNumber, translateY] : [translateY, translateY],
              height: isVisible ? [1, heightNumber] : [heightNumber, 1],
            };
      break;
    case 'slideBottom':
      config =
        animationMode === '2'
          ? {
              ...config,
              translateY: isVisible
                ? [translateY - offsetDistance, translateY]
                : [translateY, translateY + offsetDistance],
            }
          : {
              ...config,
              translateY: isVisible ? [translateY, translateY] : [translateY, translateY + heightNumber],
              height: isVisible ? [1, heightNumber] : [heightNumber, 1],
            };
      break;
    case 'turnRight':
      config = {
        ...config,
        rotateY: isVisible ? [90, 0] : [0, -90],
      };
      break;
    case 'turnLeft':
      config = {
        ...config,
        rotateY: isVisible ? [-90, 0] : [0, 90],
      };
      break;
    case 'turnTop':
      config = {
        ...config,
        rotateX: isVisible ? [-90, 0] : [0, 90],
      };
      break;
    case 'turnBottom':
      config = {
        ...config,
        rotateX: isVisible ? [90, 0] : [0, -90],
      };
      break;
    case 'leftTop':
    case 'rightTop':
    case 'leftBottom':
    case 'rightBottom':
      config = {
        ...config,
        scaleX: isVisible ? [0, scaleX] : [scaleX, 0],
        scaleY: isVisible ? [0, scaleY] : [scaleY, 0],
      };
      break;
    case 'none':
      config = {
        ...config,
        duration: 10,
      };
      break;
    default:
      break;
  }
  return config;
};
/**
 * 生成显示隐藏动画配置参数
 * isVisible 显示/隐藏
 * initStyle 初始样式值
 * setting 动画配置
 *  */
const generateShowHideConfig = (isVisible, initStyle, setting) => {
  const {
    visibleEffect,
    visibleDuration,
    visibleAnimationMode = 1,
    visibleOffsetDistance = 400,
    visibleIsGradual = false,
    hideEffect,
    hideDuration,
    hideAnimationMode = 1,
    hideOffsetDistance = 400,
    hideIsGradual = false,
  } = setting;
  const effect = isVisible ? visibleEffect : hideEffect;
  const duration = isVisible ? visibleDuration : hideDuration;
  // v8.1.1
  const animationMode = isVisible ? visibleAnimationMode : hideAnimationMode;
  const offsetDistance = isVisible ? visibleOffsetDistance : hideOffsetDistance;
  const isGradual = isVisible ? visibleIsGradual : hideIsGradual;

  return generateEffect(isVisible, effect, duration, animationMode, offsetDistance, isGradual, initStyle);
};
/**
 * 区分是显示还是隐藏动画 true 为显示， false 为隐藏
 */
const getVisible = (visible, preVisible) => {
  let isVisible = false;
  if (visible === '0') {
    isVisible = true;
  } else if (visible === '1') {
    isVisible = false;
  } else {
    isVisible = !preVisible;
  }
  return isVisible;
};
/**
 * 获取组件初始值，
 * @param {*} targetOriginMap 集合
 * @param {*} el key值
 * @returns isVisible, initStyle
 */
const getOriginValue = (targetOriginMap, el) => {
  const config = targetOriginMap.get(el);
  return config;
};
// 生成移动动画配置参数
const generateMoveConfig = (moveType, movePoint, targetMap, el) => {
  let config = {};
  let originInitStyle = targetMap.get(el);
  switch (moveType) {
    case 'arrive':
      config = {
        translateX: `${movePoint?.x || 0}px`,
        translateY: `${movePoint?.y || 0}px`,
      };
      originInitStyle = {
        ...originInitStyle,
        translateX: movePoint?.x || 0,
        translateY: movePoint?.y || 0,
      };
      break;
    case 'move':
      config = {
        translateX: `+=${movePoint?.x || 0}px`,
        translateY: `+=${movePoint?.y || 0}px`,
      };
      originInitStyle = {
        ...originInitStyle,
        translateX: (originInitStyle?.translateX || 0) + (movePoint?.x || 0),
        translateY: (originInitStyle?.translateY || 0) + (movePoint?.y || 0),
      };
      break;
    default:
      break;
  }
  targetMap.set(el, originInitStyle);
  return config;
};
// 生成移动动画效果
const generateMoveEffect = (moveEffect) => {
  let easing = 'easeInOutSine';
  switch (moveEffect) {
    case 'easeInOutSine':
      easing = 'easeInOutSine';
      break;
    case 'elastic':
      easing = 'easeOutElastic(2, 0.3)';
      break;
    case 'bounce':
      easing = 'easeOutElastic(1, 0.2)';
      break;
    default:
      break;
  }
  return easing;
};
const fetchScreenSelector = () => {
  let selector = '.screen-wrap';
  if ($(selector).length > 0) {
    return selector;
  }
  selector = '[data-key="console"]';
  if ($(selector).length > 0) {
    return selector;
  }
  selector = 'body';
  return selector;
};
// 生成设置尺寸配置参数
const generateSizeConfig = (el, sizeMode, fixedScale, size, targetMap, screenConfig) => {
  let config = {
    scaleX: 1,
    scaleY: 1,
  };
  let originInitStyle = targetMap.get(el);
  const screenSelector = fetchScreenSelector();
  let screenWidth = $(screenSelector).width();
  let screenHeight = $(screenSelector).height();
  screenWidth = screenWidth > 1 ? screenWidth : 1920;
  screenHeight = screenHeight > 1 ? screenHeight : 1080;
  if ((screenConfig?.adaptionId || undefined) && (screenConfig?.type || undefined) === 'card') {
    // 多SDK渲染卡片
    screenWidth /= screenConfig?.scaleX || 1;
    screenHeight /= screenConfig?.scaleY || 1;
  }
  const screenProportion = (screenWidth * 1) / screenHeight;
  let width = originInitStyle?.width;
  let height = originInitStyle?.height;
  width = Number(width?.replace('px', '') || 0);
  height = Number(height?.replace('px', '') || 0);
  let compProportion = 1;
  if (Number.isNaN(width) || width === 0 || Number.isNaN(height) || height === 0) {
    console.error('动画设置尺寸操作，组件高度获取有问题');
    return config;
  }
  compProportion = (width * 1) / height;
  // console.log('screenWidth', screenWidth);
  // console.log('screenHeight', screenHeight);
  // console.log('screenProportion', screenProportion);
  // console.log('width', width);
  // console.log('height', height);
  // console.log('compProportion', compProportion);
  // console.log('size', size);
  switch (sizeMode) {
    case 'maxScale':
      if (screenProportion > compProportion) {
        config = {
          scaleX: (screenHeight * 1) / height,
          scaleY: (screenHeight * 1) / height,
          // width: `${screenHeight * compProportion}px`,
          // height: `${screenHeight}px`,
          translateX: `${(screenWidth - screenHeight * 1 * compProportion) / 2}px`,
          translateY: '0px',
        };
        originInitStyle = {
          ...originInitStyle,
          scaleX: (screenHeight * 1) / height,
          scaleY: (screenHeight * 1) / height,
          translateX: (screenWidth - screenHeight * 1 * compProportion) / 2,
          translateY: 0,
        };
      } else {
        config = {
          scaleX: (screenWidth * 1) / width,
          scaleY: (screenWidth * 1) / width,
          // width: `${screenWidth}px`,
          // height: `${screenWidth * compProportion}px`,
          translateX: '0px',
          translateY: `${(screenHeight - (screenWidth * 1) / compProportion) / 2}px`,
        };
        originInitStyle = {
          ...originInitStyle,
          scaleX: (screenWidth * 1) / width,
          scaleY: (screenWidth * 1) / width,
          translateX: 0,
          translateY: (screenHeight - (screenWidth * 1) / compProportion) / 2,
        };
      }
      break;
    case 'fixedScale':
      config = {
        scaleX: fixedScale,
        scaleY: fixedScale,
      };
      originInitStyle = {
        ...originInitStyle,
        scaleX: fixedScale,
        scaleY: fixedScale,
      };
      break;
    case 'fullScreen':
      config = {
        scaleX: (screenWidth * 1) / width,
        scaleY: (screenHeight * 1) / height,
        translateX: '0px',
        translateY: '0px',
      };
      originInitStyle = {
        ...originInitStyle,
        scaleX: (screenWidth * 1) / width,
        scaleY: (screenHeight * 1) / height,
        translateX: 0,
        translateY: 0,
      };
      break;
    case 'fixedSize':
      config = {
        scaleX: (size.width * 1) / width,
        scaleY: (size.height * 1) / height,
      };
      originInitStyle = {
        ...originInitStyle,
        scaleX: (size.width * 1) / width,
        scaleY: (size.height * 1) / height,
      };
      break;
    default:
      break;
  }
  targetMap.set(el, originInitStyle);
  return config;
};
/**
 * 对特殊组件进行处理，比如动态面板或者图层
 * @param {*} compKey
 * @returns
 */
const generateKeyList = (compKey, screenConfig, appPageId) => {
  // 动态面板子组件伪key
  // DynamicPanel-38uNLbxL94LB2DvUj8ezNU-0
  const dynamicPanelKey = compKey.filter((key) => key.includes('DynamicPanel'));
  // 去掉动态面板子组件伪key,提取子组件真实key
  let realCompKey = compKey.filter((key) => !key.includes('DynamicPanel'));
  if (dynamicPanelKey.length > 0) {
    let dynamicPanelCompKeys = [];
    dynamicPanelKey.forEach((key) => {
      const arr = key.split('-');
      if (window.comList) {
        const dynaimc = window.comList.get(arr[1]);
        if (dynaimc) {
          dynamicPanelCompKeys = [
            ...dynamicPanelCompKeys,
            ...dynaimc.children[Number.parseInt(arr[2])].AntdChildComponents.map((v) => v.key),
          ];
          // dynamicPanelCompKeys.concat(
          //   dynaimc.children[Number.parseInt(arr[2])].AntdChildComponents.map((v) => v.key),
          // );
        }
      }
    });
    if (dynamicPanelCompKeys.length > 0) {
      realCompKey = [...realCompKey, ...dynamicPanelCompKeys];
    }
  }
  // 获取图层
  let layers = [];
  const pageInfo = appPageId ? window.DataI.PAGEINFOMAP[appPageId] : window.DataI.PAGEINFOMAP[screenConfig?.pageId];
  // v7.4 防止window.screenConfig覆盖
  // TODO 8.0 layerConfig
  if (pageInfo?.pageConfig?.layerConfig || false) {
    layers = pageInfo?.pageConfig.layerConfig.layers; // 卡片没有图层管理的概念
  }
  const list = realCompKey
    .map((key) => {
      const islayer = layers.some((v) => v.key === key);
      // 组件显隐
      if (!islayer) {
        return key;
      }
      // 图层显隐
      const { layerId } = layers.find((v) => v.key === key);
      let componentList = window.componentList || [];
      if (componentList.length === 0) {
        componentList = window.layerList || [];
      }
      const comKeyList = componentList.filter((v) => v.layerId === layerId).map((v) => v.key);
      return comKeyList;
    })
    .flat();
  return [...new Set(list)];
};

// 依据配置生成动画,并且以数组返回，隐藏动画带一个复位动画
/**
 * preVisibleMap 时间轴内，对应组件的前一个显示隐藏状态缓存，用于处理切换操作
 * targetMap
 */
const generateAnimation = (setting, preVisibleMap, targetMap, screenConfig) => {
  let showAnimate;
  let animate;
  let hideResetAnimate;
  const { animationType, isClearBeforeAnimation = false } = setting;
  switch (animationType) {
    case 'showHide':
      {
        const { associatComponents, appPageId } = setting;
        const comKeyList = generateKeyList(associatComponents, screenConfig, appPageId);
        const targets = comKeyList
          .map((key) => compatible(key))
          .filter((el) => {
            if ($(el).length === 0) {
              // console.error(selector, '没有对应的组件或者表达式');
              return false;
            }
            // let width = $(el).css('width');
            // // let display = $(el).css('display');
            // let widthNumber = isNaN(parseInt(width)) ? 0 : parseInt(width);
            // return widthNumber > 0;
            // // || display == 'none';
            return true;
          });
        const targetOriginMap = new Map();
        targets.forEach((el) => {
          let preVisible = preVisibleMap.get(el);
          const initStyle = targetMap.get(el);
          const visibility = $(el).css('visibility');
          const display = $(el).css('display');
          if (preVisible === undefined) {
            // 如果display == 'none' 也是默认初始隐藏
            preVisible = !(visibility === 'hidden' || display === 'none');
            // preVisible = display == 'none' ? false : true;
          }
          const isVisible = getVisible(setting.visible, preVisible);

          associatComponents.forEach((compKey) =>
            handleBeforeShowUpOrHide(DataI.getComponentByKey(compKey), isVisible ? 'showup' : 'hide', screenConfig),
          );

          preVisibleMap.set(el, isVisible);
          targetOriginMap.set(el, { initStyle, isVisible });
        });
        animate = {
          targets,
          duration(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const config = generateShowHideConfig(isVisible, initStyle, setting);
            return config.duration;
          },

          opacity(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const config = generateShowHideConfig(isVisible, initStyle, setting);

            if (config.effect === 'gradually' || (config.isGradual && config.effect !== 'none')) return config.opacity;

            // eslint-disable-next-line no-void
            return void 0;
          },

          rotateX(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const config = generateShowHideConfig(isVisible, initStyle, setting);
            return config.rotateX;
          },

          rotateY(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const config = generateShowHideConfig(isVisible, initStyle, setting);
            return config.rotateY;
          },

          scaleX(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const config = generateShowHideConfig(isVisible, initStyle, setting);
            return config.scaleX;
          },

          scaleY(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const config = generateShowHideConfig(isVisible, initStyle, setting);
            return config.scaleY;
          },

          width(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const config = generateShowHideConfig(isVisible, initStyle, setting);
            return config.width;
          },

          height(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const config = generateShowHideConfig(isVisible, initStyle, setting);
            return config.height;
          },

          translateX(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const config = generateShowHideConfig(isVisible, initStyle, setting);
            return config.translateX;
          },

          translateY(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const config = generateShowHideConfig(isVisible, initStyle, setting);
            return config.translateY;
          },

          easing: 'easeInOutSine',
          begin(anim) {
            targets.forEach((el) => {
              const { isVisible, initStyle } = targetOriginMap.get(el);
              // const { key } = initStyle;
              // v7.7.1 有特殊值才需要特殊处理
              if (initStyle.overflow) anim.set(el, { overflow: 'hidden' });

              const config = generateShowHideConfig(isVisible, initStyle, setting);
              if (isVisible) {
                anim.set(el, {
                  opacity: 1,
                  visibility: 'visible',
                });
                // $(el).show();
                // showEl(key);
              }
              switch (config.effect) {
                case 'slideRight': // v6.18隐藏需要复位
                  anim.set(el, {
                    transformOrigin: isVisible ? 'right center' : 'left center',
                  });
                  // v7.7.1 有特殊值才需要特殊处理
                  if (initStyle.minWidth) anim.set(el, { 'min-width': '0px' });
                  break;
                case 'slideLeft':
                  anim.set(el, {
                    transformOrigin: isVisible ? 'left center' : 'right center',
                  });
                  // v7.7.1 有特殊值才需要特殊处理
                  if (initStyle.minWidth) anim.set(el, { 'min-width': '0px' });
                  break;
                case 'slideTop':
                  anim.set(el, {
                    transformOrigin: isVisible ? 'center top' : 'center bottom',
                  });
                  // v7.7.1 有特殊值才需要特殊处理
                  if (initStyle.minHeight) anim.set(el, { 'min-height': '0px' });
                  break;
                case 'slideBottom':
                  anim.set(el, {
                    transformOrigin: isVisible ? 'center bottom' : 'center top',
                  });
                  // v7.7.1 有特殊值才需要特殊处理
                  if (initStyle.minHeight) anim.set(el, { 'min-height': '0px' });
                  break;
                case 'turnRight':
                case 'turnLeft':
                case 'turnTop':
                case 'turnBottom':
                  anim.set(el, {
                    transformOrigin: 'center center',
                  });
                  break;
                case 'leftTop':
                  anim.set(el, {
                    transformOrigin: 'left top',
                  });
                  break;
                case 'rightTop':
                  anim.set(el, {
                    transformOrigin: 'right top',
                  });
                  break;
                case 'leftBottom':
                  // console.log('leftBottom');
                  anim.set(el, {
                    transformOrigin: 'left bottom',
                  });
                  break;
                case 'rightBottom':
                  // console.log('rightBottom');
                  anim.set(el, {
                    transformOrigin: 'right bottom',
                  });
                  break;
                default:
                  break;
              }
            });
          },
          // 隐藏动画结束，隐藏组件
          complete(anim) {
            targets.forEach((el) => {
              const { isVisible, initStyle } = targetOriginMap.get(el);
              // const { key } = initStyle;
              const config = generateShowHideConfig(isVisible, initStyle, setting);
              if (config.effect === 'none') {
                anim.set(el, {
                  opacity: isVisible ? 1 : 0,
                  visibility: isVisible ? 'visible' : 'hidden',
                });
                // if (isVisible) {
                //   // $(el).show();
                //   showEl(key);
                // } else {
                //   $(el).hide();
                // }
              }
              if (!isVisible) {
                anim.set(el, { opacity: 0, visibility: 'hidden' });
                // anim.set(el, { opacity: 0.0 });
                // $(el).hide();
              }
              // v7.7.1 有特殊值才需要特殊处理
              initStyle.overflow && anim.set(el, { overflow: initStyle.overflow });
              if (config.effect === 'slideRight' || config.effect === 'slideLeft') {
                // v7.7.1 有特殊值才需要特殊处理
                initStyle.minWidth && anim.set(el, { 'min-width': initStyle.minWidth });
              }
              if (config.effect === 'slideTop' || config.effect === 'slideBottom') {
                // v7.7.1 有特殊值才需要特殊处理
                initStyle.minHeight && anim.set(el, { 'min-height': initStyle.minHeight });
              }
            });
          },
        };
        // 显示动画，防止begin不生效
        showAnimate = {
          targets,
          duration: 10,
          opacity(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const config = generateShowHideConfig(isVisible, initStyle, setting);
            if (isVisible && !(config.effect === 'gradually' || config.effect === 'none')) {
              return 1;
            }
            return;
          },
        };
        // 隐藏动画复位组件，防止组件变形
        hideResetAnimate = {
          targets,
          duration: 10,
          rotateX(el) {
            return '0deg';
          },
          rotateY(el) {
            return '0deg';
          },
          scaleX(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const { scaleX = 1 } = initStyle;
            if (!isVisible) {
              return scaleX;
            }
            return;
          },
          scaleY(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const { scaleY = 1 } = initStyle;
            if (!isVisible) {
              return scaleY;
            }
            return;
          },
          width(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const { width } = initStyle;
            if (!isVisible) {
              return width;
            }
            return;
          },
          height(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const { height } = initStyle;
            if (!isVisible) {
              return height;
            }
            return;
          },
          translateX(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const { translateX } = initStyle;
            if (!isVisible) {
              return translateX;
            }
            return;
          },
          translateY(el, index) {
            const target = targets[index];
            const { isVisible, initStyle } = getOriginValue(targetOriginMap, target);
            const { translateY } = initStyle;
            // console.log('translateY', translateY);
            if (!isVisible) {
              return translateY;
            }
            return;
          },
          easing: 'easeInOutSine',
        };
      }
      break;
    case 'move':
      {
        const { compKey, moveType, movePoint, moveEffect, moveDuration } = setting;
        const targets = compatible(compKey);
        const translate = generateMoveConfig(moveType, movePoint, targetMap, targets);
        animate = {
          targets,
          ...translate,
          duration: moveEffect === 'none' ? 0 : moveDuration,
          easing: generateMoveEffect(moveEffect),
          begin(anim) {
            $(targets).css({ transformOrigin: 'left top' });
          },
        };
      }
      break;
    default:
      {
        const { sizeCompKey, size, sizeDuration, sizeMode, fixedScale } = setting;
        const targets = compatible(sizeCompKey);
        const sizeConfig = generateSizeConfig(targets, sizeMode, fixedScale, size, targetMap, screenConfig);
        animate = {
          targets,
          ...sizeConfig,
          duration: sizeDuration,
          easing: 'easeInOutSine',
          begin(anim) {
            $(targets).css({ transformOrigin: 'left top' });
          },
        };
      }
      break;
  }
  animate = {
    ...animate,
    autoPlay: false,
    loop: false,
  };
  // 生成显示动画，针对begin显示不成功
  if (showAnimate) {
    showAnimate = {
      ...showAnimate,
      autoPlay: false,
      loop: false,
    };
  }
  // 生成复位动画
  if (hideResetAnimate) {
    hideResetAnimate = {
      ...hideResetAnimate,
      autoPlay: false,
      loop: false,
    };
  }
  return [animate, hideResetAnimate, showAnimate];
};

// 动画动作节点分隔,并记录所有组件及其原始属性，用于动画复位reset
const splitAnimationSetting = (animationSettings, screenConfig) => {
  // 以等待动作为分隔点，将动作进行分组，等待节点单独为一组，
  const timeLineSettings = []; // 动画时间轴列表
  const waitingIntervalSettings = []; // 等待列表
  const targetMap = new Map(); // 组件原始属性
  let startIndex = 0;
  let endIndex = 0;
  if (Array.isArray(animationSettings) && animationSettings.length > 0) {
    for (let index = 0; index < animationSettings.length; index++) {
      const setting = animationSettings[index];
      // 当前节点为等待节点，则将之前的节点到当前节点之前的元素取出放置一组
      // 把等待节点也放到timeLineSettings里
      // 起始坐标位置变更
      if (setting.animationType === 'waitingInterval') {
        endIndex = index;
        const settingsItem = animationSettings.slice(startIndex, endIndex);
        timeLineSettings.push(settingsItem);
        waitingIntervalSettings.push(setting);
        startIndex = index + 1;
      } else {
        switch (setting.animationType) {
          case 'showHide':
            {
              const comKeyList = generateKeyList(setting.associatComponents, screenConfig, setting.appPageId);
              // v7.5.1获取初始值，需要考虑初始化被隐藏
              comKeyList.forEach((key) => {
                handleAfterShowUpOrHidden(DataI.getComponentByKey(key), screenConfig);

                const el = compatible(key);
                if ($(el).length > 0) {
                  const initStyle = fetchStyle(key, 'showHide');
                  targetMap.set(el, initStyle);
                  // }
                }
              });
            }
            break;
          case 'move':
            {
              // v7.5.1获取初始值，需要考虑初始化被隐藏
              const el = compatible(setting.compKey);
              const initStyle = fetchStyle(setting.compKey, 'move');
              targetMap.set(el, initStyle);
            }
            break;
          default:
            {
              // v7.5.1获取初始值，需要考虑初始化被隐藏
              const el = compatible(setting.sizeCompKey);
              const initStyle = fetchStyle(setting.sizeCompKey, 'size');
              targetMap.set(el, initStyle);
            }
            break;
        }
        // 到最后节点时，将上一个等待节点到最后，都取出来
        if (index === animationSettings.length - 1) {
          const settingsItem = animationSettings.slice(startIndex);
          timeLineSettings.push(settingsItem);
        }
      }
    }
  }
  return [timeLineSettings, waitingIntervalSettings, targetMap];
};
// 校验动画交互参数
export const verifyAnimationSettings = (animationSettings, screenConfig) => {
  if (animationSettings.length === 0) {
    message.warning('动画设置为空，请先添加动画配置');
    return false;
  }

  for (const [index, setting] of animationSettings.entries()) {
    // 判断动类型

    if (!setting.animationType) {
      message.warning(`动画配置，动画动作${index + 1},请先补全动作类型`);
      return false;
    }

    // 依据动作类型分别校验
    switch (setting.animationType) {
      case 'showHide': // 显示隐藏
        {
          // 被操作组件
          if (setting.associatComponents.length === 0) {
            console.warn(`动画配置，动画动作${index + 1}显示隐藏,请先补全被操作组件`);
            return false;
          }

          const comKeyList = generateKeyList(setting.associatComponents, screenConfig, setting.appPageId);
          const selectEls = comKeyList.filter((key) => {
            return $(compatible(key)).length === 0;
          });

          if (selectEls && selectEls.length > 0) {
            console.warn(
              `动画配置，动画动作${index + 1}显示隐藏, 被操作组件${selectEls[0]}等没有找到或者尚未初始化，请检查配置`,
            );
          }

          // 显示动画效果
          if ((setting.visible === '0' || setting.visible === '2') && !setting.visibleEffect) {
            message.warning(`动画配置，动画动作${index + 1}显示隐藏,请先补全显示动画`);
            return false;
          }

          // 隐藏动画效果
          if ((setting.visible === '1' || setting.visible === '2') && !setting.hideEffect) {
            message.warning(`动画配置，动画动作${index + 1}显示隐藏,请先补全隐藏动画`);
            return false;
          }
        }
        break;
      case 'move': // 移动
        {
          // 被操作组件
          if (!setting.compKey) {
            message.warning(`动画配置，动画动作${index + 1},请先补全被操作组件`);
            return false;
          }
          const res2 = $(compatible(setting.compKey)).length === 0;
          if (res2) {
            console.warn(
              `动画配置，动画动作${index + 1}移动, 被操作组件${setting.compKey}没有找到或者尚未初始化，请检查配置`,
            );
            // return false;
          }
          // 移动动画效果
          if (!setting.moveEffect) {
            message.warning(`动画配置，动画动作${index + 1}移动,请先补全动画效果`);
            return false;
          }
        }
        break;
      case 'size':
        {
          // 尺寸动画效果
          if (!setting.sizeCompKey) {
            message.warning(`动画配置，动画动作${index + 1}设置尺寸,请先补全被操作组件`);
            return false;
          }
          const res3 = $(compatible(setting.sizeCompKey)).length === 0;
          if (res3) {
            console.warn(
              `动画配置，动画动作${index + 1}设置尺寸, 操作组件${
                setting.sizeCompKey
              }没有找到或者尚未初始化，请检查配置`,
            );
            // return false;
          }
        }
        break;
      default:
        break;
    }
  }
  return true;
};
// 动画渲染对象
/** 警告!
 *
 *  这个类由于之前的设计和实现错误,
 *
 *  导致它完全无法按照设计目标执行,
 *
 *  为了正常使用这个类的功能现在你需要通过这个数组
 *
 *  (realWorkTimelinesList),
 *
 *  来直接控制这个类下的 subTimelines, 其他的 timeline 和
 *
 *  timelines 实现均不保证可以正常使用
 *
 *                                      By HuNerd
 *
 */
export class TriggerAnimationSettings {
  // 构造函数
  constructor(animationSettings, screenConfig) {
    this.realWorkTimelinesList = [];
    // eslint-disable-next-line no-unused-expressions
    `警告!
  
        这个类由于之前的设计和实现错误,
        导致它完全无法按照设计目标执行,
        为了正常使用这个类的功能现在你需要通过上面这个数组
        (realWorkTimelinesList),
        来直接控制这个类下的 subTimelines, 其他的 timeline 和
        timelines 实现均不保证可以正常使用
    
                                        By HuNerd`;

    this.playState = false; // 动画执行状态
    this.commonParams = {
      // 公共参数
      autoPlay: false,
      loop: false,
    };
    this.timeoutList = []; // 超时定时器列表
    this.screenConfig = screenConfig; // 全局配置
    // 动画设置
    this.animationSettings = Array.isArray(animationSettings) ? animationSettings : [];
    /**
     * 动画设置初始化
     */
    const [timeLineMapList, waitingIntervalSettings, targetMap] = this.initTimeLineMapList();
    // 初始组件属性存储
    this.targetMap = targetMap;
    // 当前组件属性存储
    this.currentTargetMap = _.cloneDeep(targetMap);
    // 执行动画map
    this.timeLineMapList = timeLineMapList || [];
    // 等待动画节点
    this.waitingIntervalSettings = waitingIntervalSettings || [];
  }

  /**
   * 生成动画时间轴数组timeLineMapList和等待节点数据waitingIntervalSettings 以及组件初始状态
   * @returns [timeLineMapList, waitingIntervalSettings, targetMap]
   * timeLineMapList
   * waitingIntervalSettings
   * targetMap
   */
  initTimeLineMapList() {
    // 以等待动作为分隔点，将动作进行分组，等待节点单独每个一组， targetMap记录每个组件的初始属性
    const [timeLineSettings, waitingIntervalSettings, targetMap] = splitAnimationSetting(
      this.animationSettings,
      this.screenConfig,
    );
    // 对同一分组的动作，以动作和对象为key生成map
    const timeLineMapList = timeLineSettings.map((settingList) => {
      return transformToMapFromList(settingList);
    });
    return [timeLineMapList, waitingIntervalSettings, targetMap];
  }

  /**
   * 利用mapItem生成时间轴
   * 因为时间轴生成时，会记住组件初始样式，
   * 所以下一个时间轴要等上一个时间轴执行完成再生成
   * @param {Map} mapItem
   * @returns {anime.AnimeTimelineInstance}
   */
  generateTimeLine(mapItem /* , resolve, reject */) {
    /** 警告!
     *
     *    这个 timeLine 在事实上失效,
     *
     *    无法调用任何相关的控制方法,
     *
     *    保留这个 timeline 仅作为兼容性考量!
     *
     *                          By HuNerd
     */
    const timeLine = anime.timeline(this.commonParams);
    const preVisibleMap = new Map();
    for (const key of mapItem.keys()) {
      const list = mapItem.get(key);
      const subTimeLine = anime.timeline(this.commonParams);
      // 相同key，按顺序添加到subTimeLine，按顺序执行
      // console.log('subTimeLine', subTimeLine);
      list.forEach((setting, idx) => {
        // 生成动画
        const animateList = generateAnimation(setting, preVisibleMap, this.currentTargetMap, this.screenConfig);
        // v6.19返回动画数组
        const animate = animateList[0];
        // v6.19新增复位动画
        const hideResetAnimate = animateList[1];
        // 初始显示动画
        const showAnimate = animateList[2];
        if (showAnimate) {
          subTimeLine.add(showAnimate);
        }
        subTimeLine.add(animate);
        if (hideResetAnimate) {
          subTimeLine.add(hideResetAnimate);
        }
      });

      this.realWorkTimelinesList.push(subTimeLine);

      // 不同key的subTimeLine，添加到timeLine，同时执行
      timeLine.add(subTimeLine, 0);
    }
    timeLine.pause();
    return timeLine;
  }

  /**
   * 动画设置播放
   * 1.生成对应动画时间轴；
   * 2.执行动画时间轴；
   * 3.动画时间轴执行完成，等待（等待动画的时间）；
   * 4.重复上面的步骤；
   * */
  playTimeLines(isReset, index, resolve, reject) {
    if (index >= 0 && index < this.timeLineMapList.length) {
      // 获取可执行时间轴配置
      const mapItem = this.timeLineMapList[index];

      // 生成对应执行时间轴
      const timeLine = this.generateTimeLine(mapItem /* , resolve, reject */);

      // 存入timeLines里面
      this.timeLines.push(timeLine);

      // 当前动画执行完成
      timeLine.finished
        .then(() => {
          // 删除超时处理
          if (this.finishTimeOut) clearTimeout(this.finishTimeOut);

          delete this.finishTimeOut;

          if (index === this.timeLineMapList.length - 1) {
            // 最后一个时间轴，动画设置执行完成
            if (isReset) this.reset(true);

            resolve?.('动画设置执行完成!');

            return;
          }

          if (index <= this.waitingIntervalSettings.length - 1) {
            // 还有等待节点，继续执行
            const delaySetting = this.waitingIntervalSettings[index]; // 获取等待节点的时间
            let timeout = this.timeoutList[index];

            if (timeout) clearTimeout(timeout);

            timeout = setTimeout(() => {
              this.playTimeLines(isReset, index + 1, resolve, reject);
            }, delaySetting.delay || 0);

            this.timeoutList[index] = timeout;
          }
        })
        .catch((error) => {
          if (this.finishTimeOut) clearTimeout(this.finishTimeOut);

          delete this.finishTimeOut;

          console.error('timeLine error', index);

          reject?.(error);
        });

      // 获取动画执行时间
      const duration = timeLine.delay + timeLine.duration + timeLine.endDelay + 500;
      timeLine.play();

      // v7.4 添加超时处理
      if (this.finishTimeOut) clearTimeout(this.finishTimeOut);

      this.finishTimeOut = setTimeout(() => {
        if (this.finishTimeOut) clearTimeout(this.finishTimeOut);

        delete this.finishTimeOut;

        reject?.('动画超时！');
      }, duration ?? 500);
    }
  }

  /**
   * 判断动画是否正在进行
   * 通过setTimeout将所有时间线连接起来，在上一个时间线动画全部结束之后finish.then（promise）
   * 等待一个等待动画时长，触发下一个时间线动画
   * 连接完后，触发第一个时间线
   * @param {boolean} isReset 判断动画结束之后，是否需要复位
   * @param {(val) => void} resolve 判断动画结束之后，回调
   * @param {(error: any) => void} reject 判断动画失败之后，回调
   */
  play(isReset, resolve, reject) {
    if (this.timeLineMapList.length <= 0) return;

    if (this.playState) this.pause();

    this.reset(false);

    /** @type {anime.AnimeTimelineInstance[]} */
    this.timeLines = [];
    this.playTimeLines(isReset, 0, resolve, reject);
    this.playState = true;
  }

  fastForwardToEnd() {
    this.realWorkTimelinesList.forEach((timeline) => {
      if (timeline.completed) return;

      /** @type {number} */
      const duration = timeline.delay + timeline.duration + timeline.endDelay + 500;

      timeline.pause();
      timeline.seek(duration);
      timeline.remove();
    });

    this.playState = false;
  }

  isAllAnimationFinishedYet() {
    if (this.playState === false) return true;

    return this.timeLines.every((timeline) => timeline.completed);
  }

  /**
   * 暂停所有时间线动画，并且清除所有等待的计时器
   * 现在没用到
   */
  pause() {
    // console.log('this.timeLines', this.timeLines);
    this.timeLines.forEach((timeLine) => {
      timeLine.pause();
    });
    this.timeoutList.forEach((timeout) => {
      if (timeout) {
        clearTimeout(timeout);

        timeout = null;
      }
    });
    this.playState = false;
  }

  /**
   * 对所有组件重置复位,现在可以不用
   * @param {*} isTransform
   */
  reset(isTransform) {
    for (const item of this.targetMap) {
      if (item.length === 2) {
        // console.log(item[0]);
        // v7.7.1删除无用css属性
        const styles = _.pickBy(item[1]);
        if (isTransform) {
          // 是否有动画transform
          $(item[0]).css({ transform: item[1].transform });
          delete styles.key;
          delete styles.transform;
          delete styles.translateX;
          delete styles.translateY;
          // delete styles.display;
          anime.set(item[0], {
            ...styles,
          });
        } else {
          $(item[0]).css({ transform: 'none' });
          delete styles.transform;
          delete styles.key;
          // delete styles.display;
          anime.set(item[0], {
            ...styles,
          });
        }
      }
    }
  }
}
