import React, { useEffect, useCallback, useContext } from 'react';
import ScreenConfigContext from './ScreenConfigContext';
import { GetQueryString } from '@/utils/BrowserUtils';
export default (props) => {
  const { children, compList, type, customSdkSets, isMobile } = props;
  const screenConfigRef = useContext(ScreenConfigContext);

  const formatLinearGradient = (color) => {
    const screenBackground = color || 'to bottom-#0d1117-#0d1117';
    const background = screenBackground.split('-').join(',');
    return `linear-gradient(${background})`;
  };

  let resizeTimer = null;

  const onResize = useCallback(() => {
    if (screenConfigRef.current.adaptionId) return;
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      initStyle(screenConfigRef.current);
      clearTimeout(resizeTimer);
    }, 100);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const initStyle = useCallback(
    (screenConfig) => {
      if (screenConfig.baseUrl == undefined) {
        return <div />;
      }
      const css = {
        width: screenConfig.width,
        height: screenConfig.height,
      };
      const cardUe5 = GetQueryString('type') === 'card' && GetQueryString('share') === 'true';
      const cardScale = {};
      const parentWraperId = customSdkSets?.parentWraperId;
      const screenWidth = parentWraperId
        ? document.getElementById(`${parentWraperId}`).clientWidth
        : document.body.clientWidth;
      const screenHeight = parentWraperId
        ? document.getElementById(`${parentWraperId}`).clientHeight
        : document.body.clientHeight;

      if (screenConfig.adaptionId) {
        // 卡片自适应父容器
        if (Array.isArray(compList) && compList.length > 0) {
          const layerChild = compList[0];
          // let cardCssStyle = layerChild.cssStyle || layerChild.styles;
          // 适配布局设计器
          const cardCssStyle = layerChild.styles || layerChild.cssStyle;
          if (layerChild.hasOwnProperty('shapeCss')) {
            layerChild.shapeCss.transform = 'translate(0px, 0px)';
          }
          if (layerChild.hasOwnProperty('styles')) {
            layerChild.styles.transform = 'translate(0px, 0px)';
          }
          const w = cardCssStyle.width.replace('px', '');
          const h = cardCssStyle.height.replace('px', '');
          const wraperEle = document.getElementById(screenConfig.adaptionId); // 卡片SDK获取容器
          const wraperWidth = wraperEle.clientWidth;
          const wraperHeight = wraperEle.clientHeight;
          const xScale = (wraperWidth / w).toFixed(4) / 1;
          const yScale = (wraperHeight / h).toFixed(4) / 1;
          const scale = screenConfig.adapteByHeight ? yScale : xScale;
          screenConfigRef.current.scaleX = scale;
          screenConfigRef.current.scaleY = scale;
          cardScale.transformOrigin = 'left top';
          cardScale.transform = `scaleX(${scale}) scaleY(${scale})`;
          css.width = w * scale;
          css.height = h * scale;
        }
      } else {
        if (screenConfig.scale == 'scale') {
          // 全屏铺满
          const w = screenConfig.width;
          const h = screenConfig.height;
          const xScale = (screenWidth / w).toFixed(4) / 1;
          const yScale = (screenHeight / h).toFixed(4) / 1;
          css.transformOrigin = 'left top';
          if (type !== 'card') {
            css.transform = `scaleX(${xScale}) scaleY(${yScale})`;
          }
          // v7.4 防止window.screenConfig覆盖
          screenConfigRef.current.scaleX = xScale;
          screenConfigRef.current.scaleY = yScale;
        } else if (screenConfig.scale == 'scaleWidth') {
          // 等比缩放宽度铺满
          const w = screenConfig.width;
          const h = screenConfig.height;
          const xScale = (screenWidth / w).toFixed(4) / 1;
          css.transformOrigin = 'left top';
          // css.transform = `scaleX(${xScale}) scaleY(${xScale})`;
          css.transform = `scaleX(${xScale})`;
          // css.height = xScale * h;

          const rootDOM = document.querySelector('#preApp');
          if (rootDOM) {
            rootDOM.style.width = '100%';
            rootDOM.style.height = '100%';

            if (isMobile) {
              rootDOM.style.overflowX = 'hidden';
              rootDOM.style.overflowY = 'auto';
            } else {
              rootDOM.style.overflowY = 'hidden';
            }
          }
          screenConfigRef.current.scaleX = xScale;
          screenConfigRef.current.scaleY = 1;
        } else if (screenConfig.scale == 'scaleHeight') {
          // 等比缩放高度铺满
          const w = screenConfig.width;
          const h = screenConfig.height;
          const yScale = (screenHeight / h).toFixed(4) / 1;

          css.transformOrigin = 'left top';
          // css.transform = `scaleX(${yScale}) scaleY(${yScale})`;
          css.transform = `scaleY(${yScale})`;
          css.width = yScale * w;

          const rootDOM = document.querySelector('#preApp');
          if (rootDOM) {
            rootDOM.style.width = '100%';
            rootDOM.style.height = '100%';
            rootDOM.style.overflowY = 'hidden';
          }

          // $('#preApp').css({
          //   width: '100%',
          //   height: '100%',
          //   overflowY: 'hidden'
          // });
          screenConfigRef.current.scaleY = yScale;
          screenConfigRef.current.scaleX = 1;
        } else {
          // 原尺寸
          screenConfigRef.current.scaleY = 1; // 这两个主要用在下拉框的缩放，现在没用用到
          screenConfigRef.current.scaleX = 1; // 这两个主要用在下拉框的缩放，现在没用用到
          css.transformOrigin = ''; // 切回到原尺寸
          css.transform = ''; // 切回到原尺寸
        }

        if (type === 'card') {
          css.width = 1920;
          css.height = 1080;
        }
        if (cardUe5) {
          css.width = screenConfig.width;
          css.height = screenConfig.height;
        }
      }
      css.position = 'relative';
      !screenConfig.adaptionId &&
        type !== 'page' &&
        !cardUe5 &&
        (css.background = formatLinearGradient(screenConfig.screenBackground));
      css.overflow = 'hidden';
      const { renderWrapperId } = screenConfig;
      const screenWrapEle = document.querySelectorAll('.screen-wrap');
      if (screenWrapEle.length > 1 && renderWrapperId) {
        const childEle = document.getElementById(`screen-${renderWrapperId}`);
        for (const key in cardScale) {
          const value = cardScale[key];
          if (key === 'width') {
            childEle.style[key] = `${value}px`;
          } else if (key === 'height') {
            childEle.style[key] = `${value}px`;
          } else {
            childEle.style[key] = value;
          }
        }
        const { parentElement } = childEle;
        // 应用因为有背景图，已经单独处理过，在此处需取出已经处理好的background
        if (type === 'page') {
          css.background = parentElement.style.background;
        }
        for (const key in css) {
          const value = css[key];
          if (key === 'width' || key === 'height') {
            parentElement.style[key] = `${value}px`;
          } else {
            parentElement.style[key] = value;
          }
        }
      } else {
        // 兼容旧数据
        if (screenWrapEle.length > 0) {
          const parentElement = screenWrapEle[0];
          if (type === 'page') {
            css.background = parentElement.style.background;
          }
          for (const key in css) {
            const value = css[key];
            if (key === 'width' || key === 'height') {
              parentElement.style[key] = `${value}px`;
            } else {
              parentElement.style[key] = value;
            }
          }
          if (type === 'card') {
            const childEle = parentElement.firstChild;
            for (const key in cardScale) {
              const value = cardScale[key];
              if (key === 'width') {
                childEle.style[key] = `${value}px`;
              } else if (key === 'height') {
                childEle.style[key] = `${value}px`;
              } else {
                childEle.style[key] = value;
              }
            }
          }
        }
      }
      document.body.style.overflow = screenConfig.scale == 'scale' && !screenConfig.isPC ? 'hidden' : 'auto';
    },
    [compList, customSdkSets, type],
  );

  useEffect(() => {
    initStyle(screenConfigRef.current);
  }, [initStyle]);

  return <>{children}</>; // 减少一个层级
};
