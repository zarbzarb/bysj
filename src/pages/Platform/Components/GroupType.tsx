import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { toJS } from 'mobx';
import { message } from 'antd';
import { computedCompRect } from '@/utils/analysis';
import { searchHoverChild, haveChildByKey } from '@/Computed/Comp/ConditionComputed';
import { useStore } from '@/hooks';
import './index.less';
import { babelTransform3 } from '@/utils/utils';
import { handleDomIsInContainer } from '@/utils/componentUtils';
import { ComparePropsHocWrap } from '@/utils/customReactHooks';
import GroupInGroupType from './GroupInGroupType';
import GroupChildComponentType from './GroupChildComponentType';
import Dragger from './dragger';
import { initInstance, isMovedFn, syncMoveComponent, refreshOtherComp } from './utils';

const indexMax = 9999; // 创建的图层层级从这个数字开始递减
const GroupType = (props) => {
  const EventEmitter = window.globalEventEmitter;
  const ref = useRef(null);
  const hasInsRef = useRef(false);
  const [moved, changeMoved] = useState(false);
  const { item, zIndex, config, count, accurateCount } = props;
  const { editorStore, layerStore, globalStore } = useStore();
  const { bigScreenType } = globalStore;
  let computedZIndex = zIndex;
  if (layerStore.activeLayerId === item.layerId && computedZIndex < 10000) {
    computedZIndex += 1000;
  } else if (layerStore.activeLayerId !== item.layerId && computedZIndex > 10000) {
    computedZIndex -= 1000;
  }
  const style = computedCompRect(item);
  // const selector = `[data-key='${item.key}']>.dragger-real-container`;
  const { eventSetings } = item;

  const moveAble = true; //! (globalStore.screenConfig.isResponsive && item.instance && item.instance.compAttr.xPercent);

  const isDisabled = !editorStore.changeKeys.includes(item.key) || item.comLock;
  const isHaveChildChange = haveChildByKey(item.childComList, editorStore.changeKeys);
  useEffect(() => {
    // 只触发被操作组件的重新渲染
    if (!editorStore.changeKeys.includes(item.key) && !editorStore.editModePaths.includes(item.key)) {
      return;
    }
    const selector = `[data-key='${item.key}']>.dragger-real-container`;
    if (item.instance) {
      //  复制的组件信息-----
      // item.instance._selector = selector;
      // item.instance.container = $(selector).find('.ref-component');
      // item.instance.init();
      // item.instance.asyncData();
    } else if (!item.instance) {
      // 新增的组件信息
      let _config;
      let attr;
      let shape;
      if (item.preAttr) {
        _config = item.preAttr._config;
        attr = item.preAttr._attr;
        shape = item.preAttr._shape;
      }
      if (item.middleWareFnCode) {
        const code = item.middleWareFnCode;
        const middleWareFn = babelTransform3(code);
        shape = middleWareFn;
      }
      try {
        if (!item.initCom || !item.CssPage) {
          const { index, config: compConfig } = window[item.englishName] as never;
          item.initCom = index;
          item.CssPage = compConfig;
        }
        const InitFn = item.initCom;
        const instance = new InitFn(selector, _config, attr, shape);
        // console.log('InitFn');
        instance.mapSourceToData();
        initInstance(item, instance);
        if (
          bigScreenType === 'card' ||
          editorStore.changeKeys.includes(item.key) // 跨屏粘贴后组件默认被选中需要重新刷新右侧配置栏展示
        ) {
          // 刷新右侧配置
          editorStore.forceUpdateAttr();
        }
        // setPreAttr(JSON.stringify(item.instance.compAttr));
        hasInsRef.current = true;
      } catch (error) {
        console.warn(error);
        const key = selector.replaceAll(/[[\]]/g, '').split('=')[1];
        console.warn(`${item.name}-${key}组件，由于数据不符合当前版本，请删除重写或者保存后刷新页面初始化组件`, 10);
      }
    }
    return () => {};
  }, [item, editorStore.renderLayoutCount, editorStore.changeKeys]);

  /** 组件初始化 */
  useEffect(() => {
    if (!item.instance) {
      const groupSelector = `[data-key='${item.key}']>.dragger-real-container`;
      let _config;
      let attr;
      let shape;
      if (item.preAttr) {
        _config = item.preAttr._config;
        attr = item.preAttr._attr;
        shape = item.preAttr._shape;
      }
      try {
        // if (!item.initCom) return;

        if (!item.initCom || !item.CssPage) {
          const { index, config: compConfig } = window[item.englishName] as never;
          item.initCom = index;
          item.CssPage = compConfig;
        }
        const InitFn = item.initCom;
        const instance = new InitFn(groupSelector, _config, attr, shape);
        if (!item.styles.width || item.styles.width === '0px') {
          item.styles.width = instance.shapeCss.width;
          item.styles.height = instance.shapeCss.height;
        }

        instance.asyncData();
        initInstance(item, instance);
      } catch (error) {
        console.error(error);
        const key = groupSelector.replaceAll(/[[\]]/g, '').split('=')[1];
        message.error(`${item.name}-${key}组件，由于数据不符合当前版本，请删除重写或者保存后刷新页面初始化组件`, 10);
      }
    }
    return () => {};
  }, []);

  const syncAttr = (rect) => {
    const isMoved = isMovedFn(item, rect);
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
    if (editorStore.dynamicPanelEditComp || !moveAble) {
      return;
    }
    syncAttr(rect);
    handleDomIsInContainer(item, { layerStore, comStore: editorStore });
    // v8.9.0 刷新其他选中组件
    refreshOtherComp(editorStore.changeKeys, item.key);
  };
  const dragEndHandler = (rect) => {
    syncAttr(rect);
    // v8.9.0 刷新其他选中组件
    refreshOtherComp(editorStore.changeKeys, item.key);
  };
  const clickHandler = (evt) => {
    ref.current.dataset.moveState = '';
    const { key } = evt.target.dataset;
    if (
      (editorStore.changeKeys.includes(item.key) && editorStore.changeKeys.length > 1 && evt.type === 'contextmenu') ||
      editorStore.isSpaceDown
    ) {
      return;
    }
    if (moved && editorStore.changeKeys.length > 1) {
      // 同步批量宽 - 高 -位移信息
      changeMoved(false);
      return;
    }
    if (editorStore.dynamicPanelEditComp) {
      return;
    }
    const isCtrl = navigator.platform.match('Mac') ? evt.metaKey : evt.ctrlKey;
    if (isCtrl) {
      // v7.6.0 多选组件重复点击需要取消选中组件
      const changeKeys = toJS(editorStore.changeKeys);
      if (changeKeys.includes(item.key)) {
        const keys = changeKeys.filter((k) => {
          return k !== item.key;
        });
        editorStore.changeComponents(keys);
      } else {
        editorStore.addChangeComponents([item.key]);
      }
      return;
    }
    const ids = item.childComList ? item.childComList.map((chd) => chd.key) : [];
    if (key === item.key) {
      editorStore.changeComponents([item.key]);
    } else if (!moved && key !== undefined) {
      // 如果没有移动过，并且选中了 子组件信息-----
      if (!editorStore.changeKeys.includes(key) && ids.includes(key)) editorStore.changeComponents([key]);
    } else if (key === undefined) {
      editorStore.changeComponents([item.key]);
    }
    changeMoved(false);
  };
  const dbClickHandler = (evt) => {
    const x = evt.clientX;
    const y = evt.clientY;
    searchHoverChild(item.childComList, { x, y });
  };
  const moveHandler = (rect) => {
    if (!moveAble) {
      return;
    }
    ref.current.dataset.moveState = '1';
    const otherKey = editorStore.changeKeys.filter((vl) => vl !== item.key);
    if (otherKey.length > 0) {
      syncMoveComponent(otherKey, rect);
    }
  };
  const dragHandler = (rect) => {
    const otherKey = editorStore.changeKeys.filter((vl) => vl !== item.key);
    if (otherKey.length > 0) {
      syncMoveComponent(otherKey, rect);
    }
  };

  let className = 'group ';
  if (!isDisabled) className += 'change';
  if (isHaveChildChange) className += 'active';
  const display = item.comInvisible ? 'none' : 'block';
  // 父组件隐藏，子组件也隐藏
  // if (parentInvisibility) {
  //   visibility = 'hidden';
  // }
  // const invisibility = visibility === 'hidden';

  // 判断是否卡片顶级组
  const comList = editorStore.getCompList();
  let isRootGroup = false;
  if (
    bigScreenType === 'card' &&
    comList.length === 1 &&
    comList[0].classType === 'group' &&
    editorStore.editModePaths.length === 0
  ) {
    isRootGroup = true;
  }

  return (
    <Dragger
      zIndex={zIndex}
      css={{ zIndex: computedZIndex, display }}
      className={className}
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
      filter={props.filterStyle}
      item={item}
    >
      {isRootGroup
        ? null
        : item.childComList.map((child, idx) => {
            const childZIndex = indexMax - idx;
            child.zIndex = childZIndex;
            const childIsDisabled = !editorStore.changeKeys.includes(child.key);
            return (
              child.comCreated &&
              (child.classType === 'group' ? (
                <GroupInGroupType
                  config={config}
                  parent={ref}
                  parentItem={item}
                  disabled={childIsDisabled}
                  zIndex={childZIndex}
                  /*
             二级组子组件显隐根据一级组和二级组是否显隐共同决定
             1. 一级组隐藏,二级组和二级组子组件都隐藏
             2. 一级组显示,二级组隐藏,二级组子组件隐藏
            */
                  // parentInvisibility={invisibility || child.comInvisible}
                  key={child.key}
                  item={child}
                  consoleRef={props.consoleRef}
                  filterStyle={props.filterStyle}
                  count={count}
                  accurateCount={accurateCount}
                  // layerVisible={layerVisible}
                />
              ) : (
                <GroupChildComponentType
                  parent={ref}
                  config={config}
                  parentKey={item.key}
                  parentItem={item}
                  disabled={childIsDisabled}
                  zIndex={childZIndex}
                  // parentInvisibility={invisibility}
                  key={child.key}
                  item={child}
                  count={count}
                  accurateCount={accurateCount}
                  // layerVisible={layerVisible}
                />
              ))
            );
          })}
    </Dragger>
  );
};

export default ComparePropsHocWrap(GroupType) as any;
