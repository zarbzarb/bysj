/**
 * v8.15: 监听浏览器事件
 */
import React, { Fragment } from 'react';
import { Input, Row, Col, Tooltip, TreeSelect, Radio } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import styles from './index.less';
// import StoreTree from '@/components/StoreTree';
import EditorParams from '../../Common/EditorParams';
import OriginData from '../../Common/OriginData';
// import { customComps } from '../../ThirdStep/UpdateData/index';
import { getInitParam } from '../../Common/common';

const compatible = (item) => {
  if (item.originUrl === undefined || item.originUrl?.length === 0) {
    item.originUrl = [
      {
        updateType: 1,
        inputVal: undefined,
        compKey: undefined,
        compDataItem: undefined,
        compDataItemOptions: [],
        variableKey: undefined,
      },
    ]; // 设置初始默认值
  }
};

const compatible2 = (item) => {
  if (item.dataParams === undefined || item.dataParams?.length === 0) {
    const initParam = getInitParam();
    initParam.paramName = '监听数据';
    // 变量
    initParam.updateType = 3;
    item.dataParams = [initParam]; // 设置初始默认值
  }
};

export const EventConfig = ({ idx, refresh, comp }) => {
  compatible(comp.eventSetings[idx]); // 兼容旧屏
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = eventSettings[idx];
  // let currentGroup = item.groups[agIdx];
  // type 预留用于后期的组件本身引用复值
  // const { eventListenKey, dataParams = [] } = currentGroup;
  const { originUrl = [] } = item;

  const updateEventSettings = () => {
    try {
      comp.eventSetings[idx] = { ...comp.eventSetings[idx], ..._.omit(item, ['groups']) };
      eventSettings = _.cloneDeep(comp.eventSetings);
      item = eventSettings[idx];
    } catch (error) {
      console.error(error);
    }
  };

  const handleEventTypeChange = (val) => {
    updateEventSettings();
    item.browserEventType = val;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const handleOriginChange = (e) => {
    updateEventSettings();
    item.isOrigin = e.target.value;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const handleOk = (params) => {
    console.log('originUrl', params);
    updateEventSettings();
    item.originUrl = params;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  return (
    <>
      <div className={styles.listenContainer}>
        <Row className={styles.listenValueRow}>
          <Col className={styles.label} span={7}>
            事件类型
            <Tooltip title='监听浏览器message事件，用于监听postMessage事件并获取内容'>
              <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
            </Tooltip>
          </Col>
          <Col span={17}>
            <Select
              placeholder='请选择'
              value={item.browserEventType}
              options={[
                {
                  value: 'message',
                  label: 'message',
                },
              ]}
              onChange={handleEventTypeChange}
            />
          </Col>
        </Row>
        <Row className={styles.listenValueRow}>
          <Col className={styles.label} span={7}>
            来源判断
          </Col>
          <Col span={17}>
            <Radio.Group onChange={handleOriginChange} value={item.isOrigin}>
              <Radio value={0}>否</Radio>
              <Radio value={1}>是</Radio>
            </Radio.Group>
          </Col>
        </Row>
        {item.isOrigin === 1 && (
          <Row className={styles.listenValueRow}>
            <Col className={styles.label} span={7}>
              来源地址
            </Col>
            <Col span={17}>
              <OriginData
                initParams={originUrl}
                comp={comp} // 当前组件
                eventSetting={eventSettings[idx]} // 当前事件
                onOk={handleOk}
                inputPlaceholder='请输入来源RUL地址，支持多地址，多地址时以“,”隔开'
                // callFrom='listenEvent'
              />
            </Col>
          </Row>
        )}
        {/* <Row className={styles.listenValueRow}>
          <Col className={styles.label} span={7}></Col>
          <Col span={14}>
            {
              item.isOriginType === 1 && (
                <Input
                  defaultValue={currentGroup.origin}
                  placeholder='请输入来源RUL地址，支持多地址，多地址时以“,”隔开'
                  onBlur={(evt) => {
                    updateEventSettings();
                    currentGroup.origin = evt.target.value;
                    executeCommand('InteractionCommand', comp, eventSettings);
                    refresh();
                  }}
                />
              )
            }
            {
              item.isOriginType === 2 && (
                <Input
                  defaultValue={currentGroup.origin}
                  placeholder='请输入来源RUL地址，支持多地址，多地址时以“,”隔开'
                  onBlur={(evt) => {
                    updateEventSettings();
                    currentGroup.origin = evt.target.value;
                    executeCommand('InteractionCommand', comp, eventSettings);
                    refresh();
                  }}
                />
              )
            }
            {
              item.isOriginType === 3 && (
                <Input
                  defaultValue={currentGroup.origin}
                  placeholder='请输入来源RUL地址，支持多地址，多地址时以“,”隔开'
                  onBlur={(evt) => {
                    updateEventSettings();
                    currentGroup.origin = evt.target.value;
                    executeCommand('InteractionCommand', comp, eventSettings);
                    refresh();
                  }}
                />
              )
            }
          </Col>
        </Row> */}
      </div>
    </>
  );
};

export const ActionConfig = ({ idx, refresh, comp, agIdx }) => {
  compatible2(comp.eventSetings[idx]?.groups[agIdx]);
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

  return (
    <div className={styles.listenContainer}>
      <Row className={styles.listenValueRow}>
        <Col className={styles.label} span={7}>
          注入数据到
        </Col>
        <Col span={17}>
          <EditorParams
            editorType='set'
            filterUpdateType={[2, 3]}
            initParams={dataParams}
            comp={comp} // 当前组件
            eventSetting={eventSettings[idx]} // 当前事件
            onOk={handleOk}
            showVariableExpression={false}
            callFrom='ListenBrowserEvent'
            // customComps={customComps}
          />
        </Col>
      </Row>
    </div>
  );
};
