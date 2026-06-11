import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  clickEvent,
  doubleClickEvent,
  handleCreateAfterEvent,
  mouseEnterEvent, // v7.1鼠标移出事件
  mouseLeaveEvent, // v7.1鼠标移入事件
} from '@/EventHandlers/AnimateEvent';
import { syncTransformComp, formatPosition } from '@/utils/transformUtils';
import { getComponent, hasMouseEvent } from '@/utils/componentUtils';
import {
  getWidth,
  getHeight,
  setTransform,
  computedChangeValue,
} from '../../Platform/Components/dragger/utils/styleUtils';
import RenderByType from './CommonRender';

let dragEvt;
let initTransform;
let moveTransform = null;
let lastMouseDownTime = 0;

const GroupType = (props) => {
  // const EventEmitter = window.globalEventEmitter;
  const { item, zIndex, compCount, config, topRender } = props;
  const { eventSetings } = item;
  const positionArr = formatPosition(item.styles.transform);
  const [position, changePosition] = useState(positionArr);
  const groupRef = useRef();
  const childRenderCnt = useRef(0);

  const { dragStatus } = item.styles;
  const compKey = item.key;

  const childCount = useMemo(() => {
    let cnt = 0;
    item.childComList?.forEach((m) => {
      if (m.createFlag != false) {
        cnt += 1;
      }
    });
    return cnt;
  }, [item.childComList]);
  const groupCompCount = useCallback(() => {
    childRenderCnt.current += 1;
    compCount && compCount();
    if (childRenderCnt.current == childCount) {
      // 组件创建后事件触发
      handleCreateAfterEvent({ item, config: props.config });
    }
  }, [compCount]);

  const getCompCssTransform = (key) => {
    // const comp = getComponent(key, window.layerList);
    // let $el = $(`[data-key='${key}']`);
    // let matrix = $el.css('transform');
    // matrix = matrixToArr(matrix);
    const el = document.querySelector(`[data-key='${key}']`);
    const { transform } = el.style;
    let left = 0;
    let top = 0;
    const matches = transform.match(/[-+]?\d*\.\d+|\d+/g);
    if (matches?.length === 2) {
      left = matches[0] - 0;
      top = matches[1] - 0;
    }
    const matrix = [1, 0, 0, 1, left, top]; // 后续很多公共函数都用到这种格式
    return matrix;
  };
  const MouseHandlerEvent = {
    onMouseDown: (evt) => {
      if (evt.button == 2) return;
      if (!dragStatus) return;
      const curTime = Date.now();
      if (curTime - lastMouseDownTime < 60) {
        lastMouseDownTime = curTime;
        return;
      }
      lastMouseDownTime = curTime;
      moveTransform = null;
      // initTransform = getTransform(groupRef.current);
      initTransform = getCompCssTransform(compKey);
      groupRef.current.classList.add('dragger-current');
      // groupRef.current.dataset.width = parseInt(w);
      // groupRef.current.dataset.height = parseInt(h);
      groupRef.current.dataset.clientX = evt.clientX;
      groupRef.current.dataset.clientY = evt.clientY;
      groupRef.current.dataset.transform = initTransform;
      dragEvt = evt;
      dragEvt.el = evt.target;
      dragEvt.compKey = compKey;

      if (evt.target.nodeName == 'IMG') {
        evt.target.setAttribute('draggable', false);
      }
    },
    onMouseMove: (evt) => {},
    onMouseUp: (evt) => {},
    onMouseOut: (evt) => {},
  };
  useEffect(() => {
    const moveFn = (evt) => {
      if (!dragEvt || !dragStatus || dragEvt.compKey != compKey) {
        return;
      }
      let x = evt.clientX - groupRef.current.dataset.clientX;
      let y = evt.clientY - groupRef.current.dataset.clientY;
      // const zoom = window.zoom / 100;
      // v8.7.0预览页面的缩放由screenConfig的scaleX和scaleY控制，和zoom无关，需要更换计算因子。
      console.log('config', config);
      if (!Number.isNaN(config?.scaleX) && !Number.isNaN(config?.scaleY)) {
        x = Number.parseInt(x / config.scaleX);
        y = Number.parseInt(y / config.scaleY);
      }

      const elTransform = initTransform;
      const el = groupRef.current;
      const dragEvtKey = dragEvt.el.dataset.key;

      if (el && el.parentElement && el.parentElement.classList && !el.parentElement.classList.contains('rect-line')) {
        x = elTransform[4] + x;
        y = elTransform[5] + y;
        setTransform(el, x, y);
      } else {
        el.style.width = `${el.dataset.width - 0 + x}px`;
        el.style.height = `${el.dataset.height - 0 + y}px`;
      }

      const old = {
        width: el.dataset.width,
        height: el.dataset.height,
        // transform: groupRef.current.dataset.transform
        transform: initTransform,
      };
      const newItem = {
        width: getWidth(groupRef.current),
        height: getHeight(groupRef.current),
        // transform: getTransform(groupRef.current)
        transform: getCompCssTransform(el.dataset.key),
      };
      // 移动过程中矩形更改的信息
      const moveChangeRect = computedChangeValue(old, newItem);
      if (moveChangeRect.status && moveChangeRect.status == 'error') {
        return;
      }
      // console.log('moveChangeRect**', moveChangeRect);
      moveTransform = syncTransformComp(el.dataset.key, {
        x: moveChangeRect.x,
        y: moveChangeRect.y,
      });
      // moveHandler && moveHandler({ x: moveChangeRect.x, y: moveChangeRect.y });
    };
    const moveUpFn = (evt) => {
      if (!dragEvt || !dragStatus || !groupRef.current) {
        return;
      }
      const dragComp = getComponent(groupRef.current.dataset.key, window.layerList);
      !!moveTransform && (dragComp.styles.transform = moveTransform);
      groupRef.current.classList.remove('dragger-current');
      dragEvt = undefined;
    };
    document.addEventListener('mousemove', moveFn);
    document.addEventListener('mouseup', moveUpFn);
    return () => {
      document.removeEventListener('mousemove', moveFn);
      document.removeEventListener('mouseup', moveUpFn);
    };
  }, []);

  const transformStr = `translate(${position[0]}px, ${position[1]}px)`;
  const css = {
    ...item.styles,
    transform: transformStr,
    zIndex,
    position: 'absolute',
    filter: props.filter,
    // backdropFilter: `blur(${item.styles.backdropFilter}px)`,
    // overflow: item._attr && item._attr.overflow ? item._attr.overflow : 'visible',
    overflow: item?.styles?.overflow ?? item?._attr?.overflow ?? 'visible',
  };
  dragStatus && (css.cursor = 'move');

  // 是否走新的创建销毁逻辑
  const { createFlag, showFlag, groupInfoIndowVisible = false } = item;
  // TODO 兼容初始事件-显示隐藏
  if (showFlag == false && groupRef.current && groupInfoIndowVisible) {
    groupRef.current.style.display = 'none';
    // const curFiberKey = Object.keys(groupRef.current)?.find((item) => item.includes('__reactFibe'));
    // if (curFiberKey) {
    //   const curFiber = groupRef.current[curFiberKey];
    //   curFiber?.alternate?.memoizedProps?.style && (curFibern.alternate.memoizedProps.style.display = false);
    //   curFiber?.memoizedProps?.style && (curFiber.memoizedProps.style.display = 'block');
    // }
  }

  const extraStyles = {};
  if (hasMouseEvent(item) && config.mouseType === 1) {
    extraStyles.cursor = 'pointer';
  }

  return typeof createFlag === 'undefined' ? (
    <div
      ref={groupRef}
      {...MouseHandlerEvent}
      onClick={() => clickEvent(eventSetings, config, item)}
      onDoubleClick={() => doubleClickEvent(eventSetings, config, item)}
      onMouseEnter={() => mouseEnterEvent(eventSetings, config, item)}
      onMouseLeave={() => mouseLeaveEvent(eventSetings, config, item)}
      data-key={item.key}
      // 兼容地图初始化隐藏，不能在这里使用display:none
      style={{
        ...css,
        display: item.hideFlag && 'none',
        ...extraStyles,
        zIndex: item.styles.isTop ? item.styles.zIndex : zIndex,
      }}
      className='perf-comp'
    >
      {item.childComList.map((child, index) => {
        return (
          <RenderByType
            // {...props}
            // filter={''}
            key={child.key}
            item={child}
            compCount={groupCompCount}
            index={index}
            config={config}
            topRender={topRender}
          />
        );
      })}
    </div>
  ) : (
    createFlag && (
      <div
        ref={groupRef}
        {...MouseHandlerEvent}
        onClick={() => clickEvent(eventSetings, config, item)}
        onDoubleClick={() => doubleClickEvent(eventSetings, config, item)}
        onMouseEnter={() => mouseEnterEvent(eventSetings, config, item)}
        onMouseLeave={() => mouseLeaveEvent(eventSetings, config, item)}
        data-key={item.key}
        // 兼容地图初始化隐藏，不能在这里使用display:none
        style={{
          ...css,
          display: !showFlag && 'none',
          ...extraStyles,
          zIndex: topRender ? item.styles.zIndex : zIndex,
        }}
        className='perf-comp'
      >
        {item.childComList.map((child, index) => {
          return (
            <RenderByType
              // {...props}
              // filter={''}
              key={child.key}
              item={child}
              compCount={groupCompCount}
              index={index}
              config={config}
              topRender={topRender}
            />
          );
        })}
      </div>
    )
  );
};

export default GroupType;
