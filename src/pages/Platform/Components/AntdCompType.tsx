import React, { useState, useRef, useEffect } from 'react';
import { toJS } from 'mobx';
import { formatPosition, computedCompRect } from '@/utils/analysis';
import CompRender from '@/components/AntdLibs/AsyncCompRender';
import { transformCss } from '@/utils/utils';
import $ from 'jquery';
import { useStore } from '@/hooks';
import './index.less';
import { haveChildByKey } from '@/Computed/Comp/ConditionComputed';
import { handleDomIsInContainer } from '@/utils/componentUtils';
import { ComparePropsHocWrap } from '@/utils/customReactHooks';
import Dragger from './dragger';
import { isMovedFn, syncMoveComponent, refreshOtherComp } from './utils';

type IProps = {
  item: AntdComp.InstanceType;
  [key: string]: any;
};

const AntdComp: React.FC<IProps> = (props) => {
  const [moved, changeMoved] = useState(false);
  const ref = useRef();
  const stores = useStore();
  const { globalStore, editorStore: store, layerStore } = stores;

  const { item, zIndex, config } = props;
  let computedZIndex = zIndex;
  if (layerStore.activeLayerId === item.layerId && computedZIndex < 10000) {
    computedZIndex += 1000;
  } else if (layerStore.activeLayerId !== item.layerId && computedZIndex > 10000) {
    computedZIndex -= 1000;
  }
  const style = computedCompRect(item);
  const comp = item;
  const { dynamicPanelCount } = store;
  const childrenComps = [];
  const moveAble = !(globalStore.screenConfig.isResponsive && item.styles && item.styles.xPercent);

  item.children &&
    item.children.forEach((child) => {
      child.AntdChildComponents.forEach((AntdChild) => {
        childrenComps.push(AntdChild);
      });
    });

  const isHaveChildChange = haveChildByKey(childrenComps, store.changeKeys);
  const isDisabled = !store.changeKeys.includes(item.key) || item.comLock;
  if (item.type === 'DynamicPanel' || item.type === 'CollapsePanel') {
    // v8.17 新增折叠面板
    store.changeDynamicPanelActive(item.props.activeKey);
  }
  const syncAttr = (rect: any) => {
    const _moved = isMovedFn(item, rect);
    changeMoved(_moved);
    if (!_moved) return;
    const undoStyles = {
      width: item.styles.width,
      height: item.styles.height,
      transform: item.styles.transform,
    };
    window.executeCommand('dragComponent', item, undoStyles, rect);
  };

  const moveEndHandler = (rect: any) => {
    if (!moveAble || item?.isCustomListChild) {
      return;
    }
    syncAttr(rect);
    // 组件移入自定义列表内
    handleDomIsInContainer(item, { layerStore, comStore: store });
    // v8.9.0 刷新其他选中组件
    refreshOtherComp(store.changeKeys, item.key);
  };
  const dragEndHandler = (rect: any) => {
    syncAttr(rect);
    // v8.9.0 刷新其他选中组件
    refreshOtherComp(store.changeKeys, item.key);
  };
  // 双击组件
  const dbClickHandler = (evt: any) => {
    if (store.changeKeys.length === 0) {
      return;
    }
    if (comp.type === 'DynamicPanel' || comp.type === 'CollapsePanel') {
      // v8.17 新增折叠面板
      store.setDynamicPanelEditComp(item.key);
      store.changeComponents([item.key]);
    } else if (!store.dynamicPanelEditComp) {
      store.changeComponents([item.key]);
    }
  };

  // 点击组件
  const clickHandler = (evt: any) => {
    const { key } = evt.target.dataset;
    if (store.isSpaceDown) {
      return;
    }

    if (moved && store.changeKeys.length > 1) {
      // 同步批量宽 - 高 -位移信息
      changeMoved(false);
      return;
    }
    // v8.17 新增折叠面板
    const isDynamicPannelChild = $(`[data-key='${comp.key}']`).parents('.active-dynamic-panel').length;
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
        const keys = changeKeys.filter((_key: string) => {
          return _key !== item.key;
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
      if (!store.changeKeys.includes(key)) {
        store.changeComponents([key]);
      }
    } else if (key === undefined) {
      store.changeComponents([item.key]);
    }
    changeMoved(false);
  };
  // 移动处理
  const moveHandler = (rect: any) => {
    // v8.17 新增折叠面板
    if ((store.dynamicPanelEditComp && comp.type !== 'DynamicPanel' && comp.type !== 'CollapsePanel') || !moveAble) {
      return;
    }
    const otherKey = store.changeKeys.filter((vl: string) => vl !== item.key);
    if (otherKey.length > 0) {
      syncMoveComponent(otherKey, rect);
    }
  };

  const dragHandler = (rect) => {
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
  // console.log(position);
  return (
    <Dragger
      zIndex={zIndex}
      css={{ zIndex: computedZIndex, display }}
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
      dragHandler={dragHandler}
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
      <CompRender css={css} item={item} dynamicPanelCount={dynamicPanelCount} config={config} />
    </Dragger>
  );
};
export default ComparePropsHocWrap(AntdComp);
