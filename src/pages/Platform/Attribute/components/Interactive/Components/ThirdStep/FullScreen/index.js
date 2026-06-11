import React, { Fragment, useState } from 'react';
import { Radio, Row, Col } from 'antd';
import { cloneDeep } from 'lodash';
import styles from './index.less';
import { getCurrentAction, setCurrentAction } from '../../../utils';

const Index = ({ comp, parentIdx, idx }) => {
  let eventSettings = cloneDeep(comp.eventSetings);
  let item = getCurrentAction(eventSettings, parentIdx, idx);
  // 全屏显示配置
  const { fullScreen } = item.actionSettings;
  // 刷新状态值
  const [count, setCount] = useState(0);
  /**
   * 点击切换全屏显示变量设值
   * @param {*} evt
   */
  const updateEventSettings = () => {
    try {
      setCurrentAction(comp.eventSetings, parentIdx, idx, item);
      eventSettings = cloneDeep(comp.eventSetings);
      item = getCurrentAction(eventSettings, parentIdx, idx);
    } catch (error) {
      console.error(error);
    }
  };
  const changeHandler = (evt) => {
    updateEventSettings();
    item.actionSettings.fullScreen = evt.target.value;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };
  /**
   * 刷新组件
   */
  const refresh = () => {
    setCount(count + 1);
  };

  return (
    <>
      <div className={styles.fullScreenContainer}>
        <Row className={styles.fullScreenValueRow}>
          <Col className={styles.label} span={7}>
            操作类型
          </Col>
          <Col span={14}>
            <Radio.Group onChange={changeHandler} value={fullScreen}>
              <Radio.Button value='1'>全屏</Radio.Button>
              <Radio.Button value='0'>恢复</Radio.Button>
              <Radio.Button value='2'>切换</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Index;
