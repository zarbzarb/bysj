import React, { useState, useEffect, useContext } from 'react';
import { initInstance, formatPosition } from '@/utils/transformUtils';
import {
  clickEvent,
  doubleClickEvent,
  tableRowClickEvent,
  valueChangeEvent,
  timeLineValueChangeEvent,
  handleCreateAfterEvent,
  handleBeforeOrAfterDatasetChange,
  mouseEnterEvent, // v7.1鼠标移出事件
  mouseLeaveEvent, // v7.1鼠标移入事件
} from '@/EventHandlers/AnimateEvent';
import TriggerAction from '@/TriggerAction';
import { getDataByKey, setStoreData } from '@/utils/dataStoreUtils';
import { babelTransform, babelTransform3 } from '@/utils/utils';
import { eventInterceptors } from '@/utils/common';
import { hasMouseEvent, reRenderVisibleComp } from '@/utils/componentUtils';
import ScreenConfigContext from '@/pages/Preview/Render/ScreenConfigContext';

const customCompBind = (el) => {
  if (!el.isCustomListChild) return;

  const parentComp = window.DataI(el.parentKey)?.[0];

  if (!parentComp) return;

  if (!parentComp?.customListInsArr) parentComp.customListInsArr = [];

  parentComp?.customListInsArr.push(el);
};

// datai组件渲染
const App = (props) => {
  const EventEmitter = window.globalEventEmitter;
  const { item, zIndex, config } = props;
  const { renderWrapperId } = config;
  const { eventSetings } = item;
  // let selector = `[data-key='${item.key}']`;
  const screenConfigRef = useContext(ScreenConfigContext);
  const positionArr = formatPosition(item.styles.transform);
  const [position, changePosition] = useState(positionArr);

  customCompBind(item);

  const getData = () => {
    if (!item.instance) {
      return;
    }

    const { config } = item.instance;
    if (config && config._source == 'variableRef') {
      const key = config._variable;
      let data = [];
      if (key != '') {
        data = getDataByKey(key); // 根据key获取全局变量的值
        if (config._expression) {
          try {
            data = babelTransform(config._expression, data); // 运行时ES6转ES5
          } catch (error) {
            console.error(`变量: ${key} 表达式错误`, error);
          }
        }
      }

      if (Array.isArray(data)) {
        if (item.instance.chart) {
          if (data.length === 0) {
            item.instance.chart.clear();
          } else {
            item.instance.container.find('p').hide();
          }
        }
        item._data = data;
        item.instance.setData(data);
        if (data.length === 0 && item.instance.chart) {
          item.instance.container.find('p').show();
        }
      } else {
        console.error(item, data, '依赖的数据格式化后不符合数组格式');
      }
    }
  };

  useEffect(() => {
    // 没创建不要执行
    if (item.createFlag === false) {
      return;
    }
    // 新增的组件信息
    let config;
    let attr;
    let shape;
    config = item._config ? item._config : item.preAttr ? item.preAttr._config : undefined;
    attr = item._attr ? item._attr : item.preAttr ? item.preAttr._attr : undefined;
    shape = item._shape ? item._shape : item.preAttr ? item.preAttr._shape : undefined;
    const Comp = window[item.englishName];
    // 判断组件初始化是否依赖变量数据 Sonar add first config
    if (config && config._source && config._source === 'variableRef') {
      let data = [];
      if (config._variable) {
        data = getDataByKey(config._variable); // 根据key获取全局变量的值
        if (config._expression) {
          try {
            data = babelTransform(config._expression, data);
          } catch (error) {
            console.error(`变量: ${config._variable} 表达式错误`, error);
          }
        }
      }

      config.data = data;
      config._data = data;
      config._initData = data;
      item._data = data;
    } else if (config && config._source && config._source === 'dynamic') {
      config._data = [];
      config._initData = [];
      item._data = [];
    } else if (config && !config._source) {
      // 如果没有配置数据源，确保有默认数据
      config._data = config._data || [];
      config._initData = config._initData || [];
      item._data = item._data || [];
    }
    if (!Comp) {
      return;
    }
    const InitCom = Comp.index || Comp;
    let selector = `[data-key='${item.key}']`;
    try {
      const { iocStorageUrl } = window;

      if (item.middleWareFnCode) {
        let code = item.middleWareFnCode || '';
        code = code.trim();
        const bool = code.indexOf('function') == 0 || code.indexOf('(function') == 0;
        // const middleWareFn = !bool
        //   ? babelTransform3(code)
        //   : babelTransform4(code)();
        const middleWareFn = babelTransform3(code);
        shape = middleWareFn;
      }
      if (renderWrapperId) {
        // let selectorTmp = `#screen-${renderWrapperId} ${selector}`;
        // $(selectorTmp).length > 0 && (selector = selectorTmp);
        const selectorTmp = `screen-${renderWrapperId} ${selector}`;
        const dom = document.getElementById(selectorTmp);
        if (dom) {
          selector = `#${selectorTmp}`;
        }
      }

      // const typeArr = [
      //   ...mapBaseLayerType,
      //   '@yl/datai-com-map-foundationPlan', // 2d底图
      //   '@yl/datai-com-map-3D-FoundationPlan' // 3d底图
      // ];
      // if (typeArr.indexOf(item.type) > -1 && !!item.instance) {
      //   return; // 已经创建过的地图图层不能重复创建
      // }
      if (item.instance) return; // 避免二次渲染

      // 如果 config 不存在，使用默认配置
      if (!config) {
        config = {};
      }

      // 将 screenConfig 配置保存到每个组件，datai-core.js 从组件实例取 screenConfig，以避免跟卡片中的 screenConfig 相互影响
      config.screenConfig = screenConfigRef.current || {};
      // 确保 screenConfig 包含组件库期望的必要属性
      if (!config.screenConfig.scrollBarStyles) {
        config.screenConfig.scrollBarStyles = { size: 6, bgColor: 'rgba(0,0,0,0.2)' };
      }
      if (!config.screenConfig.fontSize) {
        config.screenConfig.fontSize = '14px';
      }
      if (config.screenConfig.mouseType === undefined) {
        config.screenConfig.mouseType = 1;
      }
      // 组件的版本
      config.version = item.version;

      const instance = new InitCom(selector, config, attr, shape, item.styles); // 初始化datai组件
      if (!item.styles.width || item.styles.width == '0px') {
        item.styles.width = instance.shapeCss.width;
        item.styles.height = instance.shapeCss.height;
      }
      
      // 如果有数据，设置数据；否则确保组件有默认显示
      if (item._data && item._data.length > 0) {
        instance.setData(item._data);
      } else if (instance.setData) {
        // 尝试设置空数据，确保组件正常渲染
        try {
          instance.setData([]);
        } catch (e) {
          // 忽略设置空数据的错误
        }
      }
      
      // 只有配置了数据源才调用 asyncData
      if (config && (config._source === 'variableRef' || config._source === 'dynamic')) {
        instance.asyncData();
      }
      initInstance(item, instance); // 地图子组件生成 instance 且渲染地图子组件
      const itemTypes = [
        '@yl/datai-com-map-3D-FoundationPlan',
        '@yl/datai-com-map-foundationPlan',
        '@yl/datai-com-map-gl-FoundationPlan',
      ];

      // hook中获取地图map instance
      if (itemTypes.includes(item.type)) {
        item.getMapInstanceCallBack && item.getMapInstanceCallBack(item);
      }

      // 组件创建后事件触发
      handleCreateAfterEvent({ item, config: props.config });
      handleBeforeOrAfterDatasetChange(item, props.config);
      // 此处代码导致初始化报表不渲染，具体原因和报表组件render方法中防止重复渲染判断逻辑相关
      // let data = getData();
    } catch (error) {
      // let key = selector.replace(/[\[\]]/g, '').split('=')[1];
      console.error(error); // 实例化datai组件可能出错,需要捕获错误信息
    }
  }, [item, item.createFlag]);

  useEffect(() => {
    // 销毁地图对象
    return () => {
      try {
        // 销毁地图子组件
        item?.layers?.forEach((sublayer) => {
          sublayer?.instance?.destroy();
        });
        // item && item.instance && item.instance?.destroy();
        if (item && item.instance && item.instance?.destroy) {
          item.instance?.destroy();
        }
        // 兼容动态面板、图层搜索组件涉及到组件在页面中销毁、需要重新渲染
        item.instance = null;
      } catch (error) {
        console.error('comp组件调用destroy方法失败-', error);
      }
    };
  }, [item, item.createFlag]); // 创建销毁也需要释放资源

  /**
   * 监听当前组件绑定的变量(v8.1.0 由监听 mapCompIds 中组件key 改为监听变量 key, 和 antd 类型组件保持统一)
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
  }, []);

  // v7.4 选中值变化后更新组件渲染
  const updateCompRender = (item, data, variableKey) => {
    const types = ['@yl/datai-com-text-tabs-select']; // 选中值需要支持双向绑定的组件
    if (types.includes(item.type)) {
      if (item.instance?.config?.changeValueVariable) {
        item.instance.config.changeValueVariable.data = data;
        item.instance.render();
      } else if (item.instance?.config) {
        item.instance.config.changeValueVariable = {
          variableKey,
          data,
        };
        item.instance.render();
      }
    }
  };

  /**
   * datai组件选中值事件 双向绑定
   */
  useEffect(() => {
    const listenFnMap = {};

    if (Array.isArray(item.eventSetings)) {
      const events = item.eventSetings.filter((event) => event.eventType === 'changeValue');
      events.forEach((event) => {
        event.groups?.forEach((ag, idx) => {
          if (ag.variable) {
            const listenFn = (data) => {
              // 变量变化后重新渲染组件
              updateCompRender(item, data, ag.variable);

              // 条件拦截
              const validate = eventInterceptors(event, ag, idx);
              if (!validate) return;

              // 变量表达式拦截
              const str = ag.expression || 'data';
              const result = babelTransform(str, data); // 运行时ES6转ES5
              if (!result) return;

              const { actions = [] } = ag;
              actions.forEach((action) => {
                TriggerAction(action, {
                  item,
                  events,
                  expressionValue: data,
                  config,
                  actions,
                });
              });
            };

            listenFnMap[ag.variable] = listenFn;
            EventEmitter.on(ag.variable, listenFn);
          }
        });
      });
    }

    return () => {
      Object.entries(listenFnMap).forEach(([key, fn]) => EventEmitter.removeListener(key, fn));
    };
  }, []);

  // 查找选中值存在哪个变量
  const getChangeValueVariable = () => {
    let ret = '';
    const list = item.eventSetings || [];
    const changeValueEvent = list.find(
      (item) =>
        item.eventType === 'changeValue' ||
        item.eventType === 'tableRowClick' || // tableRowClick用于单击表格行
        item.eventType === 'treeRowClick', // treeRowClick用于单击列表行
    );
    if (!changeValueEvent) return ret;

    const { variable = '' } = changeValueEvent;
    ret = variable;
    return ret;
  };

  useEffect(() => {
    // 文字轮播列表组件添加行点击事件
    if (
      item.type.includes('@yl/datai-com-text-carouseltextlist') &&
      item.eventSetings?.filter((action) => action.eventType === 'tableRowClick').length > 0
    ) {
      item.instance &&
        item.instance.bindClick(function (index, data) {
          tableRowClickEvent(item.eventSetings, config, data, item, index); // instance不一定存在
        });
    }

    // tab切换组绑定值改变事件
    if (item.type.includes('@yl/datai-com-text-tabs-group')) {
      item.instance &&
        item.instance.bindChange(function (index, data) {
          // v8.5.1 tab切换组添加选中值
          item.selectedValue = data;
          item.selectedIndex = index;
          if (item.eventSetings?.filter((action) => action.eventType === 'changeValue').length > 0) {
            valueChangeEvent(item.eventSetings, config, data, index, item); // instance不一定存在
          }
        });
    }
    // v7.4 选择面板选中值事件
    if (item.type.includes('@yl/datai-com-text-tabs-select') && item.instance) {
      // 如果配置了选中值，初始化优先使用选中值渲染
      const changeValueVariable = getChangeValueVariable();
      if (changeValueVariable && item.instance.config) {
        item.instance.config.changeValueVariable = {
          variableKey: changeValueVariable,
          data: getDataByKey(changeValueVariable), // 根据key获取全局变量的值
        };
      }
      // 监听点击后设置选中值
      item.instance.bindChange(function (activeIndexArr, data) {
        const value = data.map((d) => d.text).join(',');
        // console.log('tabs-select ==>', data, value);
        // v8.5.1 选择面板添加选中值
        item.selectedValue = data;
        item.selectedIndex = activeIndexArr;
        if (item.eventSetings?.filter((action) => action.eventType === 'changeValue').length > 0) {
          timeLineValueChangeEvent(item.eventSetings, config, value, activeIndexArr, item); // instance不一定存在
        }
      });
    }
    // v6-18时间轴绑定值改变事件
    // console.log('ComRender item=', item);
    if (item.type.includes('@yl/datai-com-time-line')) {
      item.instance &&
        item.instance.setSelectTimeCallback(function (data, index) {
          // v8.5.1 时间轴添加选中值
          item.selectedValue = data;
          item.selectedIndex = index;
          // console.log('time-line ==>', data);
          if (item.eventSetings?.filter((action) => action.eventType === 'changeValue').length > 0) {
            timeLineValueChangeEvent(item.eventSetings, config, data, index, item); // instance不一定存在
          }
        });
    }
    // v8.1.0 动态词云增加选中值事件
    if (item.type.includes('@yl/datai-com-dynamic-wordcloud')) {
      item.instance &&
        item.instance.bindChangeValue &&
        item.instance.bindChangeValue(function (data, index) {
          // v8.5.1 动态词云添加选中值
          item.selectedValue = data;
          item.selectedIndex = index;
          if (item.eventSetings?.filter((action) => action.eventType === 'changeValue').length > 0) {
            timeLineValueChangeEvent(item.eventSetings, config, data, index, item); // instance不一定存在
          }
        });
    }
    return () => {};
  }, [item.createFlag]);

  /** 柱状图拖动事件 */
  useEffect(() => {
    let eventSetings;
    let listenFn;
    let lisEventKey;
    const listenFnList = [];
    if (item.eventSetings) {
      const list = item.eventSetings || [];
      lisEventKey = `__${item.key}_mouseDragEvent`;
      eventSetings = list.filter((vl) => vl.eventType == 'mouseDrag' && vl.variable);
      if (eventSetings && eventSetings.length > 0) {
        eventSetings.forEach((eventSet) => {
          // console.log('_mouseDragEvent**eventSetings***', item, eventSet);
          listenFn = (data) => {
            setStoreData(eventSet.variable, data);
            // 选中表达式,用于监听选中变量
            try {
              const expression = eventSet.expression || 'data';
              const bool = babelTransform(expression, data); // 运行时ES6转ES5
              if (bool) {
                const { actions = [] } = eventSet;
                actions.forEach((action) => {
                  TriggerAction(action, {
                    item,
                    events: list,
                    config,
                    actions,
                  });
                });
              }
            } catch {}
          };
          EventEmitter.on(`__${item.key}_mouseDragEvent`, listenFn);
          listenFnList.push(listenFn);
        });
      }
    }
    return () => {
      listenFnList.forEach((item, index) => {
        EventEmitter.removeListener(lisEventKey, listenFnList[index]);
      });
    };
  }, []);

  useEffect(() => {
    if (item.createFlag && !item.showFlag && item.type === '@yl/datai-com-map-foundationPlan') {
      reRenderVisibleComp(item, item.showFlag ? '0' : '1'); // 二维地图组件特殊处理
    }
  }, [item.createFlag, item.showFlag]);

  // 播放器资源加载后再次刷新
  // useEffect(() => {
  //   if (item.type === '@yl/datai-com-media-mp4-player') {
  //     loadVideoJS().then(() => {
  //       forceUpdate();
  //     });
  //   }
  //   return () => {};
  // }, [forceUpdate]);

  // 是否走新的创建销毁逻辑
  const { createFlag, showFlag } = item;
  // if (!createFlag) {
  //   item.instance = null; // 销毁的时候需要重置
  // }

  let scaleStyle = {};
  let mapProps = {}; // 地图组件标记
  // 这样判断考虑没有createFlag的老屏兼容性
  if (createFlag !== false) {
    if (item._attr && item._attr.fullScreen) {
      item.styles.width = '100%';
      item.styles.height = '100%';
      item.styles.transform = 'translate(0,0)';
    }

    item.styles.transform = `translate(${position[0]}px, ${position[1]}px)`;

    if (item.type.includes('@yl/datai-com-map')) {
      const width = document.body.clientWidth;
      const height = document.body.clientHeight; // 获取屏幕宽高
      const w = config.width;
      const h = config.height; // 获取设置的大屏容器宽高
      const compWidth = item.styles.width;
      const compHeight = item.styles.height;
      const xScale = (width / w).toFixed(4) / 1; // 计算正向x缩放比例
      const yScale = (height / h).toFixed(4) / 1; // 计算正向y缩放比例
      const reXScale = (w / width).toFixed(4) / 1; // 计算反向x缩放比例
      const reYScale = (h / height).toFixed(4) / 1; // 计算反向y缩放比例

      scaleStyle = {
        // transform: `scaleX(${reXScale}) scaleY(${reYScale})`,
        // transformOrigin: 'left top',
        // width: parseInt(compWidth) * xScale + 'px',
        // height: parseInt(compHeight) * yScale + 'px'
      };
      if (config.scale == 'scale') {
        scaleStyle = {
          transform: `scaleX(${reXScale}) scaleY(${reYScale})`,
          transformOrigin: 'left top',
          width: `${Number.parseInt(compWidth) * xScale}px`,
          height: `${Number.parseInt(compHeight) * yScale}px`,
        };
      } else if (config.scale == 'scaleWidth') {
        scaleStyle = {
          transform: `scaleX(${reXScale})`,
          transformOrigin: 'left top',
          height: `${Number.parseInt(compHeight) * xScale}px`,
        };
      } else if (config.scale == 'scaleHeight') {
        scaleStyle = {
          transform: `scaleY(${reYScale})`,
          transformOrigin: 'left top',
          width: `${Number.parseInt(compWidth) * yScale}px`,
        };
      }
      mapProps = { 'data-map': true };
    }
  }
  const extraStyles = {};
  if (hasMouseEvent(item) && config.mouseType === 1) {
    extraStyles.cursor = 'pointer';
  }

  return createFlag === undefined ? (
    <div
      key={item.key}
      className='comp'
      style={{
        display: item.hideFlag && item.type !== '@yl/datai-com-map-foundationPlan' && 'none',
        ...item.styles,
        zIndex,
        position: 'absolute',
        filter: props.filter,
        ...extraStyles,
      }}
      data-key={item.key}
      onClick={() => clickEvent(eventSetings, config, item)}
      onDoubleClick={() => doubleClickEvent(eventSetings, config, item)}
      onMouseEnter={() => mouseEnterEvent(eventSetings, config, item)}
      onMouseLeave={() => mouseLeaveEvent(eventSetings, config, item)}
    >
      <div {...mapProps} style={{ ...scaleStyle }} className='ref-component' />
    </div>
  ) : (
    createFlag && (
      <div
        key={item.key}
        className='comp perf-comp'
        style={{
          display: !showFlag && item.type !== '@yl/datai-com-map-foundationPlan' && 'none',
          ...item.styles,
          zIndex,
          position: 'absolute',
          filter: props.filter,
          ...extraStyles,
        }}
        data-key={item.key}
        onClick={() => clickEvent(eventSetings, config, item)}
        onDoubleClick={() => doubleClickEvent(eventSetings, config, item)}
        onMouseEnter={() => mouseEnterEvent(eventSetings, config, item)}
        onMouseLeave={() => mouseLeaveEvent(eventSetings, config, item)}
      >
        <div {...mapProps} style={{ ...scaleStyle }} className='ref-component' />
      </div>
    )
  );
};

export default App;
