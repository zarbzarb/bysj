import React, { useEffect, useState, useCallback } from 'react';
import CompType from '@/common/DynamicCompPureRender';
import { getFilterStyle, reRenderVisibleComp } from '@/utils/componentUtils';
import TriggerAction from '@/TriggerAction';
import { getParamValue, receiveMessage } from '@/TriggerAction/utils';
import { babelTransform } from '@/utils/utils';
import { setStoreData } from '@/utils/dataStoreUtils';
import {
  initRender,
  handleAfterShowUpOrHidden,
  handleBeforeShowUpOrHide,
  updateCompDataByJson,
  handleBeforeOrAfterDatasetChange,
  handleDestroyBeforeEvent,
  handleDestroyAfterEvent,
  handleCreateAfterEventAfterFirstTime,
} from '@/EventHandlers/AnimateEvent';
import { validateWithConditions, eventInterceptors } from '@/utils/common';
import { initCanBeClearedTargets } from '@/TriggerAction/clearBeforeAnimation';
import GroupType from './GroupRender';
import CustomCompType from './CustomCompRender';
import AntdType from './AntdRender';

const indexMax = 9999;

const CompRender = (item, i, compCount, props, filterStyle) => {
  return (
    <CompType {...props} key={item.key} zIndex={indexMax - i} item={item} compCount={compCount} filter={filterStyle} />
  );
};

const GroupRender = (item, i, compCount, props, filterStyle) => {
  return (
    <GroupType
      {...props}
      key={item.key}
      zIndex={indexMax - i}
      // zIndex={item.zIndex}
      item={item}
      compCount={compCount}
      // {...props}
      filter={filterStyle}
    />
  );
};

const AntdRender = (item, i, compCount, props, filterStyle) => {
  return (
    <AntdType
      {...props}
      key={item.key}
      zIndex={indexMax - i}
      // zIndex={item.zIndex}
      item={item}
      compCount={compCount}
      // {...props}
      filter={filterStyle}
    />
  );
};

const CustomCompRender = (item, i, compCount, props, filterStyle) => {
  return (
    <CustomCompType
      {...props}
      key={item.key}
      zIndex={indexMax - i}
      // zIndex={item.zIndex}
      item={item}
      compCount={compCount}
      // {...props}
      filterStyle={filterStyle}
    />
  );
};

// 组件创建前事件处理
const handleCreateBeforeEvent = ({ item, config, flag }) => {
  let listenCreateFn;
  let listenShowFn;

  const createEventKey = `${item.key}createFlag`;
  const showEventKey = `${item.key}showFlag`;

  let eventSetings = [];

  const EventEmitter = window.globalEventEmitter;

  if (item._createBeforeEvtTrigger === true) {
    return;
  }

  if (Array.isArray(item.eventSetings)) {
    eventSetings = item.eventSetings;
  }
  const event = eventSetings.find((evt) => {
    return evt.eventType === 'createBefore';
  });
  if (event === undefined) return;

  if (flag !== true && item.createFlag === false) {
    listenCreateFn = (createFlag) => {
      if (createFlag === 1) handleCreateBeforeEvent({ item, config, flag: true });
    };
    listenShowFn = (showFlag) => {
      if (showFlag === '0') handleCreateBeforeEvent({ item, config, flag: true });
    };

    EventEmitter.on(createEventKey, listenCreateFn);
    EventEmitter.on(showEventKey, listenShowFn);
    return;
  }

  event.groups?.forEach((ag, idx) => {
    // 事件条件拦截
    const validate = eventInterceptors(event, ag, idx);
    if (!validate) return;

    const actions = ag.actions || [];
    actions.forEach((action) => {
      TriggerAction(action, {
        item,
        events: eventSetings,
        config,
        actions,
      });
    });
  });

  item._createBeforeEvtTrigger = true;
  if (listenCreateFn) EventEmitter.removeListener(createEventKey, listenCreateFn);
  if (listenShowFn) EventEmitter.removeListener(showEventKey, listenShowFn);
};

const RenderByType = (props) => {
  const { item, index, compCount, config, topRender } = props;
  let Comp = null;
  const filter = config && config.filter;
  const filterStyle = filter ? getFilterStyle(filter) : {};

  handleBeforeOrAfterDatasetChange(item, config);

  handleAfterShowUpOrHidden(item, config);

  // 创建前事件
  handleCreateBeforeEvent({ item, config }); // 创建和显示前事件

  const EventEmitter = window.globalEventEmitter;

  const [count, setCount] = useState(0);
  const forceUpdate = useCallback(() => {
    setCount(count + 1);
  }, [count]);

  /** 监听event事件信息 */
  useEffect(() => {
    let eventSetings = [];
    const listenList = [];
    if (Array.isArray(item.eventSetings)) {
      eventSetings = item.eventSetings;
    }
    const list = eventSetings || [];
    eventSetings = eventSetings.filter((event) => {
      return event.eventType === 'monitoringEvent';
    });
    eventSetings.forEach((event) => {
      let temp = []; // 监听事件需要二维数组进行存储了
      event.groups?.forEach((ag, agIdx) => {
        const listenFn = (data) => {
          // 事件条件拦截
          const validate = eventInterceptors(event, ag, agIdx);
          if (!validate) return;
          const variableKey =
            ag.eventListenWithDataInjectVariable ||
            (ag.dataParams?.[0]?.updateType === 3 && ag.dataParams?.[0]?.variableKey);
          if (variableKey) {
            setStoreData(variableKey, data); // 更新全局存储的变量数据
          } else {
            // v8.3 新增：更新组件数据
            updateCompDataByJson(ag.dataParams[0], data);
          }
          const actions = ag.actions || [];
          actions.forEach((action) => {
            TriggerAction(action, {
              item,
              expressionValue: data,
              events: list,
              config,
              actions,
            });
          });
        };
        EventEmitter.on(ag.eventListenKey, listenFn);

        temp.push(listenFn);
      });
      listenList.push(temp);
    });
    return () => {
      eventSetings.forEach((event, idx) => {
        event.groups?.forEach((ag, agIdx) => {
          EventEmitter.removeListener(ag.eventListenKey, listenList[idx][agIdx]);
        });
      });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // v8.15： 监听浏览器事件
  useEffect(() => {
    let eventSetings = [];
    let listenList = [];
    if (Array.isArray(item.eventSetings)) {
      eventSetings = item.eventSetings;
    }
    const list = eventSetings || [];
    eventSetings = eventSetings.filter((event) => {
      return event.eventType === 'listenBrowserEvent';
    });
    eventSetings.forEach((event, idx) => {
      if (!event.browserEventType) return;
      const _receiveMessage = (e) => {
        if (e.data?.source?.includes('react-devtools') || e.data?.wappalyzer) return; // 屏蔽本地环境
        receiveMessage(e, event, item, (action, actions) => {
          TriggerAction(action, {
            item,
            expressionValue: e.data,
            events: list,
            config,
            actions,
          });
        });
      };
      window.addEventListener('message', _receiveMessage);
      listenList[idx] = _receiveMessage;
    });
    return () => {
      eventSetings.forEach((event, idx) => {
        window.removeEventListener('message', listenList[idx]);
      });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 监听变量 */
  useEffect(() => {
    const listenFnList = [];

    const list = item.eventSetings || [];
    /* allListenVariable = list.filter(
        (vl) => vl.eventType === 'listenVariable' && vl.variables
      ); */
    const events = list.filter((vl) => {
      // if (vl.eventType === 'listenVariable' && !vl.hasOwnProperty('variables')) {
      //   vl.variables = [
      //     {
      //       variableKey: vl.variableKey,
      //       expression: vl.expression || 'data',
      //       timeStamp: Date.now(),
      //     },
      //   ];
      // }
      return vl.eventType === 'listenVariable';
    });
    events.forEach((info) => {
      let temp = [];
      info.groups?.forEach((ag) => {
        const boolArr = [];
        ag.variables?.forEach((variable) => {
          boolArr.push(false);

          const listenFn = (data) => {
            const eachVariable = (variable, idx) => {
              // 执行之前的变量表达式逻辑
              if (variable.conditionType === 1 || variable.conditionType === undefined) {
                if (!variable?.expression || variable.expression === 'data') {
                  boolArr[idx] = true;
                } else {
                  const str = variable.expression;

                  try {
                    const result = babelTransform(str, data); // 运行时ES6转ES5
                    boolArr[idx] = result;
                  } catch (error) {
                    console.error(error, '变量监听表达式: ${str}发生错误');
                  }
                }
              } else {
                try {
                  // 执行条件判断逻辑
                  const validate = validateWithConditions(variable.conditions || []);
                  boolArr[idx] = validate;
                } catch (error) {
                  console.error(error);
                }
              }
            };
            // v8.11: 监听变量可能会有多个，需要进行遍历
            ag.variables.forEach((v, idx) => {
              eachVariable(v, idx);
            });

            if (!boolArr.includes(false)) {
              const { actions = [] } = ag;
              actions.forEach((action) => {
                TriggerAction(action, {
                  item,
                  expressionValue: data,
                  events: list,
                  config,
                  actions,
                });
              });
            } else {
              return console.warn(`有变量监听触发条件不满足，无法触发后续交互!`);
            }
          };

          temp.push(listenFn);
          EventEmitter.on(variable.variableKey, listenFn);
        });
      });

      listenFnList.push(temp);
    });

    return () => {
      if (events)
        events.forEach((info, idx) => {
          info.groups?.forEach((ag, agIdx) => {
            ag.variables?.forEach((variable) => {
              EventEmitter.removeListener(variable.variableKey, listenFnList[idx][agIdx]);
            });
          });
        });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 初始化
  useEffect(() => {
    if (item.createFlag !== false && !(!topRender && item.styles.isTop)) initRender(item, config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.createFlag]);

  // 执行创建事件
  useEffect(() => {
    const listenFn = (createFlag) => {
      switch (createFlag) {
        case 1: {
          item.createFlag = true;
          if (item.showFlag === undefined) {
            item.showFlag = true; // 确保两个属性同时出现
          }
          forceUpdate();

          handleCreateAfterEventAfterFirstTime(item, config);
          break;
        }
        case 0: {
          item.createFlag = false;
          handleDestroyBeforeEvent(item.eventSetings, config, item);

          if (item.showFlag === undefined) {
            item.showFlag = true; // 确保两个属性同时出现
          }
          forceUpdate();

          handleDestroyAfterEvent(item.eventSetings, config, item);
          break;
        }
        case 2: {
          if (item.createFlag === undefined) {
            handleDestroyBeforeEvent(item.eventSetings, config, item);

            item.createFlag = false;
            item.showFlag = true; // 确保两个属性同时出现
            forceUpdate();

            handleDestroyAfterEvent(item.eventSetings, config, item);
          } else {
            item.createFlag = !item.createFlag;
            forceUpdate();

            if (item.createFlag === true) handleCreateAfterEventAfterFirstTime(item, config);
          }
          break;
        }

        default: {
          break;
        }
      }
    };
    const eventKey = `${item.key}createFlag`;
    if (!(!topRender && item.styles.isTop)) {
      EventEmitter.on(eventKey, listenFn);
    }
    return () => {
      EventEmitter.removeListener(eventKey, listenFn);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceUpdate]);

  // 执行显示事件
  useEffect(() => {
    const listenFn = (showFlag) => {
      handleBeforeShowUpOrHide(item, showFlag === '0' ? 'showup' : showFlag === '1' ? 'hide' : 'switch', config);

      switch (showFlag) {
        case '1': {
          item.showFlag = false;
          if (item.createFlag === undefined) {
            item.createFlag = true; // 确保两个属性同时出现
          }
          forceUpdate();
          break;
        }
        case '0': {
          item.createFlag = true; // 显示的时候默认创建
          item.showFlag = true;
          reRenderVisibleComp(item, '0'); // 图表组件需要重新渲染
          forceUpdate();
          break;
        }
        case '2': {
          if (item.showFlag === undefined) {
            item.showFlag = false;
            item.createFlag = true; // 确保两个属性同时出现
          } else {
            if (!item.showFlag) item.createFlag = true; // 显示的时候默认创建
            item.showFlag = !item.showFlag;
            reRenderVisibleComp(item, item.showFlag ? '0' : '1'); // 图表组件需要重新渲染
          }
          forceUpdate();
          break;
        }
        default: {
          break;
        }
      }
    };
    const eventKey = `${item.key}showFlag`;

    // 注意: 置顶组会执行两次CommonRender, 这里判断条件是为了防止注册两次监听
    if (!(!topRender && item.styles.isTop)) {
      EventEmitter.on(eventKey, listenFn);
    }

    return () => {
      EventEmitter.removeListener(eventKey, listenFn);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceUpdate]);

  useEffect(() => initCanBeClearedTargets(), []);

  switch (item.classType) {
    case 'com':
      Comp = CompRender(item, index, compCount, props, filterStyle);
      break;
    case 'group':
      if (topRender) {
        Comp = GroupRender(item, index, compCount, props, filterStyle, topRender);
      }
      if (!topRender && !item.styles.isTop) {
        Comp = GroupRender(item, index, compCount, props, filterStyle, topRender);
      }

      break;
    case 'antd':
      Comp = AntdRender(item, index, compCount, props, filterStyle);
      break;
    case 'customComp':
      Comp = CustomCompRender(item, index, compCount, props, filterStyle);
      break;
    default: {
      Comp = <div>渲染错误</div>;
      break;
    }
  }
  return Comp;
};

export default RenderByType;
