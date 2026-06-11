import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toJS } from 'mobx';
import { message } from 'antd';
import { computedCompRect } from '@/utils/analysis';
import './index.less';
import $ from 'jquery';
import { transformCss, babelTransform3 } from '@/utils/utils';
import CompRender from '@/components/AntdLibs/AsyncCompRender';
import CustomCompRender from '@/components/CustomCompRender/render';
import { haveChildByKey } from '@/Computed/Comp/ConditionComputed';
import { handleDomIsOutContainer } from '@/utils/componentUtils';
import { ComparePropsHocWrap } from '@/utils/customReactHooks';
import { loadVideoJS } from '@/utils/loadScript';
import { useStore } from '@/hooks';
import DataI from '@/utils/global-api';
import Dragger from './dragger';
import { isMovedFn, initInstance, syncMoveComponent, refreshOtherComp } from './utils';
import { compatibleChartConfig } from './Compatible/CompatibleChart';

const GroupChildComponentType = (props) => {
  const ref = useRef();
  const hasInsRef = useRef(false);
  // const [preAttr, setPreAttr] = useState();
  const [moved, changeMoved] = useState(false);
  const {
    item,
    parent,
    // parentItem,
    // disabled,
    config: screenConfig,
    zIndex,
    // parentKey,
    // parentInvisibility,
    count: propsCount,
    accurateCount,
    // layerVisible,
  } = props;
  const { editorStore: store, layerStore } = useStore();
  // let store = useStores('ComStore');
  // let layerStore = useStores('LayerStore');
  const style = computedCompRect(item);
  // let selector = `[data-key='${item.key}']>.dragger-real-container`;

  const isDisabled = !store.changeKeys.includes(item.key) || item.comLock;
  let isHaveChildChange = true;
  const comp = DataI.getComponentByKey(item.key); // getComponent(item.key);
  const childrenComps = [];
  const moveAble = true; //! (store.screenConfig.isResponsive && item.styles && item.styles.xPercent);
  if (item.children) {
    item.children.forEach((child) => {
      child.AntdChildComponents.forEach((AntdChild) => {
        childrenComps.push(AntdChild);
      });
    });
    isHaveChildChange = haveChildByKey(childrenComps, store.changeKeys);
  }
  useEffect(() => {
    if (item.type === '@yl/datai-com-media-mp4-player') {
      loadVideoJS();
    }
  }, [item.type]);

  useEffect(() => {
    // 组内非datai组件不需要执行渲染逻辑
    if (!['group', 'com'].includes(item.classType)) return;
    const selector = `[data-key='${item.key}']>.dragger-real-container`;
    // 地图组件都有compKey属性,走新增组件可以正常创建
    if (item.instance && !item.instance.compKey && ref.current !== undefined) {
      //  复制的组件信息-----
      item.instance._selector = selector;
      item.instance.container = $(selector).find('.ref-component');
      // item.instance.init();
      item.instance.mapSourceToData();
    } else if (!item.instance) {
      // 新增的组件信息
      let config;
      let attr;
      let shape;
      // let iocStorageUrl;
      if (item.preAttr) {
        config = item.preAttr._config;
        attr = item.preAttr._attr;
        shape = item.preAttr._shape;
      }
      if (item.isCustomListChild) {
        config = item._config;
        attr = item._attr;
        shape = item._shape;
      }
      if (item.middleWareFnCode) {
        const code = item.middleWareFnCode;
        const middleWareFn = babelTransform3(code);
        shape = middleWareFn;
      }
      try {
        if (!item.initCom || !item.CssPage) {
          // console.log('item.englishName2', item.englishName);
          const { index, config: compConfig } = window[item.englishName] as never;
          // console.log('index', index);
          item.initCom = index;
          item.CssPage = compConfig;
        }
        // console.log('item.initCom', item.initCom);
        const InitFn = item.initCom; // 负责渲染的构造函数
        // console.log('InitFn', InitFn);
        const styles = item.styles?.width && Number.parseInt(item.styles?.width) !== 0 ? item.styles : undefined;
        const instance = new InitFn(selector, config, attr, shape, styles);
        compatibleChartConfig(instance, item.englishName);
        if (!item.styles.width || item.styles.width === '0px') {
          item.styles.width = instance.shapeCss.width;
          item.styles.height = instance.shapeCss.height;
        }

        instance.asyncData();
        initInstance(item, instance);
        // console.log('item.instance5', item.instance);
        // setPreAttr(JSON.stringify(item.instance.compAttr));
        hasInsRef.current = true;

        // 组件拖入组内时会重建instance，需要刷新右侧配置栏
        if (store.changeKeys.includes(item.key)) {
          // 刷新右侧配置
          store.forceUpdateAttr();
        }
      } catch (error) {
        console.error(error);
        const key = selector.replaceAll(/[[\]]/g, '').split('=')[1];
        message.error(`${item.name}-${key}组件，由于数据不符合当前版本，请删除重写或者保存后刷新页面初始化组件`, 10);
      }
    }

    // if (parentKey && item.instance) {
    //   item.instance.compAttr.groupParentKey = parentKey;
    //   item.instance.render();
    // }

    return () => {};
  }, [item, accurateCount, propsCount]);

  // 当组件尺寸发生变化的时候重新渲染
  useEffect(() => {
    // 目前只针对做了动画效果的部分组件实现了resize和render的分离，大部分组件还是可以继续调用render调整尺寸
    if (item?.instance?.resize) {
      item?.instance?.resize?.({ width: item?.styles?.width, height: item?.styles?.height });
    } else {
      item?.instance?.render?.();
    }
  }, [item?.instance, item?.styles?.height, item?.styles?.width]);
  // useEffect(() => {
  //   console.log('layerVisible', layerVisible, 'item', item);
  //   if (layerVisible) {
  //     item && item.instance && item.instance.render && item.instance.render();
  //   }
  // }, [layerVisible, item.instance]);

  const [count, setCount] = useState(0);
  const refresh = useCallback(() => {
    setCount(count + 1);
  }, [count]);

  if (item.classType !== 'antd' && item.classType !== 'customComp') {
    item.refresh = refresh;
  }
  const syncAttr = (rect) => {
    // if (parent.current.dataset.moveState == '1' || isDisabled) {
    //   return;
    // }
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
    handleDomIsOutContainer(item, { layerStore, comStore: store });
    // v8.9.0 刷新其他选中组件
    refreshOtherComp(store.changeKeys, item.key);
  };
  const dragEndHandler = (rect) => {
    syncAttr(rect);
    // v8.9.0 刷新其他选中组件
    refreshOtherComp(store.changeKeys, item.key);
  };

  const dbClickHandler = () => {
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

  const clickHandler = (evt) => {
    if (store.isSpaceDown) return;
    const disabled = !store.changeKeys.includes(item.key) || item.comLock;
    const isCtrl = navigator.platform.match('Mac') ? evt.metaKey : evt.ctrlKey;
    if (parent.current.dataset.moveState !== '1' && disabled) {
      if (isCtrl) {
        // v7.6.0 多选组件重复点击需要取消选中组件
        const changeKeys = toJS(store.changeKeys);
        if (changeKeys.includes(item.key)) {
          const keys = changeKeys.filter((key) => {
            return key !== item.key;
          });
          store.changeComponents(keys);
        } else {
          store.addChangeComponents([item.key]);
        }
      } else {
        const { key } = evt.target.dataset;
        const ids = item.childComList ? item.childComList.map((chd) => chd.key) : [];
        if (key === item.key) {
          store.changeComponents([item.key]);
        } else if (!moved && key !== undefined) {
          // 如果没有移动过，并且选中了 子组件信息-----
          if (!store.changeKeys.includes(key) && ids.includes(key)) store.changeComponents([key]);
        } else if (key === undefined) {
          store.changeComponents([item.key]);
        }
      }
      return;
    }
    if (parent.current.dataset.moveState === '1' || disabled) {
      return;
    }
    if (moved && store.changeKeys.length > 1) {
      // 同步批量宽 - 高 -位移信息
      changeMoved(false);
      return;
    }

    if (store.dynamicPanelEditComp && comp.type !== 'DynamicPanel' && comp.type !== 'CollapsePanel') {
      return;
    }

    if (isCtrl) {
      // v7.6.0 多选组件重复点击需要取消选中组件
      const changeKeys = toJS(store.changeKeys);
      if (changeKeys.includes(item.key)) {
        const keys = changeKeys.filter((key) => {
          return key !== item.key;
        });
        store.changeComponents(keys);
      } else {
        store.addChangeComponents([item.key]);
      }
      return;
    }
    if (moved) {
      // 如果组件移动了，重新计算父组件的宽高
      // parentItem
      // if (!item?.isCustomListChild) {
      // computedRectByChild(parentItem.key);
      // store.forceUpdate();
      // }
      // tips： 去掉拖动子组件时对父组件宽高大小的重新计算
    }
    changeMoved(false);
  };
  const moveHandler = (rect) => {
    const otherKey = store.changeKeys.filter((vl) => vl !== item.key);
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

  if (!item) {
    console.error('组内元素渲染报错', props);
    return null;
  }

  const css = item.styles ? transformCss(item.styles) : item.cssStyle;
  if (item.compType === 'antd' || item.compType === 'customComp') {
    delete css.width;
    delete css.height;
    delete css.transform;
  }
  const isActiveDynamicPanel = item.key === store.dynamicPanelEditComp;
  const display = item.comInvisible ? 'none' : 'block';
  // if (parentInvisibility) {
  //   visibility = 'hidden';
  // }
  return (
    <Dragger
      // parentInvisibility={parentInvisibility}
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
      dragHandler={dragHandler}
      moveEnd={moveEndHandler}
      dragEnd={dragEndHandler}
      clickHandler={clickHandler}
      doubleClick={dbClickHandler}
      disabled={isDisabled}
      moveAble={moveAble}
      item={item}
    >
      {item.classType !== 'antd' && item.classType !== 'customComp' && (
        <div
          className='ref-component yl-comp disbale'
          style={{
            width: !style.width || style.width === '0px' ? '100%' : style.width,
            height: !style.height || style.height === '0px' ? '100%' : style.height,
          }}
        />
      )}
      {item.classType === 'antd' && (
        <CompRender css={css} item={item} count={propsCount} accurateCount={accurateCount} config={screenConfig} />
      )}
      {item.classType === 'customComp' && (
        <CustomCompRender
          css={css}
          item={item}
          refresh={refresh}
          count={propsCount}
          accurateCount={accurateCount}
          config={screenConfig}
        />
      )}
    </Dragger>
  );
};

export default ComparePropsHocWrap(GroupChildComponentType) as any;
