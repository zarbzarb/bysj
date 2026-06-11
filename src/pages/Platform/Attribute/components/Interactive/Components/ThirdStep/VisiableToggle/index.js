/**
 * 显示隐藏交互
 */
import React, { Fragment, useState } from 'react';
import { Radio, Row, Col } from 'antd';
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
import _ from 'lodash';
import { useStore } from '@/hooks';
import styles from './index.less';
import CompTree from '../components/CompTree';
import SelectPage from '../components/SelectPage';
import { getCurrentAction, setCurrentAction } from '../../../utils';

// 兼容旧屏
const compatible = (item, selectedKey) => {
  if (item?.actionSettings && item.actionSettings.appPageId === undefined) {
    item.actionSettings.appPageId = selectedKey;
  }
};

const Index = ({ comp, parentIdx, idx }) => {
  const { globalStore, pageTabsStore } = useStore();
  compatible(getCurrentAction(comp.eventSetings, parentIdx, idx), pageTabsStore.selectedKey); // 兼容旧屏
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = getCurrentAction(eventSettings, parentIdx, idx);
  const { updateScreenConfig, bigScreenType } = globalStore;

  const [count, setCount] = useState(0);

  const setLogicLayerInitDisplay = () => {
    // 逻辑图层的初始化隐藏闪屏处理
    const { eventType } = comp.eventSetings[parentIdx];
    if (eventType !== 'initialization') return;
    // const { layerConfig = {} } = screenConfig;
    // TODO 8.0 layerConfig
    const { layerConfig = {} } = window.screenConfig || {};
    const { layers = [] } = layerConfig;
    const { compKey = [], visiable } = item.actionSettings;
    if (Array.isArray(compKey) && compKey.length > 0) {
      compKey.forEach((key) => {
        layers.some((layer) => {
          if (key === layer.key) {
            layer.hideFlag = visiable === '1';
            return true;
          }
          return false;
        });
      });
      // TODO 8.0多页面 设置逻辑图层状态， 只有当前页面
      updateScreenConfig(toJS(layers), 'layers', 'layerConfig');
    }
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

  const refresh = () => {
    setCount(count + 1);
  };

  const changeRefComp = (value) => {
    updateEventSettings();
    item.actionSettings.compKey = value; // value 是数组
    setLogicLayerInitDisplay();
    window.executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };
  const changeToggleHandler = (evt) => {
    updateEventSettings();
    item.actionSettings.visiable = evt.target.value;
    setLogicLayerInitDisplay();
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
      // 切换页面重置操作的组件
      item.actionSettings.compKey = '';
      window.executeCommand('InteractionCommand', comp, eventSettings);
    }
    setLogicLayerInitDisplay();
    refresh();
  };

  if (!item.actionSettings) return <></>;

  const { visiable, appPageId } = item.actionSettings;

  let { compKey } = item.actionSettings;

  // 兼容之前单选时compKey是字符串，当前多选为数组格式
  if (typeof compKey === 'string') {
    compKey = compKey === '' ? [] : [compKey];
  }

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
            <Radio.Group onChange={changeToggleHandler} value={visiable}>
              <Radio.Button value='0'>显示</Radio.Button>
              <Radio.Button value='1'>隐藏</Radio.Button>
              <Radio.Button value='2'>切换</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default observer(Index);
