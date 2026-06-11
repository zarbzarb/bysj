import React, { useState } from 'react';
import { Button, Row, Col, message } from 'antd';
import _ from 'lodash';
import { useStore } from '@/hooks';
import successIcon from '@/assets/icon/success.png';
import classNames from 'classnames';
import CompTree from '../components/CompTree';
import SelectPage from '../components/SelectPage';
import styles from './index.less';
import ModalEditorParams from './ModalEditorParams';
import { getCurrentAction, setCurrentAction } from '../../../utils';

const getComponent = window.DataI.getComponentByKey;

// 兼容旧屏
const compatible = (item, selectedKey) => {
  if (!item?.actionSettings) return;
  if (item?.actionSettings?.appPageId === undefined) {
    item.actionSettings.appPageId = selectedKey;
  }
};

const RefreshDataSource = ({ comp, parentIdx, idx }) => {
  const {
    pageTabsStore,
    globalStore: { bigScreenType },
  } = useStore();

  const action = getCurrentAction(comp.eventSetings, parentIdx, idx);
  if (!action.actionSettings) {
    return <></>;
  }

  compatible(action, pageTabsStore.selectedKey); // 兼容旧屏
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = getCurrentAction(eventSettings, parentIdx, idx);
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  let [triggerCompDynamic, setTriggerCompDynamic] = useState({});

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

  const changeRefComp = (value) => {
    updateEventSettings();
    item.actionSettings.compKey = value;
    item.actionSettings.dataParams = [];
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
      item.actionSettings.dataParams = [];
      executeCommand('InteractionCommand', comp, eventSettings);
    }
    refresh();
  };

  const showEditorParams = () => {
    if (!item.actionSettings.compKey) {
      return message.warning('请先选择触发对象');
    }
    const v = getComponent(item.actionSettings.compKey);
    if (v.classType === 'antd' && v.dataset?.dynamic) {
      const { category } = v.dataset;
      triggerCompDynamic = v.dataset?.[category];
    } else if (v.classType === 'com' && (v.instance?.config?.dynamic || v.preAttr?._config?.dynamic)) {
      // 跨页面选择 datai 组件，可能没有 instance
      const config = v.instance?.config || v.preAttr?._config;
      triggerCompDynamic = config[config._source];
    } else if (v.classType === 'customComp' && v.dataset?.dynamic) {
      const { category } = v.dataset;
      triggerCompDynamic = v.dataset?.[category];
    }
    if (!triggerCompDynamic) {
      return message.warning('触发对象使用的不是动态或指标数据，请先更改数据源!');
    }
    if (triggerCompDynamic.source && !triggerCompDynamic.source.id) {
      return message.warning('触发对象动态数据还没绑定接口，请先绑定');
    }
    setTriggerCompDynamic({ ...triggerCompDynamic });

    setVisible(true);
  };

  const saveParams = (arr) => {
    updateEventSettings();
    item.actionSettings.dataParams = arr;
    executeCommand('InteractionCommand', comp, eventSettings);
    setVisible(false);
  };

  return (
    <div className={styles.refreshDataSourceContainer}>
      {/* 选择页面 */}
      {bigScreenType === 'page' && (
        <SelectPage appPageId={item.actionSettings.appPageId} handlePageTreeChange={handlePageTreeChange} />
      )}
      <Row>
        <Col className={styles.label} span={7}>
          触发对象
        </Col>
        <Col span={17}>
          <CompTree
            type='refreshDataSource' // 不能选择图层
            appPageId={item.actionSettings.appPageId}
            relation={item.actionSettings.compKey}
            onTreeChange={changeRefComp}
          />
        </Col>
      </Row>
      <Row className={styles.dataSourceValueRow}>
        <Col className={styles.label} span={7}>
          接口参数
        </Col>
        <Col span={17}>
          <Button
            className={classNames(
              styles.editorParamsBtn,
              styles.conditionBtn,
              item?.actionSettings?.dataParams?.length > 0 && styles.success,
            )}
            type='primary'
            onClick={showEditorParams}
          >
            编辑参数
            {item?.actionSettings?.dataParams?.length > 0 && (
              <img className={styles.successIcon} src={successIcon} alt='条件' />
            )}
          </Button>
        </Col>
      </Row>
      {/* 编辑参数弹框 */}
      {visible && (
        <ModalEditorParams
          visible={visible}
          comp={comp} // 当前绑定交互的组件
          triggerCompDynamic={triggerCompDynamic} // 触发对象组件的 dynamic
          action={item}
          compKey={item.actionSettings.compKey}
          eventSetting={eventSettings[parentIdx]}
          onOk={(arr) => {
            saveParams(arr);
          }}
          onCancel={() => {
            setVisible(false);
          }}
        />
      )}
    </div>
  );
};

export default RefreshDataSource;
