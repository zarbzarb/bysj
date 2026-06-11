import anime from 'animejs/lib/anime.es.js';
import { getTransformByMatrix } from '@/utils/compute';
import DataI from '@/utils/global-api';
import $ from 'jquery';
import _ from 'lodash';
import swing from './components/swing';
import flash from './components/flash';
import bounceIn from './components/bounceIn';
import bounceOut from './components/bounceOut';
import moveFadeIn from './components/moveFadeIn';
import moveFadeOut from './components/moveFadeOut';
import backIn from './components/backIn';
import backOut from './components/backOut';
import zoomInMove from './components/zoomInMove';
import zoomOutMove from './components/zoomOutMove';
import rollIn from './components/rollIn';
import rollOut from './components/rollOut';
import flipInX from './components/flipInX';
import flipOutX from './components/flipOutX';
import flipInY from './components/flipInY';
import flipOutY from './components/flipOutY';
import lightSpeedIn from './components/lightSpeedIn';
import lightSpeedOut from './components/lightSpeedOut';

const animationComponents = {
  swing,
  flash,
  bounceIn,
  bounceOut,
  moveFadeIn,
  moveFadeOut,
  backIn,
  backOut,
  zoomInMove,
  zoomOutMove,
  rollIn,
  rollOut,
  flipInX,
  flipOutX,
  flipInY,
  flipOutY,
  lightSpeedIn,
  lightSpeedOut,
};
const initAnimation = (animeObj, steps, initStyle, key, isPc) => {
  if (steps.length > 0) {
    const currentStep = steps[0];
    const computeStep = computePos(
      key,
      {
        translateX: (currentStep.stopPos && currentStep.stopPos.x) || 0,
        translateY: (currentStep.stopPos && currentStep.stopPos.y) || 0,
      },
      isPc,
    );
    currentStep.stopPos = {
      x: computeStep.translateX,
      y: computeStep.translateY,
    };
    const nextStyle = currentStep.hasEnd
      ? {
          translateX: currentStep.stopPos.x,
          translateY: currentStep.stopPos.y,
        }
      : initStyle;
    if (!currentStep.animationType) return false;
    const currentAnimeObj = animeObj.add(
      {
        ...animationComponents[currentStep.animationType](currentStep, initStyle),
        // delay: currentStep.delay * 1000
      },
      // 动画时间轴上每个动画的延迟
      currentStep.delay * 1000,
    );
    steps.splice(0, 1);
    initAnimation(currentAnimeObj, steps, nextStyle, key, isPc);
  }
};

// const removeAnimation = (targets) => {
//   anime.remove(targets);
// };

const computePos = (key, pos, isPC) => {
  let screenWidth, screenHeight, currentComp;
  let compAttr = {}; // Sonar init
  let translateX, translateY;
  let compWidth, compHeight;
  if (DataI.isConfigPage()) {
    // 控制台编程
    screenWidth = $('[data-type=console]').width();
    screenHeight = $('[data-type=console]').height();
    currentComp = DataI.getComponentByKey(key);
    if (currentComp.instance) {
      isPC = true;
      compAttr = currentComp.instance.compAttr;
      compWidth = $(currentComp.instance.container).width();
      compHeight = $(currentComp.instance.container).height();
    }
  } else {
    // sdk或预览环境
    screenWidth = $('.screen-wrap').width();
    screenHeight = $('.screen-wrap').height();
    currentComp = window.comList.get(key);
    if (currentComp) {
      compAttr = currentComp._attr;

      if (currentComp.initSize) {
        compWidth = currentComp.initSize.width;
        compHeight = currentComp.initSize.height;
      } else if (currentComp.styles) {
        compWidth = currentComp.styles.width;
        compWidth = currentComp.styles.height;
      } else if (currentComp.instance) {
        compWidth = $(currentComp.instance.container).width();
        compWidth = $(currentComp.instance.container).height();
      } else {
        compWidth = $(currentComp._selector).width();
        compWidth = $(currentComp._selector).height();
      }
    }
  }
  const styleObj = _.cloneDeep(pos);
  if (isPC && compAttr && !compAttr.alignCenter && compAttr.compPos == 'right') {
    translateX = Number.parseInt(screenWidth - compWidth - styleObj.translateX);
    styleObj.translateX = translateX;
    styleObj.translateY = Number.parseInt(styleObj.translateY);
  } else if (isPC && compAttr && compAttr.alignCenter) {
    translateX = Number.parseInt(screenWidth / 2 - compWidth / 2);
    styleObj.translateX = translateX;
    if (compAttr.verticalPos == 'bottom') {
      translateY = screenHeight - compHeight - styleObj.translateY;
      styleObj.translateY = translateY;
    }
  }

  return styleObj;
};

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

export const triggerAnimation = (animationInfo, animationSubInfo, isPc) => {
  const currentAnimationInfo = JSON.parse(animationInfo);
  const animationType = animationSubInfo.animtationType;
  const { key } = animationSubInfo;
  const targets = compatible(key);
  const steps = currentAnimationInfo.settings.animationStep;
  const initAnimationName = steps[0].animationType;

  const initStyle = computePos(
    key,
    {
      translateX: currentAnimationInfo.settings.startPosition.x,
      translateY: currentAnimationInfo.settings.startPosition.y,
    },
    isPc,
  );

  if (initAnimationName == 'moveFadeIn') {
    initStyle.opacity = 0;
  }
  if (initAnimationName == 'moveFadeOut') {
    initStyle.opacity = 1;
  }
  const animeFunc = anime;

  const transformObj = getTransformByMatrix($(targets).css('transform'));
  const currentStyle = {
    translateX: transformObj.x,
    translateY: transformObj.y,
    opacity: $(targets).css('opacity'),
  };
  $(targets).css({ transform: '' }); // 为了transform兼容
  animeFunc.set(targets, initStyle);
  animeFunc.remove(targets);
  const animeObj = animeFunc.timeline({
    targets,
    loop: animationType == 'animateLoop',
    autoplay: false,
  });
  initAnimation(animeObj, steps, initStyle, key, isPc);
  animeObj.set(targets, currentStyle);
  animeObj.start = () => {
    if (animationSubInfo && animationSubInfo.animtationType != 'animateOut') {
      animeFunc.set(targets, { zIndex: animationSubInfo.zIndex });
    }
    // 处理配置多个动画只生效最后一个问题
    // removeAnimation(targets);
    animeObj.restart();
  };
  // 重新回到初始状态
  animeObj.resetStartPosition = () => {
    animeObj.set(targets, currentStyle);
  };
  animeObj.finished.then(triggerCb);
  function triggerCb() {
    setTimeout(() => {
      animeObj.finished.then(triggerCb);
      if (animationSubInfo && animationSubInfo.animtationType == 'animateOut') {
        animeFunc.set(targets, { zIndex: animationSubInfo.zIndex });
      }
    });
  }
  return animeObj;
};

export const stopAnimation = (animeFunc) => {
  if (animeFunc) {
    animeFunc.pause();
  }
};

export const addAnimate = (item, config, isPc) => {
  const animtationType = config.actionType;

  const enterZIndex = $(`[data-key="${item.key}"]`).css('zIndex');
  const leaveZIndex = 0;

  const animationObj =
    animtationType == 'animateOut'
      ? triggerAnimation(
          JSON.stringify(config),
          {
            animtationType,
            zIndex: leaveZIndex,
            key: item.key,
          },
          isPc,
        )
      : triggerAnimation(
          JSON.stringify(config),
          {
            animtationType,
            zIndex: enterZIndex,
            key: item.key,
          },
          isPc,
        );

  return animationObj;
};
