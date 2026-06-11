import React, { useLayoutEffect, useEffect, useRef, useState, useCallback, memo } from 'react';
import { LockOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react';
import classnames from 'classnames';
// import { GetQueryString } from '@/utils/BrowserUtils';
import './index.less';
import { formatPosition, computedCompRect } from '@/utils/analysis';
import { haveChildByKey } from '@/Computed/Comp/ConditionComputed';
import { useStore } from '@/hooks';
import mouse from '@/assets/newIcon/editMap/mouse.png';
import direction from '@/assets/newIcon/editMap/direction.png';
import mouseWheel from '@/assets/newIcon/editMap/mouse_wheel.png';
import mouseRight from '@/assets/newIcon/editMap/mouse_right.png';
import mouseLeft from '@/assets/newIcon/editMap/mouse_left.png';
import _ from 'lodash';
import { BorderLine } from './components/BorderLine';
import { getWidth, getHeight, getTransform, setTransform, computedChangeValue } from './utils/styleUtils';

let w;
let h;
let dragEvt;
let transform;

const Dragger = (props) => {
  const {
    children,
    moveEnd,
    moveAble,
    dragEnd,
    doubleClick,
    dragHandler,
    moveHandler,
    clickHandler,
    offsetParent,
    domRef,
    item,
    filter,
    ...otherProps
  } = props;
  const { editorStore: store, pageTabsStore } = useStore();
  const { isEditMap } = store;
  const compStyle = computedCompRect(item);

  const { width } = compStyle;
  const { height } = compStyle;
  const transformXY = formatPosition(compStyle.transform);

  let computedZIndex = item.zIndex;
  // 有图层时需要给选中图层统一提升层级
  // if (pageType !== 'card') {
  // TODO 8.0 layerConfig
  const { layerConfig = {} } = window.screenConfig || {};
  const { activeLayerId } = layerConfig;
  if (!item.groupKey) {
    if (activeLayerId === item.layerId && computedZIndex < 10000) {
      computedZIndex += 1000;
    } else if (activeLayerId !== item.layerId && computedZIndex > 10000) {
      computedZIndex -= 1000;
    }
  }
  item.zIndex = computedZIndex;

  const display = item.comInvisible ? 'none' : 'block';
  const css = { zIndex: computedZIndex, display };
  const isHaveChildChange = haveChildByKey(item.childComList, store.changeKeys);

  const disabled = !store.changeKeys.includes(item.key) || item.comLock;
  let className = disabled ? '' : 'change';
  if (item.classType === 'group') className += ' group';
  if (isHaveChildChange) className += ' active';
  const ref = useRef();
  const [position, changePosition] = useState({
    x: transformXY?.[0] ?? 0,
    y: transformXY?.[1] ?? 0,
  });
  const [count, setCount] = useState(0);
  const forceUpdate = useCallback(() => {
    setCount(count + 1);
  }, [count]);

  const HandlerEvent = {
    onClick: (evt) => {
      // evt.stopPropagation();
      if (clickHandler) clickHandler(evt);
    },
    onMouseDown: (evt) => {
      if (evt.button === 2) return; // 鼠标右键

      if (disabled || store.isSpaceDown) return;

      if (evt.target.classList.contains('dragger-line') || !moveAble) {
        return;
      }

      transform = getTransform(ref.current);

      ref.current.dataset.width = Number.parseInt(width);
      ref.current.dataset.height = Number.parseInt(height);

      ref.current.classList.add('dragger-current');

      ref.current.dataset.clientX = evt.clientX;
      ref.current.dataset.clientY = evt.clientY;

      ref.current.dataset.transform = transform;

      // 开启GPU加速
      ref.current.style.willChange = 'transform';
      dragEvt = evt;
      dragEvt.el = evt.target;
    },

    onMouseUp: (evt) => {
      if (disabled || store.isSpaceDown) return;
      if (evt.target.classList.contains('dragger-line') || !moveAble) {
        return;
      }
      evt.currentTarget.classList.remove('dragger-current');
      ref.current.style.willChange = '';
      if (moveEnd) {
        moveEnd({
          transform: ref.current.style.transform,
          width: getWidth(ref.current),
          height: getHeight(ref.current),
        });
      }

      dragEvt = undefined;
      forceUpdate();
    },
    onDoubleClick: (evt) => {
      if (doubleClick) doubleClick(evt);
    },
  };

  useLayoutEffect(() => {
    if (ref.current) {
      domRef.current = ref.current;
    }
  }, [domRef, ref]);

  useLayoutEffect(() => {
    const el = ref.current;
    const str = el.innerHTML;
    const isNotRectLine =
      el && el.parentElement && el.parentElement.classList && !el.parentElement.classList.contains('rect-line');

    const moveFn = (evt) => {
      if (!dragEvt || disabled || store.isSpaceDown) return;

      let x = evt.clientX - ref.current.dataset.clientX;
      let y = evt.clientY - ref.current.dataset.clientY;

      const zoom = window.zoom / 100;

      if (!Number.isNaN(zoom)) {
        x = Number.parseInt(x / zoom);
        y = Number.parseInt(y / zoom);
      }

      const elTransform = transform;

      let dragEvtKey = dragEvt.el.dataset.key;

      if (dragEvt.el.classList.contains('dragger-real-container')) {
        dragEvtKey = dragEvt.el.parentElement.dataset.key;
      }

      if (
        dragEvt.el?.classList?.contains('ant-image-img') ||
        dragEvt.el?.classList?.contains('vjs-poster') ||
        dragEvt.el?.classList?.contains('vjs-tech') ||
        dragEvt.el?.dataset?.type === 'mp4'
      ) {
        dragEvtKey = el.dataset.key;
      }

      if (dragEvtKey !== el.dataset.key && !str.includes(dragEvtKey)) return;

      if (isNotRectLine) {
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
        transform: ref.current.dataset.transform,
      };

      const newItem = {
        width: getWidth(ref.current),
        height: getHeight(ref.current),
        transform: getTransform(ref.current),
      };

      // 移动过程中矩形更改的信息
      const moveChangeRect = computedChangeValue(old, newItem);
      if (moveChangeRect.status && moveChangeRect.status === 'error') {
        return;
      }
      if (moveHandler) moveHandler({ x: moveChangeRect.x, y: moveChangeRect.y });
    };

    const moveUpFn = () => {
      /**
       * v8.1 div 缩小到一定程度后，其 onMouseUp 事件不生效，
       * 可能是因为 mouseup 事件在 div 之外被触发了，
       * 或者鼠标移动速度过快导致在 div 周围的区域触发了 mouseup 事件而不在 div 上。
       * 如果是这种情况，可以在 document 上绑定 mouseup 事件并在事件处理程序中进行处理
       *  */
      // let className = evt.target.classList;
      if (dragEvt && dragEvt.target && !disabled && !store.isSpaceDown) {
        if (moveEnd) {
          moveEnd({
            transform: ref.current.style.transform,
            width: getWidth(ref.current),
            height: getHeight(ref.current),
          });
        }
        ref.current.classList.remove('dragger-current');
        dragEvt = undefined;
      }
      // dragEvt = undefined;
    };
    document.addEventListener('mousemove', moveFn);
    document.addEventListener('mouseup', moveUpFn);
    return () => {
      document.removeEventListener('mousemove', moveFn);
      document.removeEventListener('mouseup', moveUpFn);
    };
  }, [disabled, moveEnd, moveHandler, store.isSpaceDown]);

  useEffect(() => {
    const positionEft = formatPosition(compStyle.transform);
    changePosition(positionEft ? { x: positionEft[0], y: positionEft[1] } : { x: 0, y: 0 });
  }, [
    item.key,
    item.styles,
    compStyle.transform,
    item.styles.compPos,
    item.styles.alignCenter,
    item.styles.xPercent,
    item.styles.verticalPos,
  ]);

  useEffect(() => {
    // 切换图层重新渲染
    forceUpdate();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.renderLayoutCount]);

  const style = {
    width,
    height,
    transform: `translate(${isEditMap ? 0 : position.x}px, ${isEditMap ? 0 : position.y}px)`,
    ...css,
  };

  const rect = {
    width: w,
    height: h,
  };

  const isLockedVisible = () => {
    if (pageTabsStore.selectedKey) {
      // 页面类型, 当前页面的其他图层显示锁，常驻主页不显示锁
      let isLock = false;
      if (item.layerLock) {
        isLock = item.layerLock && item.appPageId === pageTabsStore.selectedKey;
      } else {
        isLock = item.comLock && item.appPageId === pageTabsStore.selectedKey;
      }
      return isLock;
    }
    // 业务图层或卡片
    return item.layerLock || item.comLock;
  };

  // console.info('dragger==>', item);

  return (
    <div
      ref={ref}
      style={{ ...style }}
      {...HandlerEvent}
      {..._.pick(otherProps, 'data-key')}
      className={classnames(
        'drag-container',
        className,
        { 'edit-map': isEditMap },
        { 'group-container': item.classType === 'group' },
      )}
    >
      {/* 只有选中图层需要渲染出标尺线 */}
      {ref && ref.current && item.layerId === layerConfig.activeLayerId && !isEditMap && (
        <BorderLine
          item={item}
          parent={ref}
          dragEnd={dragEnd}
          dragHandler={dragHandler}
          offsetParent={offsetParent}
          disabled={disabled}
          rect={rect}
        />
      )}

      <div
        className='dragger-real-container'
        style={{
          filter: props.filter,
        }}
      >
        <div
          className='component-locked'
          style={{
            visibility: isLockedVisible() ? 'visible' : 'hidden',
          }}
        >
          <LockOutlined
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              margin: 'auto',
              width: '20px',
              height: '20px',
              fontSize: '20px',
              color: '#FF0000',
            }}
          />
        </div>
        {/* 单个组件渲染 */}
        {children}
      </div>
      {/* v8.5.0 地图编辑提示 */}
      {isEditMap && (
        <div className='edit-map-tooltip'>
          <span className='edit-map-tooltip-container'>
            {/* <img className='mouse_icon' style={{ height: '24px' }} src={mouse} alt='' />
            <span className='add_concat'>+</span>
            <img className='direction_icon' src={direction} alt='' /> */}
            {/* 地图缩放 */}
            <span className='name_label'>地图缩放：</span>
            <img className='mouse_icon' src={mouseWheel} alt='' />
            <span className='add_concat'>+</span>
            <img className='direction_icon' src={direction} alt='' />
            {/* 旋转相机 */}
            {item.type !== '@yl/datai-com-map-foundationPlan' && (
              <>
                <span className='name_label'>旋转相机：</span>
                {/* {item.type === '@yl/datai-com-map-3D-FoundationPlan' && (
                  <>
                    <span className='name_label'>Ctrl</span>
                    <span className='add_concat'>+</span>
                  </>
                )} */}
                <img
                  className='mouse_icon'
                  src={item.type === '@yl/datai-com-map-3D-FoundationPlan' ? mouse : mouseRight}
                  alt=''
                />
                <span className='add_concat'>+</span>
                <img className='direction_icon' src={direction} alt='' />
              </>
            )}
            {/* 平移相机 */}
            <span className='name_label'>平移相机：</span>
            <img className='mouse_icon' src={mouseLeft} alt='' />
            <span className='add_concat'>+</span>
            <img className='direction_icon' src={direction} alt='' />
          </span>
        </div>
      )}
    </div>
  );
};
export default memo(observer(Dragger));
