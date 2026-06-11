import React, { Fragment, useState } from 'react';
import { Input, Row, Col, Tooltip } from 'antd';
import StoreTree from '@/components/StoreTree';

import { QuestionCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import ModalVariable from './ModalVariable';
import styles from './index.less';
import { getCurrentAction, setCurrentAction } from '../../../utils';

const { Search } = Input;
const VariableSettings = ({ comp, parentIdx, idx }) => {
  const [visiable, setVisiable] = useState();
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = getCurrentAction(eventSettings, parentIdx, idx);

  // type 预留用于后期的组件本身引用复值
  const { variable, value } = item.actionSettings ?? {};
  const [count, setCount] = useState(0);

  // 刷新当前组件(fix: 变量设置 - 设置变量值之后无法再重新改变变量)
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

  const changeVariable = (val) => {
    updateEventSettings();
    item.actionSettings.variable = val;
    refresh();
    window.executeCommand('InteractionCommand', comp, eventSettings);
  };

  const variableValueChange = (val) => {
    updateEventSettings();
    item.actionSettings.value = val;
    refresh();
    window.executeCommand('InteractionCommand', comp, eventSettings);
  };

  return (
    <>
      <div className={styles.variableContainer}>
        <ModalVariable
          code={value}
          visiable={visiable}
          onOk={(value) => {
            variableValueChange(value);
            setVisiable(false);
          }}
          onCancel={() => {
            setVisiable(false);
          }}
        />
        <Row>
          <Col className={styles.label} span={7}>
            变量
          </Col>
          <Col span={17}>
            <StoreTree value={variable} onChange={changeVariable} />
          </Col>
        </Row>
        <Row className={styles.variableValueRow}>
          <Col className={styles.label} span={7}>
            变量设值
            <Tooltip title='变量设值允许内部直接写脚本，通过return方式返回设置的变量值信息，会将原先的值默认以data传递进去'>
              <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
            </Tooltip>
          </Col>
          <Col span={17}>
            <Search
              className={styles.search}
              value={value}
              enterButton='设置'
              onSearch={() => {
                setVisiable(true);
              }}
            />
          </Col>
        </Row>
      </div>
    </>
  );
};
export default VariableSettings;
