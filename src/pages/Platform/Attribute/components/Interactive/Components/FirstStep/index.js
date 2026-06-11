import { Select } from 'antd';
import React, { useLayoutEffect, useState } from 'react';
import { createKeyName } from '@/utils/random';
import _ from 'lodash';
import styles from './index.less';

const { Option } = Select;

/**
 *
 * @param {*} comp 组件
 * @param {*} item 当前事件
 * @param {*} count state状态
 * @param {*} eventHanlder 刷新父组件回调
 * @param {*} EventList 当前组件支持的事件类型
 * @param {*} idx 当前事件序号
 * @returns
 */
const SelectEvent = ({ comp, item, count, eventHanlder, EventList, idx }) => {
  const [state, setState] = useState(count);
  const [open, setOpen] = useState();
  // 当前组件的事件
  const compEvents = comp.eventSetings || [];

  // console.log('compEvents', compEvents);

  compEvents.forEach((eventItem) => {
    // const eventIdx = singleEventType.indexOf(eventItem.eventType);
    // if (eventIdx > -1) {
    //   // 找到对应的禁用
    //   const eventInfo = EventList.find((event) => event.value === eventItem.eventType);
    //   eventInfo.disabled = true;
    // }
    // v8.6.0 限制重复添加只能添加一次
    const eventInfo = EventList.find((event) => event.value === eventItem.eventType && event.once);
    if (eventInfo) {
      eventInfo.disabled = true;
    }
  });

  useLayoutEffect(() => {
    if (count !== state) {
      setState(count);
      setOpen(!open);
    }
  }, [count, open, state]);

  const changeEventType = (value) => {
    const eventSettings = _.cloneDeep(comp.eventSetings);
    const event = _.cloneDeep(item);

    const uuid = createKeyName();

    event.eventType = value;
    // event.actions = [{}];
    event.isActive = true; // 展开状态
    event.selectedKey = uuid; // 选中动作组key
    event.groups = [
      {
        key: uuid,
        actions: [],
        conditions: [],
      },
    ];

    // // 监听变量的时间触发拦截在变量配置下面
    // if (value !== 'listenVariable') {
    //   event.conditions = []; // 事件触发条件
    // }

    eventSettings[idx] = event;

    window.executeCommand('InteractionCommand', comp, eventSettings);
    if (eventHanlder.forceUpdate) eventHanlder.forceUpdate();
  };

  /**
   * v8.6.0 支持模糊搜索
   * @param {*} input 输入文本
   * @param {*} option 选项
   * @returns
   */
  const filterOption = (input, option) => {
    const val = Array.isArray(option.children) ? option.children.join('') : option.children;
    return val ? val.toLowerCase().includes(input.toLowerCase()) : false;
  };

  console.log(EventList);

  return (
    <div className={styles.selectEventTypeDiv}>
      {/* v8.6.0 事件的下拉框改为下拉输入框，支持模糊搜索 */}
      <Select showSearch onChange={changeEventType} filterOption={filterOption} placeholder='请选择事件类型'>
        {EventList.map((eventType, idx) => {
          return (
            <Option disabled={eventType.disabled} value={eventType.value} key={idx}>
              {comp.type === 'Input' && eventType.value === 'changeValue' // 输入框的onChange事件名称特殊处理
                ? '内容改变'
                : eventType.name}
            </Option>
          );
        })}
      </Select>
    </div>
  );
};

export default SelectEvent;
