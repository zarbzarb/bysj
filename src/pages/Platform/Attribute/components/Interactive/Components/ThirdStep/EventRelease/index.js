/**
 * 事件发布交互
 */
import React, { Fragment, useState, useRef } from 'react';
import { Radio, Input, Row, Col } from 'antd';
import styles from './index.less';
import StoreTree from '@/components/StoreTree';
import add from '@/assets/newIcon/add.png';
import EditorParams from '../../Common/EditorParams';
import { getInitParam } from '../../Common/common';
// import DataManage, { toggleDataVisible } from '@/pages/Platform/DataManage';
import _ from 'lodash';
import { useStore } from '@/hooks';
import { getCurrentAction, setCurrentAction } from '../../../utils';

// v8.3 兼容旧屏
const compatible = (item) => {
  if (item.actionSettings.dataParams === undefined || item.actionSettings.dataParams?.length === 0) {
    const initParam = getInitParam();
    initParam.paramName = '发布数据';
    if (item.actionSettings.eventType == '1') {
      // 固定参数
      initParam.updateType = 1;
      initParam.inputVal = item.actionSettings.eventValue;
    } else if (item.actionSettings.eventType == '2') {
      // 变量
      initParam.updateType = 3;
      initParam.variableKey = item.actionSettings.variableKey;
    }
    item.actionSettings.dataParams = [initParam]; // 设置初始默认值
  }
};

const Index = ({ comp, parentIdx, idx }) => {
  compatible(getCurrentAction(comp.eventSetings, parentIdx, idx)); // 兼容旧屏
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = getCurrentAction(eventSettings, parentIdx, idx);
  const [count, setCount] = useState(0);
  //type 预留用于后期的组件本身引用复值
  const { eventKey, dataParams = [] } = item.actionSettings;
  const updateEventSettings = () => {
    try {
      setCurrentAction(comp.eventSetings, parentIdx, idx, item);
      eventSettings = _.cloneDeep(comp.eventSetings);
      item = getCurrentAction(eventSettings, parentIdx, idx);
    } catch (error) {
      console.error(error);
    }
  };
  const changeEventKey = (evt) => {
    updateEventSettings();
    item.actionSettings.eventKey = evt.target.value;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  // 保存编辑参数
  const handleOk = (params) => {
    updateEventSettings();
    item.actionSettings.dataParams = params;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const refresh = () => {
    setCount(count + 1);
  };

  return (
    <Fragment>
      <div className={styles.eventReleaseContainer}>
        <Row>
          <Col className={styles.label} span={7}>
            事件key
          </Col>
          <Col span={14}>
            <Input defaultValue={eventKey} onBlur={changeEventKey} />
          </Col>
        </Row>

        <Row className={styles.eventReleaseValueRow}>
          <Col className={styles.label} span={7}>
            参数方式
          </Col>
          <Col span={14}>
            <EditorParams
              editorType='get'
              initParams={dataParams}
              comp={comp} // 当前组件
              eventSetting={eventSettings[parentIdx]} // 当前事件
              onOk={handleOk}
              showVariableExpression={false}
            />
          </Col>
        </Row>
      </div>
      {/* <DataManage type={'1'} /> */}
    </Fragment>
  );
};

export default Index;
