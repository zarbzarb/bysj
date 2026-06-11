import React, { Fragment, useState } from 'react';
import { Row, Col, Select, Input } from 'antd';
import s from './index.less';
import _ from 'lodash';
import { getCurrentAction, setCurrentAction } from '../../../utils';

const { Option } = Select;
let scenes = [
  {
    label: '场景1',
    value: '0',
  },
  {
    label: '场景2',
    value: '1',
  },
  {
    label: '场景3',
    value: '2',
  },
];

const actions = [
  {
    value: '0',
    label: '清晨',
  },
  {
    value: '1',
    label: '中午',
  },
  {
    value: '2',
    label: '傍晚',
  },
  {
    value: '3',
    label: '夜晚',
  },
  {
    value: '4',
    label: '晴',
  },
  {
    value: '5',
    label: '雨',
  },
  {
    value: '6',
    label: '雪',
  },
  {
    value: '7',
    label: '开始巡游',
  },
  {
    value: '8',
    label: '结束巡游',
  },
  {
    value: '9',
    label: '火情出现',
  },
  {
    value: '10',
    label: '逃生路线',
  },
  {
    value: '11',
    label: '警车出动',
  },
  {
    value: '12',
    label: '重置所有状态',
  },
  {
    value: '13',
    label: '暂停旋转',
  },
  {
    value: '14',
    label: '火情消失',
  },
  {
    value: '15',
    label: '隐藏逃生路线',
  },
  {
    value: '16',
    label: '警车回到起始点',
  },
];
const Index = ({ comp, parentIdx, idx }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = getCurrentAction(eventSettings, parentIdx, idx);
  const [count, setCount] = useState(0);
  const filterScreen = (list) => {
    return list.filter((com) => {
      if (com.type === '@yl/dataq-com-group-basic') {
        filterScreen(com.childComList);
      }
      return com.type === 'UnrealEngine';
    });
  };
  scenes = filterScreen(window.componentList || []);

  const refresh = () => {
    setCount(count + 1);
  };
  const updateEventSettings = () => {
    try {
      setCurrentAction(comp.eventSetings, parentIdx, idx, item);
      eventSettings = _.cloneDeep(comp.eventSetings);
      item = getCurrentAction(eventSettings, parentIdx, idx);
    } catch (error) {
      console.error(error);
    }
  };
  // 选择场景
  const scenesChange = (v) => {
    updateEventSettings();
    // 记录场景
    item.actionSettings.scenekey = v;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };
  // 选择动作
  const actionsChange = (v) => {
    updateEventSettings();
    // 记录动作
    item.actionSettings.actionKey = v;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };
  return (
    <Fragment>
      <div className={s.sceneInteractionContainer}>
        <Row className={s.sceneInteractionValueRow}>
          <Col span={7}>选择场景</Col>
          <Col span={17}>
            <Select
              style={{ width: '100%' }}
              placeholder='请选择场景'
              value={item.actionSettings.scenekey}
              onChange={scenesChange}
            >
              {scenes.map((s) => (
                <Option value={s.key}>{s.name || s.compName}</Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Row className={s.sceneInteractionValueRow}>
          <Col span={7}>选择效果</Col>
          <Col span={17}>
            <Select
              style={{ width: '100%' }}
              placeholder='请选择效果'
              value={item.actionSettings.actionKey}
              options={actions}
              onChange={actionsChange}
            ></Select>
          </Col>
        </Row>
        {/* {(item.actionSettings.actionKey == 7 ||
          item.actionSettings.actionKey == 8) && (
          <Row className={s.sceneInteractionValueRow}>
            <Col span={7}>漫游key</Col>
            <Col span={17}>
              <Input
                value={item.actionSettings.roamKey}
                onChange={(e) => {
                  // 记录漫游key
                  item.actionSettings.roamKey = e.target.value;
                  refresh();
                }}
              />
            </Col>
          </Row>
        )} */}
      </div>
    </Fragment>
  );
};

export default Index;
