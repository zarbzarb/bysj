/**
 * 事件组件
 */
// Icon
import AddActionIcon from '@/assets/svg/eventIcons/addAction.svg';
import RenameIcon from '@/assets/svg/eventIcons/rename.svg';
import VisibleTestIcon from '@/assets/svg/eventIcons/visibleTest.svg';
import DeleteIcon from '@/assets/svg/eventIcons/delete.svg';

import React, { useState } from 'react';
import {
  EventType as Events,
  // Actions
} from '@/staticJson/AnimationComponentsList';
import { Collapse, Button, message, Input, Tooltip, Space } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import TriggerAction from '@/TriggerAction';
import { changEvent } from '@/utils/CopyEvent';
import { createKeyName } from '@/utils/random';
import _ from 'lodash';
import styles from './index.less';
import SelectAction from './SelectAction';
import ActionStep from '../ThirdStep';
import ListenEvent from './ListenEvent';

import ListenVaulueChange from './ListenValueChange';
import ListenEventVariable from './ListenEventVariable';
import TableRowClick from './TableRowClick';
import TablePagination from './TablePagination';
import TableColumnClick from './TableColumnClick';
import EchartMouseDrag from './EchartMouseDrag';
import EventCondition from '../EventCondition';

const { Panel } = Collapse;
const EmptyNotice = ({ callback }) => {
  return (
    <div className={styles.emptyNotice}>
      当前事件还没有添加任何动作，您需要添加一个？
      <a onClick={callback}>点击添加</a>
    </div>
  );
};

const AddButton = ({ callback }) => {
  return (
    <Button type='primary' onClick={callback} className={styles.addAction}>
      添加
    </Button>
  );
};

const ActionHeader = ({
  item,
  name,
  idx,
  addHandler,
  delHandler,
  testHandler,
  activeEventKey,
  activeEventHandler,
  changeNameHandler,
}) => {
  const [isEvtName, setIsEvtName] = useState(false);
  const [newName, setNewName] = useState(item.eventName || '');

  const evtName = isEvtName ? (
    <Input
      className={styles.vetInput}
      prefix={<span>{name}</span>}
      defaultValue={newName}
      onClick={(evt) => {
        evt.stopPropagation();
      }}
      onChange={(evt) => {
        // item.eventName = evt.target.value;
        // refresh();
        evt.stopPropagation();
        setNewName(evt.target.value);
        // item.eventName = newName;
      }}
      onBlur={() => {
        // item.eventName = newName;
        changeNameHandler(idx, newName);
        setIsEvtName(false);
        // refresh();
      }}
    />
  ) : (
    <span>{name + newName}</span>
  );
  return (
    <div
      onClick={(evt) => {
        if (evt.target.tagName.toLocaleLowerCase() === 'span' || isEvtName) {
          return;
        }
        evt.stopPropagation();
        const str = `event_${item.eventType}_${idx}`;

        if (str !== activeEventKey) {
          activeEventHandler(str);
          changEvent(item);
        } else {
          activeEventHandler('');
          changEvent();
        }
      }}
    >
      {evtName}
      <div className={styles.operationContainer}>
        {item.eventType === 'tablePagination' && (
          <Tooltip
            title={
              '（1）点击分页按钮时会将分页数据绑定到指定的变量中，数据格式为{pageNo:1,pageSize:10}\
              （2）将分页变量中的数据赋值给分页查询的入参，即可实现分页查询，入参引用时请填写表达式为：data.pageNo（当前页码）data.pageSize（每页条数）'
            }
          >
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2', marginRight: '5px' }} />
          </Tooltip>
        )}

        <Space>
          <Button
            className={styles.eventControllerButton}
            icon={<img src={AddActionIcon} alt='添加' />}
            type='text'
            size='small'
            onClick={addHandler}
          />

          <Button
            className={styles.eventControllerButton}
            icon={<img src={RenameIcon} alt='重命名' />}
            type='text'
            size='small'
            onClick={(evt) => {
              evt.stopPropagation();
              const isClick = !isEvtName;
              setIsEvtName(isClick);
            }}
          />

          <Button
            className={styles.eventControllerButton}
            icon={<img src={VisibleTestIcon} alt='测试' />}
            type='text'
            size='small'
            onClick={(evt) => {
              evt.stopPropagation();
              testHandler(idx);
            }}
          />

          {!item.defaultListener && (
            <Button
              className={styles.eventControllerButton}
              icon={<img src={DeleteIcon} alt='删除' />}
              type='text'
              size='small'
              onClick={(evt) => {
                evt.stopPropagation();
                console.log('second step delHandler');
                delHandler(idx);
              }}
            />
          )}
        </Space>
      </div>
    </div>
  );
};

const isEventChange = (item, idx, activeEventKey) => {
  const currentEventTag = `event_${item.eventType}_${idx}`;
  if (activeEventKey === currentEventTag) {
    return ' eventActive';
  }
  return '';
};

const SecondStep = ({ item: itemtest, idx, comp, eventHandler, activeEventKey, setActiveEventKey, ...props }) => {
  // let { eventType: type, eventListenKey, actions } = item;
  const eventSettings = _.cloneDeep(comp.eventSetings);
  const item = eventSettings[idx];
  const { eventType: type, selectedKey, actionGroup = [] } = item;
  const { forceUpdate } = eventHandler;

  const currentActionGroupIndex = actionGroup.findIndex((ag) => ag.key === selectedKey);
  const currentActionGroup = actionGroup[currentActionGroupIndex];

  actionGroup.forEach((ag) => {
    ag.actions.forEach((ac) => {
      if (!ac.actionKey) {
        ac.actionKey = createKeyName();
      }
    });
  });

  const [count, setCount] = useState(0);
  const comRefresh = () => {
    setCount(count + 1);
  };
  /** 添加动作 */
  const addAction = () => {
    // 激活的actionGroup
    if (currentActionGroupIndex === -1) return console.warn('没有动作组');

    const emptyActionState =
      currentActionGroup.actions.findIndex((action) => action.actionType === '' || action.actionType === undefined) >
      -1;
    if (emptyActionState) {
      message.warning('请先完善空交互事件配置！');
      return;
    }

    const evtSettings = _.cloneDeep(comp.eventSetings);
    const event = evtSettings[idx];

    event.actionGroup[currentActionGroupIndex].actions.push({
      actionType: '',
      actionName: '',
      actionKey: createKeyName(),
      isActive: true, // 新添加的动作默认展开
    });
    event.isActive = true;
    evtSettings[idx] = event;
    window.executeCommand('InteractionCommand', comp, evtSettings);
    comRefresh();
  };
  const headerItem = Events.find((vl) => vl.value === type) || {};
  /**
   * 删除事件
   * */
  const delHandler = () => {
    // comp.eventSetings.splice(idx, 1);

    const evtSettings = _.cloneDeep(comp.eventSetings);
    evtSettings.splice(idx, 1);
    window.executeCommand('InteractionCommand', comp, evtSettings);

    // 兼容之前放在数据源面板里设置的变量绑定删除
    if (comp.props) {
      const {
        props: { variable, mapGlobalVariable },
      } = comp;
      if (variable) {
        comp.props.variable = '';
      } else if (mapGlobalVariable) {
        comp.props.mapGlobalVariable = '';
      }
    }
    forceUpdate(true);
  };
  /**
   * 测试事件
   */
  const testHandler = () => {
    const list = comp.eventSetings || [];
    const eventObj = comp.eventSetings[idx];
    const { actions: acts } = eventObj;
    if (eventObj.eventType === 'monitoringEvent' && eventObj.eventListenKey && eventObj.eventListenKey.trim() === '') {
      // eslint-disable-next-line no-throw-literal
      throw '请先完善监听事件变量配置！';
    }
    acts.forEach((action) => {
      TriggerAction(action, {
        item: comp,
        events: list,
        config: window.screenConfig,
        actions: acts,
      });
    });
  };

  // 修改名称
  const changeNameHandler = (idx, eventName) => {
    const evtSettings = _.cloneDeep(comp.eventSetings);
    const event = evtSettings[idx];
    event.eventName = eventName;
    evtSettings[idx] = event;

    window.executeCommand('InteractionCommand', comp, evtSettings);
    comRefresh();
  };

  /** 切换动作组 */
  const onActionGroupChange = (index) => {
    const evtSettings = _.cloneDeep(comp.eventSetings);
    const event = evtSettings[idx];
    const currentKey = event.actionGroup[index].key;

    event.selectedKey = currentKey;
    window.executeCommand('InteractionCommand', comp, evtSettings);
    comRefresh();
  };

  /** 增加动作组 */
  const onActionGroupAdd = () => {
    const evtSettings = _.cloneDeep(comp.eventSetings);
    const event = evtSettings[idx];
    const uuid = createKeyName();

    event.actionGroup.push({
      key: uuid,
      actions: [],
      conditions: [],
    });
    event.selectedKey = uuid;
    window.executeCommand('InteractionCommand', comp, evtSettings);
    comRefresh();
  };

  /** 删除动作组 */
  const onActionGroupDel = (index) => {
    const evtSettings = _.cloneDeep(comp.eventSetings);
    const event = evtSettings[idx];
    event.actionGroup.splice(index, 1);

    let curIdx = 0;

    // 删除后的选中项
    if (index > currentActionGroupIndex) {
      curIdx = currentActionGroupIndex;
    } else {
      curIdx = currentActionGroupIndex > 0 ? currentActionGroupIndex - 1 : 0;
    }
    event.selectedKey = event.actionGroup[curIdx].key;

    evtSettings[idx] = event;

    window.executeCommand('InteractionCommand', comp, evtSettings);
    comRefresh();
  };

  return (
    <Collapse
      defaultActiveKey={item.isActive ? [idx] : []}
      onChange={(evt) => {
        // console.log('evt', evt);
        // item.isActive = evt.length !== 0;

        /** 设置的动作如果没有调用forceUpdate 会导致此处使用的 eventSettings 不是最新，会丢失配置，所以为了兼容直接在此处取出最新的eventSetings */
        const events = _.cloneDeep(comp.eventSetings);
        events[idx].isActive = evt.length > 0;
        window.executeCommand('InteractionCommand', comp, events);
        comRefresh();
      }}
    >
      <Panel
        className={styles.eventHeader + isEventChange(item, idx, activeEventKey)}
        key={idx}
        header={
          <ActionHeader
            item={item}
            idx={idx}
            activeEventKey={activeEventKey}
            activeEventHandler={setActiveEventKey}
            name={
              comp.type === 'Input' && headerItem.value === 'changeValue' // 输入框的onChange事件名称特殊处理
                ? '内容改变'
                : headerItem.name
            }
            addHandler={addAction}
            delHandler={delHandler}
            testHandler={testHandler}
            changeNameHandler={changeNameHandler}
            refresh={forceUpdate}
          />
        }
      >
        {type === 'monitoringEvent' && <ListenEvent refresh={forceUpdate} comp={comp} idx={idx} />}

        {type === 'changeValue' && <ListenVaulueChange refresh={forceUpdate} comp={comp} idx={idx} />}

        {type === 'listenVariable' && <ListenEventVariable refresh={forceUpdate} comp={comp} idx={idx} />}

        {type === 'tableRowClick' && <TableRowClick refresh={forceUpdate} comp={comp} idx={idx} />}

        {type === 'treeRowClick' && <TableRowClick refresh={forceUpdate} comp={comp} idx={idx} />}

        {(type === 'tablePagination' || type === 'listPagination') && (
          <TablePagination refresh={forceUpdate} comp={comp} idx={idx} />
        )}
        {type === 'mouseDrag' && <EchartMouseDrag refresh={forceUpdate} comp={comp} idx={idx} />}

        {type === 'tableColumnClick' && <TableColumnClick refresh={forceUpdate} comp={comp} idx={idx} />}

        {(type === 'clickSeries' || type === 'clickLegend') && (
          <TableRowClick refresh={forceUpdate} comp={comp} idx={idx} />
        )}

        <Tabs
          tabs={actionGroup?.map((ag, idx) => `动作组${idx + 1}`)}
          onChange={onActionGroupChange}
          tabIndex={currentActionGroupIndex}
          plusHandler={onActionGroupAdd}
          delHandler={onActionGroupDel}
          plusState={true}
          delState={actionGroup.length > 1}
          className='eventActionGroupTabs'
        >
          {actionGroup.map((ag, groupIdx) => {
            return (
              <div key={ag.key}>
                {/* 事件条件设置 */}
                {type !== 'listenVariable' && <EventCondition comp={comp} idx={idx} agIdx={groupIdx} />}
                {ag.actions?.map((child, actionIdx) => {
                  if (child.actionType) {
                    return (
                      <ActionStep
                        parentIdx={idx}
                        idx={actionIdx}
                        actions={ag.actions}
                        type={child.actionType}
                        forceRender={comRefresh}
                        item={child}
                        // v6-18修改key值赋值，优化更符合diff
                        key={child.actionKey}
                        parentItem={item}
                        comp={comp}
                        {...props}
                      />
                    );
                  }
                  return (
                    <SelectAction
                      key={actionIdx}
                      item={child}
                      actions={ag.actions}
                      refresh={comRefresh}
                      type={type}
                      parentIdx={idx}
                      idx={actionIdx}
                      comp={comp}
                      {...props}
                    />
                  );
                })}
              </div>
            );
          })}
        </Tabs>

        {currentActionGroup.actions.length === 0 && <EmptyNotice callback={addAction} />}
        {currentActionGroup.actions.length > 0 && <AddButton callback={addAction} />}
      </Panel>
    </Collapse>
  );
};

export default SecondStep;
