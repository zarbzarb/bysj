import React, { useState, useRef, useLayoutEffect, useCallback, memo } from 'react';
import './index.less';
import $ from 'jquery';
import { useStore } from '@/hooks';
import { addListenDomStyle, destroyObserver } from './ObserverDom';
import { getWidth, getHeight, getTransform } from '../utils/styleUtils';

// let state,
let dragEvt,
  transform,
  changeRect = {
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  };

export const BorderLine = memo((props) => {
  const { rect, parent, disabled, dragEnd, dragHandler, item = {} } = props;

  const { editorStore: ComStore } = useStore();
  const stateRef = useRef();
  const ref = useRef();
  const leftLineRef = useRef();
  // const rightLineRef = useRef();
  const topLineRef = useRef();
  const positionRef = useRef();
  const consoleRef = useRef(); // 控制台
  let consoleWidth, consoleHeight, l, t;
  const [count, setCount] = useState(0);
  const forceUpdate = () => {
    setCount(count + 1);
  };
  const HandlerEvent = {
    onMouseDown: (evt) => {
      if (disabled) return;
      changeRect = {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
      };
      dragEvt = evt;
      dragEvt.compKey = evt.target.dataset.linekey;

      transform = getTransform(parent.current);
      if (dragEvt.target.classList.contains('dragger-line')) {
        dragEvt.target.dataset.width = getWidth(parent.current);
        dragEvt.target.dataset.height = getHeight(parent.current);
      }
      stateRef.current = {
        type: evt.target.dataset.type,
        width: getWidth(parent.current),
        height: getHeight(parent.current),
        preTransform: transform,
        client: {
          x: evt.clientX,
          y: evt.clientY,
        },
      };
      // console.log('stateRef.current2', stateRef.current, 'item.key', item.key);
      evt.target.classList.add('dragger-current');
    },
    onMouseUp: (evt) => {
      if (disabled) return;
      evt.target.classList.remove('dragger-current');
      dragEvt = undefined;
      stateRef.current = undefined;
      if (dragEnd)
        dragEnd({
          transform: parent.current.style.transform,
          width: getWidth(parent.current),
          height: getHeight(parent.current),
        });
      forceUpdate();
    },
  };

  const computedLine = useCallback(() => {
    // let wrap = $('[data-type="console"]');
    let compAttr, compPos, verticalPos;
    if (item.instance) {
      compAttr = item.instance.compAttr;
      compPos = compAttr.compPos;
      verticalPos = compAttr.verticalPos;
    } else {
      compPos = 'left';
      verticalPos = 'top';
    }

    const el = parent.current;
    const trans = getTransform(el);
    let str = `${trans[4]},${trans[5]}`;

    if (!consoleRef.current) return;

    const changeElWid = item.styles ? Number.parseInt(item.styles.width) : 0;
    const changeElHei = item.styles ? Number.parseInt(item.styles.height) : 0;

    if (leftLineRef && leftLineRef.current) {
      const parentDragEl = parent.current.parentElement.parentElement;
      let parentTransform = [0, 0, 0, 0, 0, 0];
      if (parentDragEl && parentDragEl.classList.contains('drag-container')) {
        parentTransform = getTransform(parentDragEl);
      }

      if (compPos === 'right') {
        const strCss = `width:${
          parentTransform[4] + trans[4] + l + changeElWid + 100
        }px;transform: translateX(calc( -100% + ${changeElWid + 100}px ));`;
        leftLineRef.current.style.cssText += strCss;
        topLineRef.current.style.left = 'calc(100% - 1px)';
      } else {
        const strCss = `width: ${parentTransform[4] + trans[4] + l}px;transform:;`;
        // 使用 cssText 减少重排渲染次数
        leftLineRef.current.style.cssText += strCss;
        topLineRef.current.style.left = '';
      }

      if (verticalPos === 'bottom') {
        const strCss = `height: ${
          parentTransform[4] + trans[5] + t + changeElHei + 100
        }px;transform: translateY(calc(-100% + ${changeElHei + 100}px));`;
        topLineRef.current.style.cssText += strCss;
        leftLineRef.current.style.top = 'calc(100% - 1px)';
      } else {
        const strCss = `height: ${parentTransform[4] + trans[5] + t}px;transform:;`;
        topLineRef.current.style.cssText += strCss;
        leftLineRef.current.style.top = '';
      }

      if (compPos === 'right') {
        // 使用 cssText 减少重排渲染次数
        positionRef.current.style.cssText = `${positionRef.current.style.cssText}top:;left: calc(100% + 6px);transform:translate(0, -100%);`;
        // positionRef.current.style.top = '';
        // positionRef.current.style.left = 'calc(100% + 6px)';
        // positionRef.current.style.transform = 'translate(0, -100%)';
        str = `${consoleWidth - trans[4] - Number.parseInt(item.styles.width)},${trans[5]}`;
      } else {
        positionRef.current.style.cssText = `${positionRef.current.style.cssText}top:;transform:;left:;`;
        if (verticalPos === 'bottom') {
          positionRef.current.style.cssText = `${positionRef.current.style.cssText}top:calc(100% + 6px);transform:translate(-100%, 0);`;
          str = `${trans[4]},${consoleHeight - trans[5] - Number.parseInt(item.styles.height)}`;
        }
      }

      positionRef.current.textContent = str; // 性能优化：innerHTML 换成 textContent
    }
  }, [consoleHeight, consoleWidth, item.instance, item.styles, l, parent, t]);

  useLayoutEffect(() => {
    if (!consoleRef.current) {
      consoleRef.current = $('[data-type="console"]').get(0);
      consoleWidth = consoleRef.current.clientWidth;
      consoleHeight = consoleRef.current.clientHeight;
      l = consoleRef.current.offsetLeft;
      t = consoleRef.current.offsetTop;
    }
    let tag = null;
    // 1. 只有被操作组件添加DOM监听
    if (ComStore.changeKeys.includes(item.key)) {
      // 2. 给DOM监听回调函数添加节流
      // let debounce = _.debounce((list) => {
      //   console.log('computedLine');
      //   computedLine();
      // }, 5);
      // tag = addListenDomStyle(parent.current, debounce);
      /** *************** 可以添加节流函数，略微有些影响拖动过程中标尺线显示的连贯性，去掉节流后对拖动体验影响不大 ************** */
      tag = addListenDomStyle(parent.current, () => computedLine());
    }

    // 默认计算当前图层组件的标尺线位置
    computedLine();

    return () => {
      if (tag) {
        // 3. 销毁DOM监听
        destroyObserver(tag);
      }
    };
  }, [parent, ComStore.changeKeys]);

  useLayoutEffect(() => {
    const mouseUpFn = (evt) => {
      const { classList } = evt.target;
      if (classList.contains('dragger-line')) {
        dragEvt = undefined;
        return;
      }
      if (disabled) return;
      if (dragEvt && dragEvt.target) {
        classList.remove('dragger-current');
        dragEvt = undefined;
        stateRef.current = undefined;
        if (dragEnd)
          dragEnd({
            transform: parent.current.style.transform,
            width: getWidth(parent.current),
            height: getHeight(parent.current),
          });
      } else if (!classList.contains('dragger-line')) {
        dragEvt = undefined;
      }
    };
    const mouseMoveFn = (evt) => {
      if (disabled || !dragEvt || !stateRef.current) return;

      const { type, preTransform: preTrans, width, height, client } = stateRef.current || {};

      let MoveX = evt.clientX - client.x;
      let MoveY = evt.clientY - client.y;

      // console.log(
      //   'stateRef.current',
      //   stateRef.current,
      //   'item.key',
      //   item.key,
      //   'type',
      //   type,
      //   'MoveX',
      //   MoveX,
      //   'MoveY',
      //   MoveY,
      // );

      const zoom = window.zoom / 100;
      if (!Number.isNaN(zoom)) {
        MoveX /= zoom;
        MoveY /= zoom;

        MoveX = Number.parseInt(MoveX);
        MoveY = Number.parseInt(MoveY);
      }

      const top = preTrans[5] + MoveY;
      const left = preTrans[4] + MoveX;

      const controlPointTopLeftLeft = preTrans[4] + MoveX;
      const controlPointTopLeftTop = preTrans[5] + MoveY;
      const controlPointTopRightTop = preTrans[5] + MoveY;
      const controlPointBottomLeftLeft = preTrans[4] + MoveX;
      changeRect = {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
      };
      switch (type) {
        case 'top':
        case 'control-point-top': {
          parent.current.style.transform = `translate(${preTrans[4]}px,${top}px)`;
          parent.current.style.height = `${height - MoveY}px`;
          changeRect.height = MoveY;
          changeRect.y = MoveY;
          break;
        }
        case 'left':
        case 'control-point-left': {
          parent.current.style.transform = `translate(${left}px,${preTrans[5]}px)`;
          parent.current.style.width = `${width - MoveX}px`;
          changeRect.width = MoveX;
          changeRect.x = MoveX;
          break;
        }
        case 'bottom':
        case 'control-point-bottom': {
          parent.current.style.height = `${height + MoveY}px`;
          changeRect.height = MoveY;
          break;
        }
        case 'right':
        case 'control-point-right': {
          parent.current.style.width = `${width - 0 + MoveX}px`;
          changeRect.width = MoveX;
          break;
        }
        case 'control-point-top-left': {
          parent.current.style.transform = `translate(${controlPointTopLeftLeft}px,${controlPointTopLeftTop}px)`;
          parent.current.style.width = `${width - MoveX}px`;
          parent.current.style.height = `${height - MoveY}px`;

          changeRect.width = MoveX;
          changeRect.x = MoveX;
          changeRect.height = MoveY;
          changeRect.y = MoveY;
          break;
        }
        case 'control-point-bottom-right': {
          parent.current.style.height = `${height + MoveY}px`;
          parent.current.style.width = `${width - 0 + MoveX}px`;
          changeRect.height = MoveY;
          changeRect.width = MoveX;
          break;
        }
        case 'control-point-top-right': {
          parent.current.style.transform = `translate(${preTrans[4]}px,${controlPointTopRightTop}px)`;
          parent.current.style.height = `${height - MoveY}px`;
          parent.current.style.width = `${width - 0 + MoveX}px`;
          changeRect.height = MoveY;
          changeRect.width = MoveX;
          changeRect.y = MoveY;
          break;
        }
        case 'control-point-bottom-left': {
          parent.current.style.transform = `translate(${controlPointBottomLeftLeft}px,${preTrans[5]}px)`;
          parent.current.style.width = `${width - MoveX}px`;
          parent.current.style.height = `${height + MoveY}px`;
          changeRect.width = MoveX;
          changeRect.height = MoveY;
          changeRect.x = MoveX;
          break;
        }
        default:
      }
      changeRect.type = type;
      if (dragHandler) dragHandler(changeRect);
    };

    if (!disabled) {
      document.addEventListener('mouseup', mouseUpFn);
      document.addEventListener('mousemove', mouseMoveFn);
    }

    return () => {
      document.removeEventListener('mouseup', mouseUpFn);
      document.removeEventListener('mousemove', mouseMoveFn);
    };
  }, [disabled, dragEnd, dragHandler, parent]);

  return (
    <div ref={ref} className='rect-line'>
      <div className='caliper-line '>
        <div ref={leftLineRef} className='caliper-line-left' />
        <div ref={topLineRef} className='caliper-line-top' />
        <div ref={positionRef} className='caliper-line-account' />
      </div>

      <div
        data-type='top'
        data-linekey={item.key}
        className='dragger-line top'
        style={{ width: rect.width }}
        {...HandlerEvent}
      />
      <div
        data-type='right'
        data-linekey={item.key}
        className='dragger-line right'
        style={{ height: rect.height }}
        {...HandlerEvent}
      />
      <div
        data-type='bottom'
        data-linekey={item.key}
        className='dragger-line bottom'
        style={{ width: rect.width }}
        {...HandlerEvent}
      />

      <div
        data-type='left'
        data-linekey={item.key}
        className='dragger-line left'
        style={{ height: rect.height }}
        {...HandlerEvent}
      />

      {/* v7.7 组件缩放优化 */}
      <div
        data-type='control-point-top'
        className='dragger-line control-point-top'
        style={{ height: rect.height }}
        {...HandlerEvent}
      />
      <div
        data-type='control-point-bottom'
        className='dragger-line control-point-bottom'
        style={{ height: rect.height }}
        {...HandlerEvent}
      />
      <div
        data-type='control-point-left'
        className='dragger-line control-point-left'
        style={{ height: rect.height }}
        {...HandlerEvent}
      />
      <div
        data-type='control-point-right'
        className='dragger-line control-point-right'
        style={{ height: rect.height }}
        {...HandlerEvent}
      />
      <div
        data-type='control-point-top-left'
        className='dragger-line control-point-top-left'
        style={{ height: rect.height }}
        {...HandlerEvent}
      />
      <div
        data-type='control-point-bottom-right'
        className='dragger-line control-point-bottom-right'
        style={{ height: rect.height }}
        {...HandlerEvent}
      />
      <div
        data-type='control-point-top-right'
        className='dragger-line control-point-top-right'
        style={{ height: rect.height }}
        {...HandlerEvent}
      />
      <div
        data-type='control-point-bottom-left'
        className='dragger-line control-point-bottom-left'
        style={{ height: rect.height }}
        {...HandlerEvent}
      />
    </div>
  );
});
