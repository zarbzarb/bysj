import { useEffect } from 'react';
import ReactDom from 'react-dom';
import { allTypesFetch, stringToFun } from '@/components/QuoteTable/utils';
import { get } from 'lodash';
import { setStoreData } from '@/utils/dataStoreUtils';
import { babelTransform6 } from '@/utils/utils';

const addEventArrs = [
  'click',
  'doubleClick',
  // v7.1 交互添加鼠标移入、鼠标移出事件
  'mouseenter',
  'mouseleave',
];
/**
 *
 * @param {*} eventDom React.useRef()对象
 * @param {*} eventSetings props 内的 eventSetings
 */

function useEvent(eventDom, eventSetings = []) {
  const EventEmitter = window.globalEventEmitter;

  useEffect(() => {
    const comDom = ReactDom.findDOMNode(eventDom.current);
    if (!comDom) {
      // eslint-disable-next-line no-throw-literal
      throw '绑定元素不存在';
    }

    let keys = Object.keys(eventSetings);
    // let values = Object.entries(eventSetings);

    if (keys.length == 0) return;

    const dataQuery = Object.keys(eventSetings).reduce((prevEvents, eventName) => {
      const events = eventSetings[eventName]
        .filter((item) => item.type === 'dataQuery')
        .map((item) => {
          const { apiInfo, paramList = [], dataMapList, variable } = item.settings.dataQuery;
          const params = paramList.reduce((prevParam, currParm) => {
            let { name: key, example: value, type } = currParm;
            if (type === 'number') {
              value = value ? parseFloat(value) : '';
            }
            prevParam[key] = value;
            return prevParam;
          }, {});
          let { method, url } = apiInfo;
          method = method.toLocaleLowerCase();
          const eventFun = function () {
            allTypesFetch[method](url, params).then((data) => {
              let store = dataMapList.reduce((s, mapInfo) => {
                const { type, path, code, variable } = mapInfo;
                let value;
                if (type === 'config') {
                  value = get(data, path);
                }
                if (type === 'code') {
                  const getFun = babelTransform6(code, (data) => data);
                  value = getFun(data);
                }
                s[variable] = value;
                return s;
              }, {});
              store[variable] = data;
              Object.entries(store).forEach(([key, value]) => {
                setStoreData(key, value); // 更新全局存储的变量数据
              });
            });
          };
          return {
            ...item,
            eventFun,
            eventName,
            animateKey: item.animateKey,
          };
        });
      prevEvents.push({
        eventName,
        events,
      });
      return prevEvents;
    }, []);
    dataQuery.forEach(({ events, eventName }) => {
      if (addEventArrs.includes(eventName)) {
        events.forEach((event) => {
          const { eventFun, eventName } = event;
          comDom.addEventListener(eventName, eventFun);
        });
      }
      if (eventName === 'initialization') {
        events.forEach((event) => {
          const { eventFun } = event;
          eventFun();
        });
      }
      if (eventName === 'monitoringEvent') {
        events.forEach((event) => {
          const { eventFun, animateKey } = event;
          EventEmitter.addListener(animateKey, eventFun);
        });
      }
    });
    return () => {
      dataQuery.forEach(({ events, eventName }) => {
        if (addEventArrs.includes(eventName)) {
          events.forEach((event) => {
            const { eventFun, eventName } = event;
            comDom.removeEventListener(eventName, eventFun);
          });
        }
        if (eventName === 'monitoringEvent') {
          events.forEach((event) => {
            const { eventFun, animateKey } = event;
            if (animateKey && eventFun) {
              EventEmitter.removeListener(animateKey, eventFun);
            }
          });
        }
      });
    };
  }, [eventSetings, eventDom, EventEmitter]);
}

export default useEvent;
