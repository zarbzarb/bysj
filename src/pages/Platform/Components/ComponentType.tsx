import React, { useEffect, useState, useRef, useCallback } from 'react';
import { toJS } from 'mobx';
import { message } from 'antd';
import { computedCompRect } from '@/utils/analysis';
import $ from 'jquery';
import './index.less';
import { getDataByKey } from '@/utils/dataStoreUtils';
import { handleDomIsInContainer } from '@/utils/componentUtils';
import { babelTransform, babelTransform3 } from '@/utils/utils';
import { ComparePropsHocWrap } from '@/utils/customReactHooks';
import { useStore } from '@/hooks';
import updateCompMergeWithTemplate from '@/utils/updateCompMergeWithTemplate';
import { compatibleChartAttr, compatibleChartConfig } from './Compatible/CompatibleChart';
import Dragger from './dragger';
import { isMovedFn, initInstance, syncMoveComponent, refreshOtherComp } from './utils';

const ComponentType = (props) => {
  const EventEmitter = window.globalEventEmitter;
  const ref = useRef();
  const hasInsRef = useRef(false);
  const [moved, changeMoved] = useState(false);
  const [count, setCount] = useState(0);
  const { item, disabled, isDynamicPanelChild, zIndex, config: screenConfig } = props;

  const { eventSetings } = item;
  let timer = null;

  item.refresh = useCallback(() => {
    setCount(count + 1);
  }, [count]);

  const { globalStore, editorStore, layerStore } = useStore();
  const { isEditMap } = editorStore;
  const style = computedCompRect(item);
  // const selector = `[data-key='${item.key}']>.dragger-real-container`;
  let computedZIndex = zIndex;
  if (layerStore.activeLayerId === item.layerId && computedZIndex < 10000) {
    computedZIndex += 1000;
  } else if (layerStore.activeLayerId !== item.layerId && computedZIndex > 10000) {
    computedZIndex -= 1000;
  }

  const moveAble = !(globalStore.screenConfig.isResponsive && item.instance && item.instance.compAttr.xPercent);
  /** 同步属性信息 */
  const syncAttr = (rect) => {
    // v8.8 地图编辑禁止修改尺寸位置
    if (isEditMap) {
      return;
    }
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

  const getIsActiveDynamicChild = () => {
    const selectComp = window.DataI.getComponentByKey(editorStore.changeKeys[0]); // getComponent(store.changeKeys[0]);
    // 获取当前
    const { instance } = selectComp;
    if (!instance) return false;
    const selectCompDom = instance.container;
    return selectCompDom.parents('.active-dynamic-panel').length > 0;
  };

  const moveEndHandler = (rect) => {
    const isActiveDynamicChild = getIsActiveDynamicChild();
    if ((editorStore.dynamicPanelEditComp && !isActiveDynamicChild) || !moveAble) {
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
    if (editorStore.dynamicPanelEditComp && !isDynamicPanelChild) {
      return;
    }
    const isCtrl = navigator.platform.match('Mac') ? evt.metaKey : evt.ctrlKey;
    if (isCtrl) {
      // v7.6.0 多选组件重复点击需要取消选中组件
      const changeKeys = toJS(editorStore.changeKeys);
      if (changeKeys.includes(item.key)) {
        const keys = changeKeys.filter((key) => {
          return key !== item.key;
        });
        editorStore.changeComponents(keys);
      } else {
        editorStore.addChangeComponents([item.key]);
      }

      return;
    }
    changeMoved(false);
    if (disabled) {
      return;
    }
    editorStore.changeComponents([item.key]);
  };

  const moveHandler = (rect) => {
    // rect拖拽过后x,y,w,h和之前的差值
    const isActiveDynamicChild = getIsActiveDynamicChild();
    if ((editorStore.dynamicPanelEditComp && !isActiveDynamicChild) || !moveAble) {
      return;
    }
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

  const getData = useCallback(() => {
    if (!item.instance) return;
    const { config: instanceConfig } = item.instance;
    if (instanceConfig && instanceConfig._source === 'variableRef') {
      const key = instanceConfig._variable;
      let data = [];
      if (key !== '') {
        data = getDataByKey(key); // 根据key获取全局变量的值
        if (instanceConfig._expression) {
          try {
            data = babelTransform(instanceConfig._expression, data); // 运行时ES6转ES5
          } catch (error) {
            console.error(`变量: ${key} 表达式错误`, error);
          }
        }
      }

      if (Array.isArray(data)) {
        if (data.length === 0 && item.instance && item.instance.chart) {
          item.instance.chart.clear();
        }
        item.instance.setData(data);
      } else {
        console.error(item, data, '依赖的数据格式化后不符合数组格式');
      }
    }
  }, [item.instance, item.instance?.config?._variable]);

  useEffect(() => {
    // renderLayoutCount 触发重新渲染时，已经被渲染到界面中的组件需要判断是否是被操作组件
    const isRender = editorStore.changeKeys.includes(item.key);
    const selector = `[data-key='${item.key}']>.dragger-real-container`;
    // 地图组件都有compKey属性,走新增组件可以正常创建

    if (isRender && item.instance && !item.instance.compKey && ref.current !== undefined) {
      //  复制的组件信息-----
      item.instance._selector = selector;
      item.instance.container = $(selector).find('.ref-component');
      // item.instance.mergeAttr({ dynamicPanelCount: props.dynamicPanelCount });
      // if (item.instance && !item.instance.chart) {
      // } else {
      //   item.instance.init();
      // }
      if (item.instance.chart) {
        // item.instance.mapSourceToData();
      } else {
        item.instance.init();
      }
    } else if (!item.instance) {
      // if (item.layerId != LayerStore.activeLayerId) return;
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
      // 保存时会删除组件的initCom、instance、CssPage
      if (!item.initCom || !item.CssPage) {
        const { index, config: compConfig } = window[item.englishName] as never;
        item.initCom = index;
        item.CssPage = compConfig;
      }
      let InitFn = item.initCom; // 负责渲染的构造函数
      if (InitFn && InitFn.index) {
        InitFn = InitFn.index;
      }
      let instance;
      attr = compatibleChartAttr(attr);
      if (_config) {
        _config.screenConfig = screenConfig;
        _config.version = item.version;
      }
      try {
        $(selector).find('.ref-component').empty();

        // 组件初始化时清除动态数据源保存的数据
        if (_config && _config._source && _config._source === 'dynamic') {
          _config._data = [];
          _config._initData = [];
          item._data = [];
        }
        const styles = item.styles?.width && Number.parseInt(item.styles?.width) !== 0 ? item.styles : undefined;
        instance = new InitFn(selector, _config, attr, shape, styles);
        compatibleChartConfig(instance, item.englishName);
      } catch (error) {
        console.error(error, item, item.name, InitFn, '初始化渲染错误信息-----');
      }
      if (!instance) {
        return;
      }

      if (!item.styles.width || item.styles.width === '0px') {
        if (instance && instance.shapeCss) {
          item.styles.width = instance.shapeCss.width; // datai组件的宽度设置
          item.styles.height = instance.shapeCss.height; // datai组件的高度设置
        } else if (item.cssStyle) {
          item.styles.width = item.cssStyle.width;
          item.styles.height = item.cssStyle.height;
        }
      }

      initInstance(item, instance);
      getData(); // 初次获取变量的值
      // setPreAttr(JSON.stringify(item.instance.compAttr));
      hasInsRef.current = true;

      // 使用模版新增组件
      if (!item.preAttr && item.templateKey) updateCompMergeWithTemplate(item);

      // 新增.粘贴组件时右侧配置栏需要生成instance后刷新显示
      if (editorStore.changeKeys.includes(item.key)) {
        // 刷新右侧配置
        editorStore.forceUpdateAttr();
      }
    }
    if (item.instance && item.instance.compAttr.groupParentKey) {
      delete item.instance.compAttr.groupParentKey;
      item.instance.render();
    }
  }, [
    /* selector, */
    props.dynamicPanelCount,
    getData,
    item,
    item.styles,
    screenConfig,
    editorStore,
    editorStore.renderLayoutCount,
    editorStore.changeKeys,
  ]);

  useEffect(() => {
    // 兼容动态面板切换时组件的渲染
    return () => {
      try {
        if (
          item &&
          item.instance &&
          item.isCustomListChild !== true // 兼容地图成组时不销毁地图实例，不重新创建地图实例
          // && !item.instance.compKey  // 地图组件有 compKey，注释掉。
        ) {
          if (item.instance?.destroy) {
            // 销毁地图子组件
            console.log('销毁地图资源', item?.layers);
            item?.layers?.forEach((sublayer) => {
              sublayer?.instance?.destroy();
            });
            item.instance?.destroy();
          }
          // instance销毁时，保存instance中的config、compAttr 等信息
          if (item.instance) {
            item.preAttr = {
              _attr: JSON.parse(JSON.stringify(item.instance.compAttr)),
              _config: JSON.parse(JSON.stringify(item.instance.config)),
              _data: JSON.parse(JSON.stringify(item.instance._data)),
              _shap: JSON.parse(JSON.stringify(item.instance.shapeCss)),
            };
          }
          item.instance = null;
        }
      } catch (error) {
        console.error('comp组件调用destroy方法失败-', error);
      }
    };
  }, [item]);

  const isDisabled = !editorStore.changeKeys.includes(item.key) || item.comLock;

  const doubleClickEvent = () => {
    clearTimeout(timer);
    timer = null;

    if (eventSetings && eventSetings.doubleClick && eventSetings.doubleClick.length > 0) {
      return eventSetings.doubleClick.forEach((evt, index) => {
        EventEmitter.emit(evt.animateKey, evt, index);
      });
    }

    return false;
  };

  /** 组件初始化 */
  useEffect(() => {
    if (!item.instance) {
      const selectorDragger = `[data-key='${item.key}']>.dragger-real-container`;
      let _config;
      let attr;
      let shape;

      if (item.preAttr) {
        _config = item.preAttr._config;
        attr = item.preAttr._attr;
        shape = item.preAttr._shape;
      }

      try {
        if (!item.initCom) return;
        if (_config) {
          _config.screenConfig = screenConfig;
        }
        const InitCom = item.initCom;
        const styles = item.styles?.width && Number.parseInt(item.styles?.width) !== 0 ? item.styles : undefined;
        const instance = new InitCom(selectorDragger, _config, attr, shape, styles);
        if (!item.styles.width || item.styles.width === '0px') {
          item.styles.width = instance.shapeCss.width;
          item.styles.height = instance.shapeCss.height;
        }

        instance.asyncData();
        initInstance(item, instance);
      } catch (error) {
        console.error(error);
        const key = selectorDragger.replaceAll(/[[\]]/g, '').split('=')[1];
        message.error(`${item.name}-${key}组件，由于数据不符合当前版本，请删除重写或者保存后刷新页面初始化组件`, 10);
      }
    }
  }, [item, screenConfig]);

  const display = item.comInvisible ? 'none' : 'block';

  // 当组件尺寸发生变化的时候重新渲染
  useEffect(() => {
    // 目前只针对做了动画效果的部分组件实现了resize和render的分离，大部分组件还是可以继续调用render调整尺寸
    if (item?.instance?.resize) {
      item?.instance?.resize?.({ width: item?.styles?.width, height: item?.styles?.height });
    } else {
      item?.instance?.render?.();
    }
  }, [item?.instance, item?.styles?.height, item?.styles?.width]);

  useEffect(() => {
    // v8.5.0 地图编辑
    if (isEditMap && item?.instance?._map) {
      const map = item.instance._map;
      // console.log('item.instance', item.instance);
      // 添加延时，保证地图先加载完成
      setTimeout(() => {
        switch (item.englishName) {
          case 'MapFoundationPlan': {
            // 开启交互
            map.setInteractionEnabled(true);
            // 开启拖拽
            map.setDragEnabled(true);
            // 开启缩放
            map.setZoomEnabled(true);
            // // 开启旋转
            // map.setRotateEnabled(true);
            // 强制实时渲染
            if (map._layerRenderConfigTimer) {
              clearTimeout(map._layerRenderConfigTimer);
              map._layerRenderConfigTimer = null;
            }
            if (map._layerAttrObserver) {
              map._layerAttrObserver.disconnect();
              map._layerAttrObserver = null;
            }
            map.setRenderEnabled(true);

            break;
          }
          case 'MapGlFoundationPlan': {
            // 开启交互
            map.setInteractionEnabled(true);
            // 开启缩放
            map.setZoomEnabled(true);
            // 开启拖拽
            map.setDragEnabled(true, 'pan');
            // 开启旋转
            map.setDragEnabled(true, 'rotate');

            break;
          }
          case 'Map3DFoundationPlan': {
            // 开启拖拽
            map.viewer.scene.screenSpaceCameraController.enableRotate = true;
            // 开启缩放
            map.viewer.scene.screenSpaceCameraController.enableZoom = true;
            // 开启旋转
            map.viewer.scene.screenSpaceCameraController.enableTilt = true;
            map.setTiltEnabled(true);
            // 强制实时渲染
            if (map._layerRenderConfigTimer) {
              clearTimeout(map._layerRenderConfigTimer);
              map._layerRenderConfigTimer = null;
            }
            if (map._layerAttrObserver) {
              map._layerAttrObserver.disconnect();
              map._layerAttrObserver = null;
            }
            const viewer = map?.viewer;
            if (viewer) {
              viewer.cesiumWidget.useDefaultRenderLoop = true;
            }

            break;
          }
          default: {
            break;
          }
        }
      }, 500);
    }
  }, [isEditMap, item.englishName, item.instance]);

  /**
   * 监听当前组件绑定的变量(KQ-7421)
   */
  useEffect(() => {
    const listenFn = (data) => {
      getData();
    };
    if (!item.instance) return;
    const { config } = item.instance;
    if (config && config._variable && config._source === 'variableRef') {
      EventEmitter.on(config._variable, listenFn);
    }
    return () => {
      if (item.instance?.config?._variable && listenFn)
        EventEmitter.removeListener(item.instance.config._variable, listenFn);
    };
  }, [item.instance, item.instance?.config?._variable]);

  return (
    <Dragger
      zIndex={zIndex}
      className={isDisabled ? '' : ' change'}
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
      doubleClick={doubleClickEvent}
      disabled={isDisabled}
      moveAble={moveAble}
      css={{ zIndex: computedZIndex, display }}
      item={item}
      filter={props.filterStyle}
    >
      <div
        className='ref-component yl-comp disbale'
        style={{
          width: !style.width || style.width === '0px' ? '100%' : style.width,
          height: !style.height || style.height === '0px' ? '100%' : style.height,
        }}
      />
    </Dragger>
  );
};

export default ComparePropsHocWrap(ComponentType);
