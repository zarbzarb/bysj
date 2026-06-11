import React, { Fragment } from 'react';
import { Input, Row, Col, Tooltip, TreeSelect } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import styles from './index.less';
// import StoreTree from '@/components/StoreTree';
import EditorParams from '../../Common/EditorParams';
// import { customComps } from '../../ThirdStep/UpdateData/index';
import { getInitParam } from '../../Common/common';

const { TreeNode } = TreeSelect;

// v8.3 兼容旧屏
const compatible = (item) => {
  if (item.dataParams === undefined || item.dataParams?.length === 0) {
    const initParam = getInitParam();
    initParam.paramName = '监听数据';
    // 变量
    initParam.updateType = 3;
    initParam.variableKey = item.eventListenWithDataInjectVariable;
    item.dataParams = [initParam]; // 设置初始默认值
  }
};

const index = ({ idx, refresh, comp, agIdx }) => {
  compatible(comp.eventSetings[idx]?.groups[agIdx]); // 兼容旧屏
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = eventSettings[idx];
  let currentGroup = item.groups[agIdx];
  // type 预留用于后期的组件本身引用复值
  const { eventListenKey, dataParams = [] } = currentGroup;

  const updateEventSettings = () => {
    try {
      comp.eventSetings[idx] = { ...comp.eventSetings[idx], ..._.omit(item, ['groups']) };
      eventSettings = _.cloneDeep(comp.eventSetings);
      item = eventSettings[idx];
      currentGroup = eventSettings[idx].groups[agIdx];
    } catch (error) {
      console.error(error);
    }
  };

  const blurHandler = (evt) => {
    updateEventSettings();
    // item.eventListenKey = evt.target.value;
    currentGroup.eventListenKey = evt.target.value;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  // 保存编辑参数
  const handleOk = (params) => {
    updateEventSettings();
    // item.dataParams = params;
    // 下面是对旧格式的赋值，变量引用关系展示会用到
    // item.eventListenWithDataInjectVariable = params[0] && params[0].updateType === 3 ? params[0].variableKey : '';

    currentGroup.dataParams = params;
    currentGroup.eventListenWithDataInjectVariable =
      params[0] && params[0].updateType === 3 ? params[0].variableKey : '';

    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  // const dataInjectWidthVariable = (val) => {
  //   updateEventSettings();
  //   item.eventListenWithDataInjectVariable = val;
  //   executeCommand('InteractionCommand', comp, eventSettings);
  //   refresh();
  // };

  const renderNode = (children = []) => {
    return children.map((variableGroup, idx) => {
      return (
        <TreeNode disabled value={variableGroup.key} title={variableGroup.name}>
          {variableGroup.children &&
            variableGroup.children.map((variable, index) => {
              return <TreeNode value={variable.key} title={variable.name} />;
            })}
        </TreeNode>
      );
    });
  };

  return (
    <>
      <div className={styles.listenContainer}>
        <Row className={styles.listenValueRow}>
          <Col className={styles.label} span={7}>
            监听事件key
          </Col>
          <Col span={14}>
            <Input defaultValue={eventListenKey} placeholder='请设置值' onBlur={blurHandler} className={styles.input} />
          </Col>
        </Row>

        <Row className={styles.listenValueRow}>
          <Col className={styles.label} span={7}>
            注入数据到
            {/* <Tooltip title='注入变量主要为外部监听接收输入注入到指定变量中，可以忽略'>
              <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
            </Tooltip> */}
          </Col>
          <Col span={14}>
            <EditorParams
              editorType='set'
              filterUpdateType={[2, 3]}
              initParams={dataParams}
              comp={comp} // 当前组件
              eventSetting={eventSettings[idx]} // 当前事件
              onOk={handleOk}
              showVariableExpression={false}
              callFrom='listenEvent'
              // customComps={customComps}
            />
          </Col>
        </Row>
      </div>
    </>
  );
};

export default index;
