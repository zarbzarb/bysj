import React, { Fragment, useState } from 'react';
import { Radio, Row, Col } from 'antd';
import { useStore } from '@/hooks';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import styles from './index.less';
import CompTree from '../components/CompTree';
import SelectPage from '../components/SelectPage';
import { getCurrentAction, setCurrentAction } from '../../../utils';

// 兼容旧屏
const compatible = (item, selectedKey) => {
  if (item.actionSettings.appPageId === undefined) {
    item.actionSettings.appPageId = selectedKey;
  }
};

const Index = ({ comp, parentIdx, idx }) => {
  const {
    pageTabsStore,
    globalStore: { bigScreenType },
  } = useStore();
  compatible(getCurrentAction(comp.eventSetings, parentIdx, idx), pageTabsStore.selectedKey); // 兼容旧屏

  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = getCurrentAction(eventSettings, parentIdx, idx);

  const { createFlag, appPageId } = item.actionSettings;
  let { compKey } = item.actionSettings;

  const [count, setCount] = useState(0);

  const refresh = () => {
    setCount(count + 1);
  };

  // 兼容之前单选时compKey是字符串，当前多选为数组格式
  if (typeof compKey === 'string') {
    compKey = compKey === '' ? [] : [compKey];
  }
  const updateEventSettings = () => {
    try {
      setCurrentAction(comp.eventSetings, parentIdx, idx, item);
      eventSettings = _.cloneDeep(comp.eventSetings);
      item = getCurrentAction(eventSettings, parentIdx, idx);
    } catch (error) {
      console.error(error);
    }
  };
  const changeRefComp = (value) => {
    updateEventSettings();
    item.actionSettings.compKey = value;
    window.executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };
  const changeToggleHandler = (evt) => {
    updateEventSettings();
    item.actionSettings.createFlag = evt.target.value;
    window.executeCommand('InteractionCommand', comp, eventSettings);
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
      window.executeCommand('InteractionCommand', comp, eventSettings);
    }
    refresh();
  };

  return (
    <>
      <div className={styles.toggleContainer}>
        {/* 选择页面 */}
        {bigScreenType === 'page' && <SelectPage appPageId={appPageId} handlePageTreeChange={handlePageTreeChange} />}
        <Row>
          <Col className={styles.label} span={7}>
            被操作组件
          </Col>
          <Col span={17}>
            <CompTree relation={compKey} onTreeChange={changeRefComp} appPageId={appPageId} />
          </Col>
        </Row>
        <Row className={styles.toggleValueRow}>
          <Col className={styles.label} span={7}>
            操作类型
          </Col>
          <Col span={14}>
            <Radio.Group onChange={changeToggleHandler} value={createFlag}>
              <Radio.Button value={1}>创建</Radio.Button>
              <Radio.Button value={0}>销毁</Radio.Button>
              <Radio.Button value={2}>切换</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Index;
