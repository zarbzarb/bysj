import React, { Fragment, useState, useEffect } from 'react';
import { Collapse, Button, Space } from 'antd';
import {
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  PlusCircleOutlined,
  DownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { AnimationSettingConfig } from '@/staticJson/AnimationComponentsList';
import { createKeyName } from '@/utils/random';
import _ from 'lodash';

import UpMoveIcon from '@/assets/svg/eventIcons/upMoveAction.svg';
import DownMoveIcon from '@/assets/svg/eventIcons/downMoveAction.svg';
import RenameIcon from '@/assets/svg/eventIcons/rename.svg';
import DeleteIcon from '@/assets/svg/eventIcons/delete.svg';

import AnimateSetting from './components/AnimateSetting';
import styles from './index.less';
import { getCurrentAction, setCurrentAction } from '../../../utils';

const { Panel } = Collapse;

const py2 = { padding: '2 1' };

/**
 * 面板头部组件，显示动作名称，并且有三个按钮，上移、下移、删除
 * @param {*} param0
 * idx 面板位置
 * list 面板对应数据数组
 * dispatch 处理
 * @returns
 */
const AnimationHeader = ({ idx, list, parentRefresh }) => {
  // 面板对应数据
  const dataModel = list[idx];
  const { animationName } = dataModel;
  // 上移动作
  const topSeat = (idx) => {
    // 判断是否第一个动作，是的话，禁止上移；
    if (idx == 0) return;
    [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
    parentRefresh();
  };
  // 下移动作
  const downSeat = (idx) => {
    // 判断是不是最后一个动作，是的话，禁止下移；
    if (idx >= list.length - 1 || list.length == 1) {
      return;
    }
    [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
    parentRefresh();
  };
  // 删除动作
  const delHandler = (idx) => {
    list.splice(idx, 1);
    parentRefresh();
  };
  return (
    <div className={styles.animateStepHeader}>
      <div className={styles.leftTitle}>
        <span>{`动画动作 ${idx + 1} - ${animationName || ''}`}</span>
        <div className={styles.headerOperation}>
          <Space>
            <Button
              icon={<img src={UpMoveIcon} alt='上移' />}
              size='small'
              type='text'
              style={py2}
              onClick={(evt) => {
                evt.stopPropagation();
                topSeat(idx);
              }}
              title='上移'
            />

            <Button
              icon={<img src={DownMoveIcon} alt='下移' />}
              size='small'
              type='text'
              style={py2}
              onClick={(evt) => {
                evt.stopPropagation();
                downSeat(idx);
              }}
              title='下移'
            />

            <Button
              icon={<img src={DeleteIcon} alt='删除' />}
              size='small'
              type='text'
              style={py2}
              onClick={(evt) => {
                evt.stopPropagation();
                delHandler(idx);
              }}
              title='删除'
            />
          </Space>
        </div>
      </div>
    </div>
  );
};
const AnimateSettingsComp = ({ comp, parentIdx, idx, parentItem = {} }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, idx) ?? {};

  const [count, setCount] = useState(0);
  const updateEventSettings = () => {
    try {
      setCurrentAction(comp.eventSetings, parentIdx, idx, action);
      eventSettings = _.cloneDeep(comp.eventSetings);
    } catch (error) {
      console.error(error);
    }
  };
  const comRefresh = () => {
    updateEventSettings();
    window.executeCommand('InteractionCommand', comp, eventSettings);
    setCount(count + 1);
  };
  // let { actionSettings } = item;
  // let { animationSettings } = actionSettings;

  const { actionSettings = {} } = action;
  const { animationSettings = [] } = actionSettings;
  // 添加动作，需要生成key
  const addAnimationSetting = () => {
    const payload = {
      ...AnimationSettingConfig,
      animationSettingKey: createKeyName(),
    };
    animationSettings.push(payload);
    comRefresh();
  };

  const { eventType = '' } = parentItem;

  return (
    <>
      <Collapse
        className={styles.Collapse}
        // defaultActiveKey={[defaultActiveKey]}
        expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 0 : -90} />}
        expandIconPosition='end'
        defaultActiveKey={actionSettings.activeKey || []}
        onChange={(evt) => {
          // v7.6 记录动画展开收起状态
          // console.log('evt', evt);
          // actionSettings.activeKey = evt || [];
          const keyList = new Set(
            animationSettings.map((setting) => {
              return setting.animationSettingKey;
            }),
          );
          // console.log('keyList', keyList);
          actionSettings.activeKey = (evt || []).filter((key) => {
            return keyList.has(key);
          });
          // console.log('actionSettings.activeKey', actionSettings.activeKey);
          // v7.7.1保存动画设置展开状态
          comRefresh();
        }}
      >
        {animationSettings.map((setting, idx) => {
          return (
            <Panel
              key={setting.animationSettingKey}
              className={styles.animateStep}
              // 面板头部
              header={<AnimationHeader idx={idx} list={animationSettings} parentRefresh={comRefresh} />}
            >
              {/* 面板内容 */}
              <AnimateSetting setting={setting} parentRefresh={comRefresh} type={eventType} />
            </Panel>
          );
        })}
      </Collapse>
      {/* 添加动作按钮 */}
      <div className={styles.stepAddBtn}>
        <Button onClick={addAnimationSetting} type='link' icon={<PlusCircleOutlined />}>
          添加动画动作
        </Button>
      </div>
    </>
  );
};

export default AnimateSettingsComp;
