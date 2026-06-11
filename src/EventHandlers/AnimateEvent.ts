import { setStoreData } from '@/utils/dataStoreUtils';

import TriggerAction from '@/TriggerAction';
import { antdLog } from '@/utils/log';
import { eventInterceptors, getDataset } from '@/utils/common';
import _ from 'lodash';
import { setDataset, render } from '@/TriggerAction/updateData/config';

export const visiableToggleHandler = (animateItem) => {
  const key = animateItem.associatComponents;
  const selector = `[data-key="${key}"]`;
  const el = document.querySelector(selector);
  if (animateItem.settings.showHideType) {
    switch (animateItem.settings.showHideType) {
      case 'hide': {
        el.classList.add('hidden');
        break;
      }
      case 'show': {
        el.classList.remove('hidden');
        break;
      }
      case 'toggle': {
        el.classList.toggle('hidden');
        break;
      }
      default: {
        break;
      }
    }
  }
};

// 初始化
export const initRender = (item, config) => {
  const events = item?.eventSetings ?? [];
  if (events.length === 0) return;
  const event = events.find((itemFd) => itemFd.eventType === 'initialization');
  if (event === undefined) return;

  event.groups?.forEach((ag, agIdx) => {
    // 事件条件拦截
    if (!eventInterceptors(event, ag, agIdx)) return;

    const actions = ag.actions || [];
    if (actions && actions.length > 0) {
      antdLog(item, '动作初始化');
    }

    for (const action of actions) {
      // 阻止页面跳转后,当前页面刷新，主页初始化跳转及后面事件多次执行问题
      if (
        window.location.href.includes('subPageId') &&
        item.appPageId === config.homePageId &&
        action.actionType === 'jumpPage'
      ) {
        break;
      }
      if (action.actionType === 'eventEmit') {
        // 初始化的时候延迟事件发布,避免丢失刚开始需要监听的事件
        const timer = setTimeout(() => {
          TriggerAction(action, {
            item,
            events,
            config,
            actions,
          });
          clearTimeout(timer);
        });
      } else {
        TriggerAction(action, {
          item,
          events,
          config,
          actions,
        });
      }
    }
  });
};

// 单击
export const clickEvent = (eventSetings = [], config, item) => {
  if (!Array.isArray(eventSetings)) return;

  if (eventSetings.length === 0) return;

  const events = eventSetings.filter((i) => i.eventType === 'click');

  if (events.length === 0) return;

  events.forEach((event) => {
    event.groups?.forEach((ag, agIdx) => {
      // 事件条件拦截
      const validate = eventInterceptors(event, ag, agIdx);
      if (!validate) return;

      const actions = ag.actions || [];
      actions?.forEach((action) => {
        TriggerAction(action, { config, actions, events: eventSetings, item, agIdx });
      });
    });
  });
};

// 双击
export const doubleClickEvent = (eventSetings, config, item) => {
  if (!Array.isArray(eventSetings)) return;

  if (eventSetings.length === 0) return;

  const events = eventSetings.filter((i) => i.eventType === 'doubleClick');

  if (events.length === 0) return;

  events.forEach((event) => {
    event.groups?.forEach((ag, agIdx) => {
      // 事件条件拦截
      const validate = eventInterceptors(event, ag, agIdx);
      if (!validate) return;

      const actions = ag.actions || [];
      actions?.forEach((action) => {
        TriggerAction(action, { config, actions, events: eventSetings, item, agIdx });
      });
    });
  });
};

// 回车
export const enterEvent = (eventSetings, config, item) => {
  if (!Array.isArray(eventSetings)) return;

  if (eventSetings.length === 0) return;

  const event = eventSetings.find((i) => i.eventType === 'enterHandler');
  if (event === undefined) return;

  event.groups?.forEach((ag, agIdx) => {
    // 事件条件拦截
    const validate = eventInterceptors(event, ag, agIdx);
    if (!validate) return;

    const actions = ag.actions || [];
    actions?.forEach((action) => {
      TriggerAction(action, { config, actions, events: eventSetings, item });
    });
  });
};

// 单击表格行
export const tableRowClickEvent = (eventSetings, config, data, item = {}, index = 0) => {
  if (!Array.isArray(eventSetings)) return;
  if (eventSetings.length === 0) return;
  const event = eventSetings.find(
    (itemFd) => itemFd.eventType === 'tableRowClick' || itemFd.eventType === 'treeRowClick',
  );
  if (event === undefined) return;

  event.groups?.forEach((ag, agIdx) => {
    // 事件条件拦截
    const validate = eventInterceptors(event, ag, agIdx);
    if (!validate) return;

    // v8.5.0 单击表格行事件如果选择了变量，则单击行时将当前行数据写入变量
    event.singleValue = data; // 选中值还是存储到事件上
    event.rowIndex = index;
    if (ag.variable) {
      setStoreData(ag.variable, data); // 更新全局存储的变量数据
    }
    const actions = ag.actions || [];
    actions?.forEach((action) => {
      TriggerAction(action, { item, config, actions, events: eventSetings });
    });
  });
};

// 表格分页
export const tablePaginationEvent = (eventSetings, config, data, item = {}) => {
  if (!Array.isArray(eventSetings)) return;
  if (eventSetings.length === 0) return;
  const event = eventSetings.find((evt) => evt.eventType === 'tablePagination' || evt.eventType === 'listPagination');
  if (event === undefined) return;

  event.groups?.forEach((ag, agIdx) => {
    // 事件条件拦截
    const validate = eventInterceptors(event, ag, agIdx);
    if (!validate) return;

    // 分页事件如果选择了变量，则将当前改变的页码和pageSize写入变量
    if (ag.variable) {
      setStoreData(ag.variable, data); // 更新全局存储的变量数据
    }
    const actions = ag.actions || [];
    actions?.forEach((action) => {
      TriggerAction(action, { item, config, actions, events: eventSetings });
    });
  });
};

// 表格操作列
export const tableColumnClickEvent = (eventSetings, config, data, item = {}) => {
  if (!Array.isArray(eventSetings)) return;
  if (eventSetings.length === 0) return;
  // 过滤对应的数据操作项
  const event = eventSetings.find((evt) => evt.eventType === 'tableColumnClick');
  if (event === undefined) return;

  event.groups?.forEach((ag, agIdx) => {
    // 事件条件拦截
    const validate = eventInterceptors(event, ag, agIdx);
    if (!validate) return;

    if (ag.actionKey !== data.actionKey) return;

    event.singleValue = data; // 选中值还是存储到事件上

    // 表格操作列事件如果选择了变量，则单击行时将当前行数据写入变量
    if (ag.variable) {
      setStoreData(ag.variable, data); // 更新全局存储的变量数据
    }
    const actions = ag.actions || [];
    actions?.forEach((action) => {
      TriggerAction(action, { item, config, actions, events: eventSetings });
    });
  });
};

// 值改变事件
export const valueChangeEvent = (eventSetings, config, data, index, item) => {
  if (!Array.isArray(eventSetings)) return;
  if (eventSetings.length === 0) return;
  // 值改变可以绑定多次
  const events = eventSetings.filter((evt) => evt.eventType === 'changeValue');
  if (events.length === 0) return;
  events.forEach((event) => {
    event.groups?.forEach((ag, agIdx) => {
      if (ag.index !== index) return;
      const validate = eventInterceptors(event, ag, agIdx);
      if (!validate) return;

      event.singleValue = data;
      event.selectedIndex = index;

      const { variable } = ag;
      if (variable) {
        setStoreData(variable, data); // 更新全局存储的变量数据，
      }

      const actions = ag.actions || [];
      actions?.forEach((action) => {
        TriggerAction(action, { item, config, actions, events: eventSetings });
      });
    });
  });
};

/** 时间轴、选择面板选中值存到变量（这是一个通用函数，可以复用） */
export const timeLineValueChangeEvent = (eventSetings, config, data, index, item = {}) => {
  if (!Array.isArray(eventSetings)) return;
  if (eventSetings.length === 0) return;
  const events = eventSetings.filter((event) => {
    return (
      event.eventType === 'changeValue' // 存在多个选中值事件
    );
  });
  events.forEach((event) => {
    event.groups?.forEach((ag, idx) => {
      const validate = eventInterceptors(event, ag, idx);
      if (!validate) return;
      // v8.5.0 如果选中值选择了变量，则选中值时将当前选中值写入变量
      event.singleValue = data;
      // v8.5.1 新增选中序号
      event.selectedIndex = index;

      const { variable } = ag;

      if (variable) {
        setStoreData(variable, data); // 更新全局存储的变量数据，
      } else {
        // 选中表达式,用于监听选中变量是否可以触发动作（注意：执行该函数的文件中 CompRender.js 有监听选中值变量变化执行交互的逻辑，这里不需要了，否则重复了）
        // v8.5.1选中值事件无变量直接触发，
        const actions = ag.actions || [];
        actions?.forEach((action) => {
          TriggerAction(action, {
            item,
            config,
            actions,
            events: eventSetings,
          });
        });
      }
    });
  });
};

export const emitEvent =
  (evtType) =>
  (eventSetings = [], config, item = {}) => {
    if (!Array.isArray(eventSetings)) return;
    if (eventSetings.length === 0) return;
    const event = eventSetings.find((evt) => evt.eventType === evtType);
    if (event === undefined) return;

    event.groups?.forEach((ag, agIdx) => {
      // 事件条件拦截
      const validate = eventInterceptors(event, ag, agIdx);
      if (!validate) return;

      const actions = ag.actions || [];
      actions?.forEach((action) => {
        TriggerAction(action, { config, actions, events: eventSetings, item });
      });
    });
  };

// v7.1 鼠标移入
export const mouseEnterEvent = emitEvent('mouseenter');

// v7.1 鼠标移出
export const mouseLeaveEvent = emitEvent('mouseleave');

export const blurEvent = emitEvent('blur');

// v8.3 监听事件
export const listenEvent = (eventSetings = [], config) => {};

export const handleDestroyBeforeEvent = emitEvent('destroyBefore');
export const handleDestroyAfterEvent = emitEvent('destroyAfter');

// 组件创建后事件处理
export const handleCreateAfterEvent = ({ item, config }) => {
  let eventSetings = [];

  if (item?.createFlag === false) return;

  if (item?._createAfterEvtTrigger) return;

  if (Array.isArray(item.eventSetings)) eventSetings = item.eventSetings;

  const event = eventSetings.find((evt) => evt.eventType === 'createAfter');

  if (!event) return;

  event.groups?.forEach((ag, idx) => {
    // 事件条件拦截
    const validate = eventInterceptors(event, ag, idx);
    if (!validate) return;

    const actions = ag?.actions ?? [];
    for (const action of actions) {
      // 阻止页面跳转后,当前页面刷新，主页初始化跳转及后面事件多次执行问题
      if (
        window.location.href.includes('subPageId') &&
        item.appPageId === config.homePageId &&
        action.actionType === 'jumpPage'
      ) {
        break;
      }
      TriggerAction(action, {
        item,
        events: eventSetings,
        config,
        actions,
      });
    }
  });

  item._createAfterEvtTrigger = true;
};

export const handleCreateAfterEventAfterFirstTime = (comp, config) => {
  if (!comp?._createAfterEvtTrigger || comp?.classType === 'group') return;

  const evts = comp?.eventSetings?.filter((evt) => evt.eventType === 'createAfter') ?? [];

  evts.forEach((event) => {
    event.groups?.forEach((ag, idx) => {
      const validate = eventInterceptors(event, ag, idx);
      if (!validate) return;
      const actions = ag.actions ?? [];
      actions?.forEach((action) =>
        TriggerAction(action, {
          comp,
          events: evts,
          config,
          actions,
        }),
      );
    });
  });
};

/**
 * @param {string} itemKey
 * @param {*} tmp
 */
const getOrInitElByCompKey = (itemKey, tmp) => {
  const el =
    tmp ??
    document.querySelector(`[data-key="${itemKey}"]`) ??
    document.querySelector(`[data-key="@com_${itemKey}"]`) ??
    null;

  tmp = el;

  return el;
};

// 数据变化前后
export const handleBeforeOrAfterDatasetChange = (comp, config) => {
  if (comp?.classType === 'group' || comp?.isInsHijacked) return;

  const dataHijacking = (forHijack, beforeChangeEvts, afterChangeEvts) => {
    if (!forHijack || comp?.isInsHijacked || !_.isObject(forHijack)) return forHijack;

    const proxy = new Proxy(forHijack, {
      set(target, prop, value) {
        if (!value || prop !== '_data' || _.isEqual(target?.[prop], value)) {
          Reflect.set(target, prop, value);
          return true;
        }

        // 数据更新前
        beforeChangeEvts.forEach((evt) =>
          evt.groups
            ?.filter((ag, agIdx) => eventInterceptors(evt, ag, agIdx))
            ?.map((ag) => ag.actions.map((act, _idx, acts) => [act, acts]))
            ?.flat()
            ?.forEach(([act, actions]) =>
              TriggerAction(act, {
                item: comp,
                events: beforeChangeEvts,
                config,
                actions,
              }),
            ),
        );
        Reflect.set(target, prop, value);

        // 数据更新后
        afterChangeEvts.forEach((evt) =>
          evt.groups
            ?.filter((ag, agIdx) => eventInterceptors(evt, ag, agIdx))
            ?.map((ag) => ag.actions.map((act, _idx, acts) => [act, acts]))
            ?.flat()
            ?.forEach(([act, actions]) =>
              TriggerAction(act, {
                item: comp,
                events: afterChangeEvts,
                config,
                actions,
              }),
            ),
        );

        return true;
      },
    });

    comp.isInsHijacked = true;

    return proxy;
  };

  const beforeChangeEvts = comp?.eventSetings?.filter((evt) => evt.eventType === 'beforeDataChange') ?? [];
  const afterChangeEvts = comp?.eventSetings?.filter((evt) => evt.eventType === 'afterDataChange') ?? [];

  if (beforeChangeEvts.length <= 0 && afterChangeEvts.length <= 0) return;

  if (comp.classType === 'antd' && comp?.dataset) {
    comp.dataset = dataHijacking(comp.dataset, beforeChangeEvts, afterChangeEvts);
    return;
  }

  if (comp.classType === 'customComp' && comp?.dataset?._data) {
    comp.dataset = dataHijacking(comp.dataset, beforeChangeEvts, afterChangeEvts);
    return;
  }

  if (comp.classType === 'com' && comp?.instance) {
    comp.instance = dataHijacking(comp.instance, beforeChangeEvts, afterChangeEvts);
    return;
  }
};

/** @type {{ isWithShowup: {[k: string]: boolean}; isWithHide: {[k: string]: boolean}}} */
const BEFORE_SHOWUP_OR_HIDE_COMP_ID_MAP = { isWithShowup: {}, isWithHide: {} };

/**
 * @param {*} targetComp
 * @param {'beforeShowUp' | 'beforeHide'} evtType
 * @returns {boolean}
 */
const getOrInitIsWithBeforeShowUpOrHide = (targetComp, evtType) =>
  (evtType === 'beforeShowUp'
    ? BEFORE_SHOWUP_OR_HIDE_COMP_ID_MAP.isWithShowup[targetComp.key]
    : BEFORE_SHOWUP_OR_HIDE_COMP_ID_MAP.isWithHide[targetComp.key]) ??
  (() => {
    const ans = targetComp?.eventSetings?.some((evt) => evt.eventType === evtType) ?? false;

    switch (evtType) {
      case 'beforeShowUp': {
        BEFORE_SHOWUP_OR_HIDE_COMP_ID_MAP.isWithShowup[targetComp.key] = ans;
        break;
      }
      case 'beforeHide': {
        BEFORE_SHOWUP_OR_HIDE_COMP_ID_MAP.isWithHide[targetComp.key] = ans;
        break;
      }
      default: {
        console.error('未知事件:', evtType, ', 你是不是拼写错了?');
        return [false, null];
      }
    }

    return ans;
  })();

/**
 * @param {*} targetComp
 * @param {'showup' | 'hide' | 'switch'} visible
 * @param {*} config
 */
export const handleBeforeShowUpOrHide = (targetComp, visible, config) => {
  if (!targetComp) return;

  let el;

  const isDoShowup =
    visible === 'showup'
      ? true
      : visible === 'switch'
      ? !(
          getOrInitElByCompKey(targetComp.key, el)?.style?.display !== 'none' &&
          el?.style?.visibility !== 'hidden' &&
          Number.parseFloat(el?.style?.opacity) !== 0
        )
      : false;

  const isDoHide =
    visible === 'hide'
      ? true
      : visible === 'switch'
      ? getOrInitElByCompKey(targetComp.key, el)?.style?.display !== 'none' &&
        el?.style?.visibility !== 'hidden' &&
        Number.parseFloat(el?.style?.opacity) !== 0
      : false;

  if (isDoShowup && getOrInitIsWithBeforeShowUpOrHide(targetComp, 'beforeShowUp')) {
    const event = targetComp.eventSetings?.find((evt) => evt.eventType === 'beforeShowUp');
    if (!event) return;

    event.groups?.forEach((ag, idx) => {
      const validate = eventInterceptors(event, ag, idx);
      if (!validate) return;

      const actions = ag.actions ?? [];
      actions?.forEach((action) => {
        TriggerAction(action, {
          item: targetComp,
          events: targetComp.eventSetings,
          config,
          actions,
        });
      });
    });
  }

  if (isDoHide && getOrInitIsWithBeforeShowUpOrHide(targetComp, 'beforeHide')) {
    const event = targetComp.eventSetings?.find((evt) => evt.eventType === 'beforeHide');
    if (!event) return;

    event.groups?.forEach((ag, idx) => {
      const validate = eventInterceptors(event, ag, idx);
      if (!validate) return;

      const actions = ag.actions ?? [];
      actions?.forEach((action) => {
        TriggerAction(action, {
          item: targetComp,
          events: targetComp.eventSetings,
          config,
          actions,
        });
      });
    });
  }
};

/** @type {{[k: string]: MutationObserver}} */
const observerMap = {};

/** @type {(str: string) => number | null} */
const matchOpacity = (str) => {
  const matchRes = str.match(/opacity: (.*?);/);

  if (!matchRes) return 1;

  return Number.parseFloat([...matchRes]?.[0]?.replace('opacity: ', '').replace(';', '')) ?? null;
};

/** @type {(visibleFn: (isVisibleBefore: boolean, isVisibleNow: boolean, mut: MutationRecord) => void, itemKey: string) => } */
const bindVisibleObserver = (visibleFn, itemKey) => {
  const el = (document.querySelector(`[data-key="${itemKey}"]`) ??
    document.querySelector(`[data-key="@com_${itemKey}"]`) ??
    null) as HTMLDivElement | null;

  if (!el) return;

  /** @type {MutationCallback} */
  const observerEachCallback = (mutations) => {
    mutations.forEach((mut) => {
      window.observerMap = observerMap;

      const oldValueOpacity = matchOpacity(mut.oldValue);

      const isVisibleBefore =
        !mut.oldValue.includes('display: none;') &&
        (oldValueOpacity || oldValueOpacity > 0) &&
        !(observerMap[itemKey]?.lastSetVisibility === 'hidden');

      const isVisibleNow =
        mut.target.style.display !== 'none' &&
        mut.target.style.visibility !== 'hidden' &&
        Number.parseFloat(mut.target.style.opacity === '' ? 1 : mut.target.style.opacity) > 0;

      observerMap[itemKey].lastSetVisibility = mut.target.style.visibility;

      visibleFn(isVisibleBefore, isVisibleNow, mut);
    });
  };

  const observer = observerMap[itemKey]?.observer ?? new MutationObserver(observerEachCallback);

  observer.observe(el, {
    attributes: true,
    attributeFilter: ['style'],
    attributeOldValue: true,
    characterData: true,
  });

  observerMap[itemKey] = {
    observer,
    lastSetVisibility: el?.style?.visibility,
  };
};

export const handleAfterShowUpOrHidden = (item, config) => {
  const hiddenEvts = item?.eventSetings?.filter((evt) => evt.eventType === 'afterHidden') ?? [];
  const showUpEvts = item?.eventSetings?.filter((evt) => evt.eventType === 'afterShowUp') ?? [];

  if (hiddenEvts.length <= 0 && showUpEvts.length <= 0) return;

  bindVisibleObserver((isVisibleBefore, isVisibleNow, mut) => {
    if (hiddenEvts.length > 0 && isVisibleBefore && !isVisibleNow) {
      if (mut.target.style.visibility !== 'hidden') delete mut.target.style.opacity;

      hiddenEvts.forEach((event) => {
        event.groups?.forEach((ag, idx) => {
          const validate = eventInterceptors(event, ag, idx);
          if (!validate) return;
          const actions = ag.actions ?? [];
          actions?.forEach((action) => {
            TriggerAction(action, {
              item,
              events: hiddenEvts,
              config,
              actions,
            });
          });
        });
      });
    }

    if (showUpEvts.length > 0 && !isVisibleBefore && isVisibleNow) {
      showUpEvts.forEach((event) => {
        event.groups?.forEach((ag, idx) => {
          const validate = eventInterceptors(event, ag, idx);
          if (!validate) return;
          const actions = ag.actions ?? [];
          actions?.forEach((action) => {
            TriggerAction(action, {
              item,
              events: showUpEvts,
              config,
              actions,
            });
          });
        });
      });
    }
  }, item.key);
};

// 将普通格式的数据，转换为 xys 格式的数据
const normalDataToXYS = (data, xMapField = 'x') => {
  const res = [];
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== 'x' && key !== xMapField) {
        const x = item[xMapField] || item.x || '';
        res.push({ x, s: key, y: item[key] });
      }
    });
  });
  return res;
};

export const updateCompDataByJson = (
  { compKey, compDataItem }: { compKey?: any; compDataItem?: any } = {},
  val: any,
) => {
  if (!compKey) return;

  const triggerComp = window.DataI.getComponentByKey(compKey); // 目标组件
  const dataset = getDataset(triggerComp);

  setDataset(compDataItem, val, dataset, triggerComp);
  render(triggerComp, dataset);
};

const clickLegendCb = ({ selected, compItem, clickLegendEvent }: any = {}) => {
  if (!clickLegendEvent) return;

  clickLegendEvent.groups?.forEach((ag, agIdx) => {
    const validate = eventInterceptors(clickLegendEvent, ag, agIdx);
    if (!validate) return;
    // v8.5.0 如果单击图例选择了变量，则单击图例时将当前图例数据写入变量
    clickLegendEvent.singleValue = selected;
    if (ag.variable) {
      setStoreData(ag.variable, selected); // 更新全局存储的变量数据
    }
    ag.actions?.forEach((action) => {
      TriggerAction(action, {
        item: compItem,
        events: [clickLegendEvent],
        config: {},
        actions: ag.actions || [],
      });
    });
  });
};

export const clickSeriesCb = ({ clickSeriesEvent, compItem, clickChartData, rowIndex }: any = {}) => {
  if (!clickSeriesEvent) return;

  clickSeriesEvent.groups?.forEach((ag, agIdx) => {
    const validate = eventInterceptors(clickSeriesEvent, ag, agIdx);
    if (!validate) return;
    // v8.5.0 如果单击系列选择了变量，则单击系列时将当前系列数据写入变量
    clickSeriesEvent.singleValue = clickChartData;
    clickSeriesEvent.rowIndex = rowIndex;
    if (ag.variable) {
      setStoreData(ag.variable, clickChartData); // 更新全局存储的变量数据
    }

    ag.actions?.forEach((action) => {
      TriggerAction(action, {
        item: compItem,
        events: [clickSeriesEvent],
        config: {},
        actions: ag.actions || [],
      });
    });
  });
};

// 导出所有方便整体传入到组件库里
export default {
  visiableToggleHandler,
  initRender,
  clickEvent,
  doubleClickEvent,
  enterEvent,
  tableRowClickEvent,
  tablePaginationEvent,
  tableColumnClickEvent,
  valueChangeEvent,
  timeLineValueChangeEvent,
  mouseEnterEvent,
  mouseLeaveEvent,
  blurEvent,
  handleCreateAfterEvent,
  updateCompDataByJson,
  clickLegendEvent: clickLegendCb,
  clickSeriesEvent: clickSeriesCb,
};
