/**
 * v8.15: 跨源通讯
 */
import React, { useState } from 'react';
import { Input, Row, Col, Tooltip, TreeSelect, Radio } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import styles from './index.less';
import OriginData from '../../Common/OriginData';
import { useStore } from '@/hooks';
import CompTree from './CompTree';
import SelectPage from '../components/SelectPage';
import { getCurrentAction, setCurrentAction } from '../../../utils';

const compatible = (item, selectedKey) => {
  if (item?.actionSettings && !item.actionSettings.appPageId) {
    item.actionSettings.appPageId = selectedKey;
  }
};

export const Index = ({ comp, parentIdx, idx }) => {
  const {
    pageTabsStore,
    globalStore: { bigScreenType },
  } = useStore();
  const action = getCurrentAction(comp.eventSetings, parentIdx, idx);
  compatible(action, pageTabsStore.selectedKey);
  if (!action.actionSettings) {
    return <></>;
  }
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = getCurrentAction(eventSettings, parentIdx, idx);

  const [count, setCount] = useState(0);

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

  const handleTargetTypeChange = (e) => {
    updateEventSettings();
    item.actionSettings.targetType = e.target.value;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  /**
   * 选择页面
   * @param {*} val
   */
  const handlePageTreeChange = (val, type) => {
    updateEventSettings();
    item.actionSettings.appPageId = val;
    if (type !== 'init') {
      item.actionSettings.compKey = ''; // 切换页面重置操作的组件
      executeCommand('InteractionCommand', comp, eventSettings);
    }
    refresh();
  };

  const changeRefComp = (value) => {
    updateEventSettings();
    item.actionSettings.compKey = value;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const handleIsTargetChange = (e) => {
    updateEventSettings();
    item.actionSettings.isTarget = e.target.value;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const handleOk = (params) => {
    updateEventSettings();
    item.actionSettings.targetUrl = params;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const handleSendOk = (params) => {
    updateEventSettings();
    item.actionSettings.sendData = params;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const { targetType, compKey, appPageId, isTarget, targetUrl = [], sendData = [] } = item.actionSettings;

  return (
    <>
      <div className={styles.listenContainer}>
        <Row className={styles.listenValueRow} style={{ marginBottom: 8 }}>
          <Col className={styles.label} span={7}>
            发送目标
            {/* <Tooltip title='监听浏览器message事件，用于监听postMessage事件并获取内容'>
              <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
            </Tooltip> */}
          </Col>
          <Col span={17}>
            <Radio.Group onChange={handleTargetTypeChange} value={targetType}>
              <Radio value='iframe'>iframe组件</Radio>
              <Radio value='parent'>父页面</Radio>
            </Radio.Group>
          </Col>
        </Row>
        {targetType === 'iframe' && (
          <>
            {/* 选择页面 */}
            {bigScreenType === 'page' && (
              <SelectPage appPageId={appPageId} handlePageTreeChange={handlePageTreeChange} from='CrossOriginMessage' />
            )}
            <Row>
              <Col className={styles.label} span={7}>
                目标组件
              </Col>
              <Col span={17}>
                <CompTree
                  type='compData' // 不能选择图层
                  appPageId={appPageId}
                  relation={compKey}
                  onTreeChange={changeRefComp}
                />
              </Col>
            </Row>
          </>
        )}
        <Row className={styles.listenValueRow}>
          <Col className={styles.label} span={7}>
            目标源判断
          </Col>
          <Col span={17}>
            <Radio.Group onChange={handleIsTargetChange} value={isTarget}>
              <Radio value={false}>否</Radio>
              <Radio value={true}>是</Radio>
            </Radio.Group>
          </Col>
        </Row>
        {isTarget && (
          <Row className={styles.listenValueRow}>
            <Col className={styles.label} span={7}>
              目标源地址
            </Col>
            <Col span={17}>
              <OriginData
                initParams={targetUrl}
                comp={comp} // 当前组件
                eventSetting={eventSettings[idx]} // 当前事件
                onOk={handleOk}
                inputPlaceholder='请输入目标源的URL地址，支持多地址，多地址时以“,”隔开'
                // callFrom='listenEvent'
              />
            </Col>
          </Row>
        )}
        <Row className={styles.listenValueRow}>
          <Col className={styles.label} span={7}>
            发送内容
          </Col>
          <Col span={17}>
            <OriginData
              initParams={sendData}
              comp={comp} // 当前组件
              eventSetting={eventSettings[idx]} // 当前事件
              onOk={handleSendOk}
              inputPlaceholder='请输入'
              // callFrom='listenEvent'
            />
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Index;
