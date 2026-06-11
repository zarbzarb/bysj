import React, { Fragment, useState } from 'react';
import {
  // Select,
  InputNumber,
  Collapse,
  Button,
  Row,
  Col,
  Space,
  // TreeSelect
} from 'antd';
import { PlusCircleOutlined, DownOutlined } from '@ant-design/icons';
import shortId from 'short-uuid';
import { transformTranslate } from '@/utils/utils';
import { AnimationTypes } from '@/staticJson/AnimationComponentsList';
import { cloneDeep } from 'lodash';

import UpMoveIcon from '@/assets/svg/eventIcons/upMoveAction.svg';
import DownMoveIcon from '@/assets/svg/eventIcons/downMoveAction.svg';
import DeleteIcon from '@/assets/svg/eventIcons/delete.svg';

import AnimateQueue from './components/AnimateQueue';
import styles from './index.less';
import CompTree from '../components/CompTree';
import { getCurrentAction, setCurrentAction } from '../../../utils';

const { Panel } = Collapse;

const getComponent = window.DataI.getComponentByKey;

const py2 = { padding: '2 1' };

const AnimateComp = ({ comp, parentIdx, idx, type, refresh }) => {
  let eventSettings = cloneDeep(comp.eventSetings);
  const item = getCurrentAction(eventSettings, parentIdx, idx);
  const { actionSettings } = item;
  const { startPosition, animationStep } = actionSettings;
  const [count, setCount] = useState(0);

  const updateEventSettings = () => {
    try {
      setCurrentAction(comp.eventSetings, parentIdx, idx, item);
      eventSettings = cloneDeep(comp.eventSetings);
    } catch (error) {
      console.error(error);
    }
  };
  const comRefresh = () => {
    updateEventSettings();
    window.executeCommand('InteractionCommand', comp, eventSettings);
    setCount(count + 1);
  };
  const HeaderNode = ({ item: itm, idx: id, topSeat, downSeat, delHandler }) => {
    const ty = itm.animationType;

    const animateName = AnimationTypes.find((vl) => vl.value === ty);

    return (
      <div className={styles.animateStepHeader}>
        <div className={styles.leftTitle}>
          <span>{`动画步骤 ${id + 1} - ${animateName.name}`}</span>
          <div className={styles.headerOperation}>
            <Space.Compact>
              <Button
                icon={<img src={UpMoveIcon} alt='上移' />}
                size='small'
                type='text'
                style={py2}
                onClick={(evt) => {
                  evt.stopPropagation();
                  topSeat(id);
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
                  downSeat(id);
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
                  delHandler(id);
                }}
                title='删除'
              />
            </Space.Compact>
          </div>
        </div>
      </div>
    );
  };

  const addAnimateStep = () => {
    actionSettings.animationStep.push({
      animationType: 'swing',
      delay: 3,
      duration: 3,
    });
    // refresh();
    comRefresh();
  };

  const delHandler = (idx) => {
    actionSettings.animationStep.splice(idx, 1);
    // refresh();
    comRefresh();
  };

  const changeRefComp = (value) => {
    const animateKey = shortId.generate();
    if (value === item.associatComponents) return;
    if (item.animateKey) {
      // 移除之前绑定动画信息-------
      const comp = getComponent(item.associatComponents);
      if (comp && comp.animateQueue) {
        comp.animateQueue = comp.animateQueue.filter((animateName, idx) => {
          return animateName != item.animateKey;
        });
      }
    } else {
      item.animateKey = animateKey;
    }
    item.associatComponents = value;
    const comp = getComponent(value);
    // 给关联组件绑定动画属性信息------
    if (comp.animateQueue) {
      comp.animateQueue.push(item.animateKey);
    } else {
      comp.animateQueue = [item.animateKey];
    }
    if (startPosition) {
      const transform = transformTranslate(comp.styles.transform);
      startPosition.x = transform[0];
      startPosition.y = transform[1];
    }
    // refresh();
    comRefresh();
  };

  const topSeatHandler = (idx) => {
    if (idx === 0) return;
    [animationStep[idx - 1], animationStep[idx]] = [animationStep[idx], animationStep[idx - 1]];
    // refresh();
    comRefresh();
  };

  const downSeatHandler = (idx) => {
    if (idx >= animationStep.length - 1 || animationStep.length === 1) {
      return;
    }
    [animationStep[idx], animationStep[idx + 1]] = [animationStep[idx + 1], animationStep[idx]];
    // refresh();
    comRefresh();
  };

  return (
    <>
      <Row className={styles.mapComp}>
        <Col className={styles.label} span={7}>
          映射组件
        </Col>
        <Col span={17}>
          <CompTree
            type='animate' // 动画不能选择图层
            relation={item.associatComponents}
            onTreeChange={changeRefComp}
          />
        </Col>
      </Row>

      <Row className={styles.startContainer}>
        <Col className={styles.label} span={7}>
          起始位置
        </Col>
        <Col span={17}>
          <span className={styles.unitText}>x：</span>
          <InputNumber
            className={styles.startInput}
            onBlur={(evt) => {
              startPosition.x = evt.target.value || 0;
              // refresh();
              comRefresh();
            }}
            onStep={(evt) => {
              startPosition.x = evt;
              comRefresh();
            }}
            value={startPosition.x}
          />
          <span className={styles.unitText}>y：</span>
          <InputNumber
            className={styles.startInput}
            onBlur={(evt) => {
              startPosition.y = evt.target.value || 0;
              comRefresh();
            }}
            onStep={(evt) => {
              startPosition.y = evt;
              comRefresh();
            }}
            value={startPosition.y}
          />
        </Col>
      </Row>

      <Collapse
        className={styles.Collapse}
        expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 0 : -90} />}
        expandIconPosition='end'
      >
        {animationStep.map((setting, index) => {
          return (
            <Panel
              key={index}
              className={styles.animateStep}
              header={
                <HeaderNode
                  item={setting}
                  topSeat={topSeatHandler}
                  downSeat={downSeatHandler}
                  delHandler={delHandler}
                  idx={index}
                />
              }
            >
              <AnimateQueue refresh={comRefresh} key={index} idx={index} item={setting} />
            </Panel>
          );
        })}
      </Collapse>

      <div className={styles.stepAddBtn}>
        <Button onClick={addAnimateStep} type='link' icon={<PlusCircleOutlined />}>
          新增动画步骤1
        </Button>
      </div>
    </>
  );
};

export default AnimateComp;
