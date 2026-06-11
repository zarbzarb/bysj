/**
 * 用于在控制台上，非组件位置点击拖拽时，生成框选容器
 */
import $ from 'jquery';
import { formatPosition } from '@/utils/analysis';

let prePosition;
let scrollRect;

/**
 * 计算所有组件边框
 * @param {*} store 编辑数据管理
 */
const computedRect = (store) => {
  const comList = store.getCompList();
  const { screenConfig } = window;
  comList.forEach((vl) => {
    const position = formatPosition(vl.styles.transform);
    if (vl.instance && vl.instance.compAttr.alignCenter) {
      position[0] = (screenConfig.width - Number.parseInt(vl.styles.width)) / 2;
    }
    vl.offsetPosition = {
      x1: position[0],
      x2: position[0] + Number.parseInt(vl.styles.width),
      y1: position[1],
      y2: position[1] + Number.parseInt(vl.styles.height),
    };
  });
};

const isWrapperKeys = (rect, screenConfig, store) => {
  // 只获取当前选中图层组件,计算当前图层有哪些组件被鼠标框选中
  const comList = store.getCompList(true);
  const wrapperKeys = comList
    .filter((vl) => {
      if (vl.comLock) return false;

      const compAttr = vl.instance ? vl.instance.compAttr : vl.styles;
      const positionRect = vl.offsetPosition;

      let x1, x2, y1, y2;

      if (vl.comInvisible) return false;

      if (screenConfig.isPC) {
        if (compAttr.compPos === 'right') {
          x1 = screenConfig.width - positionRect.x1;
          x2 = screenConfig.height - positionRect.x2;
        } else {
          x1 = positionRect.x1;
          x2 = positionRect.x2;
        }
        if (compAttr.verticalPos === 'bottom') {
          y1 = screenConfig.height - positionRect.y1;
          y2 = screenConfig.height - positionRect.y2;
        } else {
          y1 = positionRect.y1;
          y2 = positionRect.y2;
        }
      } else {
        x1 = positionRect.x1;
        x2 = positionRect.x2;
        y1 = positionRect.y1;
        y2 = positionRect.y2;
      }

      if (rect.x2 < x1) {
        return false;
      }
      if (rect.x1 > x2) {
        return false;
      }
      if (rect.y2 < y1) {
        return false;
      }
      if (rect.y1 > y2) {
        return false;
      }
      return true;
    })
    .map((vl) => vl.key);

  return wrapperKeys;
};

export const ConsoleMouseDown = (evt, store) => {
  if (evt.button === 2) {
    prePosition = undefined;
    return;
  }

  const $el = $(evt.target);
  const parent = $el.parents('.drag-container');
  const isClickedBlankArea = !$el.hasClass('drag-container') && parent.length === 0;
  // v6.18新增点击空白区域 不需要了
  // store.setClickedBlankArea(isClickedBlankArea);
  if (isClickedBlankArea) {
    const zoom = store.zoom / 100;
    const parentOffset = $('[data-type=console]').offset();
    if (parentOffset === undefined) return;
    console.log('ConsoleMouseDown***********zoom', zoom);
    // 点击空白区域
    prePosition = {
      x: Math.round((evt.clientX - parentOffset.left) / zoom),
      y: Math.round((evt.clientY - parentOffset.top) / zoom),
      // x: Math.round(evt.clientX - parentOffset.left),
      // y: Math.round(evt.clientY - parentOffset.top),
    };
    // console.log('ConsoleMouseDown***********prePosition', prePosition);
    if (store.changeKeys.length > 0) {
      store.setChangeKeys([]);
    }
    if (store.dynamicPanelEditComp) {
      store.setDynamicPanelEditComp('');
    }
    // store.changeKeys.length > 0 && store.setChangeKeys([]);
    // store.dynamicPanelEditComp && store.setDynamicPanelEditComp('');
    // store.responsiveCompChangeKey && store.changeResponsiveCompEditing('');
    computedRect(store);
  }
};

export const ConsoleMove = (evt, store) => {
  /*
    x,y 拖拽选框的鼠标落点
    width,height 拖拽选框的宽高
    zoom 画布的缩放，默认为100
  */
  if (store.isSpaceDown) {
    return;
  }

  const zoom = store.zoom / 100;
  // console.log('ConsoleMove***********prePosition', prePosition);
  if (prePosition === undefined) return;
  const parentOffset = $('[data-type=console]').offset();
  if (parentOffset === undefined) return;
  // console.log('ConsoleMove***********parentOffset', parentOffset);
  const currentLeft = Math.round((evt.clientX - parentOffset.left) / zoom);
  const currentTop = Math.round((evt.clientY - parentOffset.top) / zoom);
  // const width = Math.abs(currentLeft - prePosition.x) / zoom;
  // const height = Math.abs(currentTop - prePosition.y) / zoom;
  const width = Math.abs(currentLeft - prePosition.x);
  const height = Math.abs(currentTop - prePosition.y);
  const x = prePosition.x > currentLeft ? currentLeft : prePosition.x;
  const y = prePosition.y > currentTop ? currentTop : prePosition.y;
  const transform = `translate(${x}px, ${y}px)`;
  $('.select-box').show();
  $('.select-box').css({
    width,
    height,
    transform,
  });
  const boxRect = {
    x1: x,
    y1: y,
    x2: x + width,
    y2: y + height,
  };

  store.setChangeKeys(isWrapperKeys(boxRect, window.screenConfig, store));
};

export const ConsoleMouseUp = (evt) => {
  prePosition = undefined;
  $('.select-box').hide();
  // const $el = $(evt.target);
};
