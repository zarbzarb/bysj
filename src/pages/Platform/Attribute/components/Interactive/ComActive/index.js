import React, { Fragment, useState, useCallback } from 'react';
import { Button, message } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import { contextMenu } from 'react-contexify';

import ContextMenu from '@/components/ContextMenuForEventAndAction';
import { getDataiBasicChartType } from '@/utils/common';
import { EventType as Events } from '@/staticJson/AnimationComponentsList';
import { createKeyName } from '@/utils/random';
import _ from 'lodash';
import { useStore } from '@/hooks';
import SecondStep from '../Components/SecondStep';
import FirstStep from '../Components/FirstStep';
import styles from '../index.less';

// click , doubleClick, changeValue, initialization, monitoringEvent, listenVariable, enterHandler
const compEvent = [
  'click',
  'doubleClick',
  'initialization',
  'monitoringEvent',
  'listenVariable',
  'tableRowClick',
  'changeValue',
  'mouseDrag',
  // v7.1 交互添加鼠标移入、鼠标移出事件
  'mouseenter',
  'mouseleave',
  'blur',
];

const groupEvent = new Set([
  'initialization',
  'monitoringEvent',
  'listenVariable',
  'click',
  'doubleClick',
  // v7.1 交互添加鼠标移入、鼠标移出事件
  'mouseenter',
  'mouseleave',
]);

const CommonEvent = [
  { value: 'createBefore', name: '创建前', once: true },
  { value: 'createAfter', name: '创建后', once: true },
  { value: 'destroyBefore', name: '销毁前', once: true },
  { value: 'destroyAfter', name: '销毁后', once: true },
  { value: 'beforeHide', name: '隐藏前', once: true },
  { value: 'afterHidden', name: '隐藏后', once: true },
  { value: 'beforeShowUp', name: '显示前', once: true },
  { value: 'afterShowUp', name: '显示后', once: true },
  { value: 'beforeDataChange', name: '数据变化前', once: true },
  { value: 'afterDataChange', name: '数据变化后', once: false },
];

const chartEvent = ['clickSeries', 'clickLegend'];

const astrictGroup = (comp, EventList) => {
  if (comp.classType === 'group') {
    EventList = EventList.filter((rs) => groupEvent.has(rs.value));
    comp.effectEvent = EventList.map((item) => item.value);
  }
  return EventList;
};

const astrictComp = (comp, EventList) => {
  let compEventTmp = compEvent.slice(0);
  const { isBasicChart } = getDataiBasicChartType({
    englishName: comp?.englishName,
  });
  // 报表事件
  if (isBasicChart && comp?.instance?.chart) {
    compEventTmp = [...compEventTmp, ...chartEvent];
  }
  if (comp.classType === 'com') {
    EventList = EventList.filter((rs) => {
      return compEventTmp.includes(rs.value);
    });
    comp.effectEvent = EventList.map((item) => item.value);
  }
  return EventList;
};

const astrictAntd = (comp, EventList) => {
  if (comp.classType === 'antd' || comp.classType === 'customComp') {
    EventList = EventList.filter((rs) => {
      return comp.effectEvent && comp.effectEvent.includes(rs.value);
    });
  }

  return EventList;
};

const astrictOther = (comp, EventList) => {
  if (comp.classType === 'com') {
    if (comp.type !== '@yl/datai-com-text-carouseltextlist') {
      // datai组件里面只有文字轮播列表组件需要单击表格行事件
      const index = EventList.findIndex((v) => v.value === 'tableRowClick');
      if (index !== -1) EventList.splice(index, 1);
      comp.effectEvent = EventList.map((item) => item.value);
    }
    if (
      !(
        comp.type === '@yl/datai-com-text-tabs-group' ||
        comp.type === '@yl/datai-com-text-tabs-select' ||
        comp.type === '@yl/datai-com-time-line' ||
        comp.type === '@yl/datai-com-dynamic-wordcloud'
      )
    ) {
      // tab切换组绑定值改变事件
      // v6.18 datai组件里面-时间轴支持changeValue
      // v7.4 选择面板组件新增选中值事件
      const index = EventList.findIndex((v) => v.value === 'changeValue');
      // 此方法会改变原数组。
      if (index !== -1) EventList.splice(index, 1);
      comp.effectEvent = EventList.map((item) => item.value);
    }
    if (comp.type !== '@yl/datai-com-chart-mixed-line-bar') {
      // datai组件里面只有文字轮播列表组件需要单击表格行事件
      const index = EventList.findIndex((v) => v.value === 'mouseDrag');
      if (index !== -1) EventList.splice(index, 1);
      comp.effectEvent = EventList.map((item) => item.value);
    }
  }
  return EventList;
};

export default (props) => {
  const {
    pageTreeStore: { getSelectedComp },
  } = useStore();
  const comp = getSelectedComp(props.changeKeys[0]);
  if (!comp) return <></>;
  const [count, setCount] = useState(0);

  const [activeEventKey, setActiveEventKey] = useState();

  const [activeActionKey, setActiveActionKey] = useState();

  const forceUpdate = useCallback(
    (isClearEventOrActiveKey) => {
      if (isClearEventOrActiveKey) {
        setActiveActionKey();
        setActiveEventKey();
      }
      setCount(count + 1);
    },
    [count],
  );

  const createCompEventKey = (eventSettings) => {
    eventSettings?.forEach((evt) => {
      if (!evt.eventKey) {
        evt.eventKey = createKeyName();
      }
    });
  };

  const addEventHandler = useCallback(() => {
    // console.log('comp.eventSetings', comp.eventSetings);
    if (!Array.isArray(comp.eventSetings)) {
      comp.eventSetings = [];
    }
    const emptyState = comp.eventSetings.findIndex((item, idx) => !item.eventType) > -1;
    if (emptyState) {
      message.warning('请先完善空事件交互配置！');
      return <></>;
    }

    let eventSettings = _.cloneDeep(comp.eventSetings);
    if (!eventSettings) {
      eventSettings = [{}];
    } else if (Array.isArray(eventSettings)) {
      eventSettings.push({});
    }

    window.executeCommand('InteractionCommand', comp, eventSettings);
    setCount(count + 1);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comp.eventSetings, count]);
  // 获取事件数组
  const eventSettings = comp.eventSetings || [];
  const showEventContextMenu = (e) => {
    contextMenu.show({
      event: e,
      id: 'event_menu',
    });
  };
  createCompEventKey(eventSettings);

  let EventList = _.cloneDeep(Events);

  EventList = astrictGroup(comp, EventList); // 限制组的事件
  EventList = astrictComp(comp, EventList); // 显示日常组件，报表，地图等
  EventList = astrictAntd(comp, EventList); // antd组件事件过滤
  EventList = astrictOther(comp, EventList); // 特殊组件事件过滤
  EventList = EventList.concat(_.cloneDeep(CommonEvent).slice(0));
  return (
    <>
      <div onContextMenu={showEventContextMenu}>
        {eventSettings.map((evt, idx) => {
          if (evt.eventType === undefined) {
            return (
              <FirstStep
                item={evt}
                comp={comp}
                eventHanlder={{ forceUpdate }}
                count={count}
                key={idx}
                EventList={EventList}
                idx={idx}
              />
            );
          }

          return (
            <SecondStep
              activeEventKey={activeEventKey}
              setActiveEventKey={setActiveEventKey}
              activeActionKey={activeActionKey}
              setActiveActionKey={setActiveActionKey}
              comp={comp}
              idx={idx}
              eventHandler={{ forceUpdate }}
              item={evt}
              key={evt?.eventKey ? evt.eventKey : Math.random()}
            />
          );
        })}

        <ContextMenu comp={comp} forceUpdate={forceUpdate} />
        {/* 引用地图不显示交互事件 */}
        {comp.compType !== 'referenceMap' && (
          <div className={styles.addEventDiv}>
            <Button type='primary' onClick={addEventHandler} icon={<PlusCircleOutlined />}>
              添加事件
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
