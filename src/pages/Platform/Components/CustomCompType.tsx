import React, { useState, useRef, useEffect } from 'react';
import { toJS } from 'mobx';
import { formatPosition, computedCompRect } from '@/utils/analysis';
import { LockOutlined } from '@ant-design/icons';
import CustomCompRender from '@/components/CustomCompRender/render';
import { transformCss } from '@/utils/utils';
import $ from 'jquery';
import './index.less';
import { haveChildByKey } from '@/Computed/Comp/ConditionComputed';
import { ComparePropsHocWrap } from '@/utils/customReactHooks';
import { useStore } from '@/hooks';
import DataI from '@/utils/global-api';
import Dragger from './dragger';
import { isMovedFn, syncMoveComponent, refreshOtherComp } from './utils';

const CustomComp = (props) => {
  const [moved, changeMoved] = useState(false);
  // const [position, changePosition] = useState([0, 0]);
  const [count, setCount] = useState(0);
  const ref = useRef();
  const { editorStore: store, globalStore } = useStore();
  const { item = {}, zIndex, config } = props;
  const style = computedCompRect(item);
  const comp = DataI.getComponentByKey(item.key);
  const { dynamicPanelCount } = store;
  const childrenComps = [];
  const moveAble = !(globalStore.screenConfig.isResponsive && item.styles && item.styles.xPercent);

  const isHaveChildChange = haveChildByKey(childrenComps, store.changeKeys);
  const isDisabled = !store.changeKeys.includes(item.key) || item.comLock;

  const syncAttr = (rect) => {
    const isMoved = isMovedFn(item, rect);
    // console.log('drag', moved);
    changeMoved(isMoved);
    if (!isMoved) return;
    const undoStyles = {
      width: item.styles.width,
      height: item.styles.height,
      transform: item.styles.transform,
    };
    window.executeCommand('dragComponent', item, undoStyles, rect);
  };
  const moveEndHandler = (rect) => {
    if (!moveAble) {
      return;
    }
    syncAttr(rect);
    // v8.9.0 刷新其他选中组件
    refreshOtherComp(store.changeKeys, item.key);
  };
  const dragEndHandler = (rect) => {
    syncAttr(rect);
    // v8.9.0 刷新其他选中组件
    refreshOtherComp(store.changeKeys, item.key);
  };

  const dbClickHandler = (evt) => {
    if (store.changeKeys.length === 0) {
      return;
    }
    // v8.17 新增折叠面板
    if (comp.type === 'DynamicPanel' || comp.type === 'CollapsePanel') {
      store.setDynamicPanelEditComp(item.key);
      store.changeComponents([item.key]);
    } else if (!store.dynamicPanelEditComp) {
      store.changeComponents([item.key]);
    }
  };

  const clickHandler = (evt) => {
    const { key } = evt.target.dataset;
    if ((!isDisabled && store.changeKeys.length > 1) || store.isSpaceDown) {
      return;
    }

    if (moved && store.changeKeys.length > 1) {
      // 同步批量宽 - 高 -位移信息
      changeMoved(false);
      return;
    }
    const isDynamicPannelChild = $(`[data-key='${comp.key}']`).parents('.active-dynamic-panel').length;
    // v8.17 新增折叠面板
    if (
      store.dynamicPanelEditComp &&
      comp.type !== 'DynamicPanel' &&
      comp.type !== 'CollapsePanel' &&
      !isDynamicPannelChild
    ) {
      return;
    }
    const isCtrl = navigator.platform.match('Mac') ? evt.metaKey : evt.ctrlKey;
    if (isCtrl) {
      // store.addChangeComponents([item.key]);
      // v7.6.0 多选组件重复点击需要取消选中组件
      const changeKeys = toJS(store.changeKeys);
      if (changeKeys.includes(item.key)) {
        const keys = changeKeys.filter((k) => {
          return k !== item.key;
        });
        store.changeComponents(keys);
      } else {
        store.addChangeComponents([item.key]);
      }

      return;
    }
    if (key === item.key) {
      store.changeComponents([item.key]);
    } else if (!moved && key !== undefined) {
      // 如果没有移动过，并且选中了 子组件信息-----
      if (!store.changeKeys.includes(key)) store.changeComponents([key]);
    } else if (key === undefined) {
      store.changeComponents([item.key]);
    }
    changeMoved(false);
  };

  const moveHandler = (rect) => {
    // v8.17 新增折叠面板
    if ((store.dynamicPanelEditComp && comp.type !== 'DynamicPanel' && comp.type !== 'CollapsePanel') || !moveAble) {
      return;
    }
    const otherKey = store.changeKeys.filter((vl) => vl !== item.key);
    if (otherKey.length > 0) {
      syncMoveComponent(otherKey, rect);
    }
  };

  const isBorder = store.changeKeys.includes(item.key);

  const css = item.styles ? transformCss(item.styles) : item.cssStyle || {};

  delete css.width;
  delete css.height;
  delete css.transform;
  const isActiveDynamicPanel = item.key === store.dynamicPanelEditComp;
  const display = item.comInvisible ? 'none' : 'block';

  const refresh = () => {
    setCount(count + 1);
  };
  return (
    <Dragger
      zIndex={zIndex}
      css={{ zIndex, display }}
      className={`${isDisabled ? '' : 'change'} ${isActiveDynamicPanel ? 'active-dynamic-panel' : ''} ${
        isHaveChildChange ? 'active' : ''
      }`}
      offsetParent={props.consoleRef}
      key={`${item.key}`}
      data-key={item.key}
      domRef={ref}
      width={style.width}
      height={style.height}
      moveHandler={moveHandler}
      moveEnd={moveEndHandler}
      dragEnd={dragEndHandler}
      clickHandler={clickHandler}
      doubleClick={dbClickHandler}
      disabled={isDisabled}
      moveAble={moveAble}
      bordered={isBorder}
      filter={props.filterStyle}
      item={item}
    >
      <CustomCompRender css={css} item={item} dynamicPanelCount={dynamicPanelCount} config={config} refresh={refresh} />
    </Dragger>
  );
};
export default ComparePropsHocWrap(CustomComp);
