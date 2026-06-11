import React, {
  // Component,
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react';
import { toJS } from 'mobx';
import { message } from 'antd';
import { computedCompRect } from '@/utils/analysis';
import { searchHoverChild, haveChildByKey } from '@/Computed/Comp/ConditionComputed';
import { useStore } from '@/hooks';
import { handleDomIsOutContainer } from '@/utils/componentUtils';
import { ComparePropsHocWrap } from '@/utils/customReactHooks';
import { babelTransform3 } from '@/utils/utils';
import Dragger from './dragger';
import './index.less';
import GroupChildComponentType from './GroupChildComponentType';
import GroupType from './GroupType';

import { initInstance, isMovedFn, syncMoveComponent, refreshOtherComp } from './utils';

const indexMax = 9999;
const GroupInGroupType = (props) => {
  const ref = useRef(null);
  const hasInsRef = useRef(false);
  const [moved, changeMoved] = useState(false);
  const { item, zIndex, config, consoleRef, filterStyle, count, accurateCount } = props;
  const { editorStore, layerStore } = useStore();
  const style = computedCompRect(item);
  const selector = `[data-key='${item.key}']>.dragger-real-container`;

  const isDisabled = !editorStore.changeKeys.includes(item.key) || item.comLock;

  const isHaveChildChange = haveChildByKey(item.childComList, editorStore.changeKeys);

  const moveAble = true; //! (store.screenConfig.isResponsive && item.styles && item.styles.xPercent);
  useLayoutEffect(() => {
    // 此处已经没有注入ComStore，不需要这个判断，去掉可以解决跨屏复制后二级组无法生成instance问题
    // 只触发被操作组件的重新渲染
    // if (store.changeKeys.indexOf(item.key) == -1) {
    //   return;
    // }
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
        instance.mapSourceToData();
        initInstance(item, instance);
        if (
          editorStore.changeKeys.includes(item.key) // 跨屏粘贴后组件默认被选中需要重新刷新右侧配置栏展示
        ) {
          // 刷新右侧配置
          editorStore.forceUpdateAttr();
        }
        // setPreAttr(JSON.stringify(item.instance.compAttr));
        hasInsRef.current = true;
      } catch (error) {
        console.error(error);
        const key = selector.replaceAll(/[[\]]/g, '').split('=')[1];
        message.error(`${item.name}-${key}组件，由于数据不符合当前版本，请删除重写或者保存后刷新页面初始化组件`, 10);
      }
    }
    return () => {};
  }, [item, selector, editorStore.changeKeys]);

  useEffect(() => {
    return () => {
      try {
        item && item.instance && item.instance.destroy();
      } catch (error) {
        console.error(error);
      }
    };
  }, [item]);

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
    if (!moveAble) {
      return;
    }
    syncAttr(rect);
    handleDomIsOutContainer(item, { layerStore, comStore: editorStore });
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
    const isCtrl = navigator.platform.match('Mac') ? evt.metaKey : evt.ctrlKey;
    if (isDisabled) {
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
      if (key === item.key) {
        editorStore.changeComponents([item.key]);
      } else if (!moved && key !== undefined) {
        // 如果没有移动过，并且选中了 子组件信息-----
        const ids = item.childComList ? item.childComList.map((chd) => chd.key) : [];
        if (!editorStore.changeKeys.includes(key) && ids.includes(key)) editorStore.changeComponents([key]);
      }
      return;
    }
    if (moved && editorStore.changeKeys.length > 0) {
      // 同步批量宽 - 高 -位移信息
      // tips： 去掉拖动子组件时对父组件宽高大小的重新计算
      // let ckey = key === undefined ? item.key : parentItem.key;
      // computedRectByChild(ckey);

      // 二级组里拖动组，结束后会选中父组,强制选中当前组
      const ids = item.childComList.map((ch) => ch.key);
      if (key === undefined || ids.includes(key)) {
        setTimeout(() => {
          editorStore.changeComponents([item.key]);
        }, 100);
      }
      changeMoved(false);
      editorStore.forceUpdateAttr();
      return;
    }

    changeMoved(false);
  };
  const dbClickHandler = (evt) => {
    const x = evt.clientX;
    const y = evt.clientY;
    searchHoverChild(item.childComList, { x, y });
  };
  const moveHandler = (rect) => {
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
  return (
    <Dragger
      // parentInvisibility={parentInvisibility}
      zIndex={zIndex}
      css={{ zIndex, display }}
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
      item={item}
    >
      {item.childComList.map((child, idx) => {
        const chindZIndex = indexMax - idx;
        child.zIndex = chindZIndex;
        const childIsDisabled = !editorStore.changeKeys.includes(child.key);
        return (
          child.comCreated &&
          (child.classType === 'group' ? (
            <GroupType
              zIndex={chindZIndex}
              key={child.key}
              item={child}
              // parentInvisibility={parentInvisibility}
              config={config}
              consoleRef={consoleRef}
              filterStyle={filterStyle}
              count={count}
              accurateCount={accurateCount}
              // layerVisible={layerVisible}
            />
          ) : (
            <GroupChildComponentType
              parent={ref}
              config={config}
              parentItem={item}
              disabled={childIsDisabled}
              zIndex={chindZIndex}
              // parentInvisibility={parentInvisibility}
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

export default ComparePropsHocWrap(GroupInGroupType) as any;
