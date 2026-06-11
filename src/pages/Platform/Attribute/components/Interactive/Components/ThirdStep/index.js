import React, { useState } from 'react';
import { Button, Collapse, Input, message, Space } from 'antd';
import QuoteTable from '@/components/QuoteTable';
import { changeAction } from '@/utils/CopyEvent';
import { getNameForValue, Actions } from '@/staticJson/AnimationComponentsList';
import _ from 'lodash';

import UpMoveIcon from '@/assets/svg/eventIcons/upMoveAction.svg';
import DownMoveIcon from '@/assets/svg/eventIcons/downMoveAction.svg';
import RenameIcon from '@/assets/svg/eventIcons/rename.svg';
import DeleteIcon from '@/assets/svg/eventIcons/delete.svg';

import AnimateInOrOut from './AnimateInOrOut';
import styles from './index.less';
import CreateToggle from './CreateToggle';
import VisiableToggle from './VisiableToggle';
import VariableSettings from './VariableSettings';
import EventRelease from './EventRelease';
import GisEventRelease from './GisEventRelease';
import SceneInteraction from './SceneInteraction';
import VideoInteraction from './VideoInteraction';
// v6.18 新增动画设置
import AnimateSettings from './AnimateSettings';
// v6.19 新增全屏显示
import FullScreen from './FullScreen';
// v7.4 跳转页面设置
import JumpPage from './JumpPage';
import RefreshDataSource from './RefreshDataSource';

// v8.3.0 更新数据
import UpdateData from './UpdateData';
import CrossOriginMessage from './CrossOriginMessage';
import ComSpecialAction from './ComSpecialAction';
import RemoteEvent from './RemoteEvent';
import { getCurrentAction } from '../../utils';

const { Panel } = Collapse;

const py2 = { padding: '2 1' };

const isActionChange = (item, parentIdx, idx, activeActionKey) => {
  const currentActionTag = `action_${item.actionType}_${parentIdx}_${idx}`;
  if (activeActionKey === currentActionTag) {
    return ' actionActive';
  }
  return '';
};

const Action = ({ forceRender, item, type, parentIdx, idx, activeActionKey, setActiveActionKey, parentItem, comp }) => {
  // v6.18 action 新增参数actionName，并且兼容旧数据
  // let action = Actions.find((action) => action.value === type);
  let { actionName } = item;
  if (type && !actionName) {
    actionName = getNameForValue(type, Actions);
    item.actionName = actionName;
  }
  const [update, setUpdate] = useState(false);

  const delHandler = () => {
    const eventSettings = _.cloneDeep(comp.eventSetings);
    const event = eventSettings[parentIdx];
    const actionGroup = event.groups.find((ag) => ag.key === event.selectedKey);
    actionGroup?.actions?.splice(idx, 1);
    window.executeCommand('InteractionCommand', comp, eventSettings);
    forceRender(true);
  };

  const moveHandler = (ty) => {
    const eventSettings = _.cloneDeep(comp.eventSetings);
    const event = eventSettings[parentIdx];
    const actionGroup = event.groups.find((ag) => ag.key === event.selectedKey);
    const { actions } = actionGroup;
    const len = actions.length - 1;

    // 上移
    if (ty === 'up') {
      if (idx === 0) return message.warning('已经移动到最上面了');
      const action = actions.splice(idx, 1)[0];
      actions.splice(idx - 1, 0, action);
    } else {
      // 下移
      if (idx === len) return message.warning('已经移动到最下面了');
      const action = actions.splice(idx, 1)[0];
      actions.splice(idx + 1, 0, action);
    }

    window.executeCommand('InteractionCommand', comp, eventSettings);
    forceRender(true);
  };

  const ActionHead = (props) => {
    const eventSettings = _.cloneDeep(comp.eventSetings);
    const item = getCurrentAction(eventSettings, parentIdx, idx) ?? {};
    if (item.activeName === undefined) {
      item.activeName = '';
    }
    const [isActiveName, setIsActiveName] = useState(false);
    const [newName, setNewName] = useState(item.activeName);
    const activeDom = isActiveName ? (
      <Input
        className={styles.vetInput1}
        prefix={<span>{actionName}</span>}
        value={newName}
        onChange={(evt) => {
          setNewName(evt.target.value);
        }}
        onBlur={() => {
          setIsActiveName(false);
          item.activeName = newName;
          item.isActive = false;
          window.executeCommand('InteractionCommand', comp, eventSettings);
          props.refresh();
        }}
      />
    ) : (
      <span>{actionName + newName}</span>
    );

    return (
      <div
        onClick={(evt) => {
          if (evt.target.tagName.toLocaleLowerCase() === 'span') {
            return;
          }
          evt.stopPropagation();
          const str = `action_${item.actionType}_${parentIdx}_${idx}`;
          if (str !== activeActionKey) {
            item.activePropName = actionName + newName;
            setActiveActionKey(str);
            const _item = getCurrentAction(comp.eventSetings, parentIdx, idx);
            changeAction(_item);
          } else {
            setActiveActionKey('');
            changeAction();
          }
        }}
      >
        {/* <span>{actionName}</span> */}
        <span
          onClick={(evt) => {
            evt.stopPropagation();
          }}
        >
          {activeDom}
        </span>

        <span
          className={styles.rightOptions}
          onClick={(evt) => {
            evt.stopPropagation();
          }}
        >
          <Space>
            <Button
              icon={<img src={UpMoveIcon} alt='上移' />}
              size='small'
              style={py2}
              type='text'
              onClick={() => moveHandler('up')}
              title='上移'
            />

            <Button
              icon={<img src={DownMoveIcon} alt='下移' />}
              size='small'
              style={py2}
              type='text'
              onClick={() => moveHandler('down')}
              title='下移'
            />

            <Button
              icon={<img src={RenameIcon} alt='重命名' />}
              size='small'
              style={py2}
              type='text'
              onClick={() => {
                const isClick = !isActiveName;
                setIsActiveName(isClick);
              }}
              title='重命名'
            />

            <Button
              icon={<img src={DeleteIcon} alt='删除' />}
              type='text'
              size='small'
              style={py2}
              onClick={delHandler}
              title='删除'
            />
          </Space>
        </span>
      </div>
    );
  };

  const props = {
    refresh: forceRender,
    item,
    parentItem, // 需要直到前一个动作
    comp, // 组件
    parentIdx, // 事件索引
    idx, // 动作索引
  };

  const gisProps = {
    refresh: forceRender, // 刷新组件
    item, // 交互action
    initEventType: parentItem.eventType, // eventSeting 事件
    comp, // 组件
    parentIdx, // 事件索引
    idx, // 动作索引
  };

  console.log(type, 'type');

  // console.log(activeActionKey);
  return (
    <div>
      <Collapse
        defaultActiveKey={item.isActive ? [item.actionKey] : []}
        onChange={(evt) => {
          const eventSettings = _.cloneDeep(comp.eventSetings);
          const action = getCurrentAction(eventSettings, parentIdx, idx);
          action.isActive = evt.length > 0;
          window.executeCommand('InteractionCommand', comp, eventSettings);
        }}
      >
        <Panel
          className={styles.actionHeader + isActionChange(item, parentIdx, idx, activeActionKey)}
          header={<ActionHead {...props} />}
          key={item.actionKey}
        >
          {type === 'animateIn' && <AnimateInOrOut type='in' {...props} />}
          {type === 'animateOut' && <AnimateInOrOut type='out' {...props} />}
          {type === 'animateLoop' && <AnimateInOrOut type='loop' {...props} />}
          {type === 'dataQuery' && <QuoteTable {...props} update={update} setUpdate={setUpdate} />}
          {type === 'variableSettings' && <VariableSettings {...props} />}
          {type === 'createToggle' && <CreateToggle {...props} />}
          {type === 'visiableToggle' && <VisiableToggle {...props} />}
          {type === 'eventEmit' && <EventRelease {...props} />}
          {type === 'gisEventEmit' && <GisEventRelease {...gisProps} />}
          {type === 'sceneInteraction' && <SceneInteraction {...props} />}
          {type === 'videoInteraction' && <VideoInteraction {...props} />}
          {/* v6.18 新增动画设置 */}
          {type === 'animateSettings' && <AnimateSettings {...props} />}
          {/* v6.19 新增全屏显示 */}
          {type === 'fullScreen' && <FullScreen {...props} />}
          {/* 7.4 新增跳转页面 */}
          {type === 'jumpPage' && <JumpPage {...props} />}
          {/* 7.9 刷新数据源 */}
          {type === 'refreshDataSource' && <RefreshDataSource {...props} />}
          {/* v8.3.0 更新数据 */}
          {type === 'updateData' && <UpdateData {...props} />}
          {/** v8.5.0 触发组件特定动作 */}
          {type === 'comSpecialAction' && <ComSpecialAction {...props} />}
          {type === 'crossOriginMessage' && <CrossOriginMessage {...props} />}
          {/** v8.16.0 触发远程事件 */}
          {type === 'remoteEvent' && <RemoteEvent {...props} />}
        </Panel>
      </Collapse>
    </div>
  );
};

export default Action;
