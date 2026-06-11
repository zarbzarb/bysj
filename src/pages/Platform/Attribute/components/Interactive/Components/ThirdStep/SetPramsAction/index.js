import React, { useState } from 'react';
import { Row, Col, Button, message } from 'antd';
import _ from 'lodash';
import { useStore } from '@/hooks';
import successIcon from '@/assets/icon/success.png';
import classNames from 'classnames';
import { getCurrentAction, setCurrentAction } from '@/pages/Platform/Attribute/components/Interactive/utils';
import CompTreeSelect from '@/components/CompTreeSelect';
import mappers from '@/components/PramsSelect/mappers';
import DataICompKit from '@/utils/dataiUtils';
import styles from './index.less';
import ModalEditorParams from './ModalEditorParams';
import SelectPage from '../components/SelectPage';

const getComponent = window.DataI.getComponentByKey;
// 兼容旧屏
const compatible = (item, selectedKey) => {
  if (item.actionSettings.appPageId === undefined) {
    item.actionSettings.appPageId = selectedKey;
  }
};

const CONTAINER_COMP = new Set(['dataq-com-group-basic', 'CustomList', 'CustomCell']);

const ACCEPT_COMP_TYPE = new Set([...Object.keys(mappers), ...CONTAINER_COMP]);

const UpdateData = ({ comp, parentIdx, idx }) => {
  const {
    pageTabsStore,
    pageTreeStore: { pageInfoMap },
    globalStore: { bigScreenType },
  } = useStore();

  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [triggerCompStatic, setTriggerCompStatic] = useState({});

  // V8.4.0 雅洁配置的屏，有一个更新数据字段丢失，正常不会这样，目前没法排查原因，先这样处理不报错
  const action = getCurrentAction(comp.eventSetings, parentIdx, idx);
  if (!action.actionSettings) {
    return <></>;
  }

  compatible(action, pageTabsStore.selectedKey); // 兼容旧屏

  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = getCurrentAction(eventSettings, parentIdx, idx);

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
      item.actionSettings.dataParams = [];
      window.executeCommand('InteractionCommand', comp, eventSettings);
    }
    refresh();
  };

  const showEditorParams = () => {
    if (!item?.actionSettings?.compKey) {
      return message.warning('请先选择触发对象');
    }

    const v = getComponent(item.actionSettings.compKey);
    triggerCompStatic.classType = v.classType;

    // TODO 列表柱状图弹窗展示格式不对，因为目前没有_api，等肖硕那边后续补充完整再自测一下
    if (v.classType === 'com') {
      // _seriesType: 1 静态， 2 动态
      const { _seriesType = 2, _api, _dataMap, dynamic } = DataICompKit.getConfig(v) ?? {};
      triggerCompStatic.data = _seriesType === 2 ? _api : _dataMap;
      triggerCompStatic._seriesType = _seriesType;
      if (v.englishName === 'ChartNestRing') {
        // 嵌套环形图
        triggerCompStatic.data = dynamic.dataMap;
      }
    } else if (v.type === 'LayerLegend') {
      // 图层图例
      const { dataMap } = v.props.dataSourceSet?.dynamic;
      triggerCompStatic.data = dataMap;
    } else if (v.type === 'Calendar') {
      // 日历卡片
      const keys = Object.keys(v.dataset.defaultValue[0]);
      triggerCompStatic.data = keys.map((key) => ({
        name: key,
        field: key,
        mapField: key,
      }));
    } else if (v.classType === 'antd') {
      const dataMap = v.dataset.dynamic?.dataMap;
      const { _api } = v.dataset;
      triggerCompStatic.data = _api || dataMap;
    } else if (v.classType === 'customComp') {
      // 静态数据映射
      const { _api } = v.dataset;
      triggerCompStatic.data = _api;
    }

    setTriggerCompStatic({ ...triggerCompStatic });
    setVisible(true);
  };

  const saveParams = (arr) => {
    console.log(arr, 'arr');
    updateEventSettings();
    item.actionSettings.dataParams = arr;
    window.executeCommand('InteractionCommand', comp, eventSettings);
    setVisible(false);
  };

  return (
    <div className={styles.updateDataContainer}>
      {/* 选择页面 */}
      {bigScreenType === 'page' && (
        <SelectPage appPageId={item.actionSettings.appPageId} handlePageTreeChange={handlePageTreeChange} />
      )}
      <Row>
        <Col className={styles.label} span={7}>
          触发对象
        </Col>
        <Col span={17}>
          <CompTreeSelect
            treeSelectProps={{ style: { width: '100%' } }}
            appPageId={item.actionSettings.appPageId}
            selected={item.actionSettings.compKey}
            onChange={changeRefComp}
            compsFilter={({ type }) => ACCEPT_COMP_TYPE.has(type?.replace('@yl/', ''))}
            compsMap={({ type }) => (CONTAINER_COMP.has(type?.replace('@yl/', '')) ? { selectable: false } : {})}
          />
        </Col>
      </Row>
      <Row className={styles.dataSourceValueRow}>
        <Col className={styles.label} span={7}>
          参数
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
          // customComps={customComps}
          visible={visible}
          comp={comp} // 当前绑定交互的组件
          triggerCompStatic={triggerCompStatic} // 触发对象组件的 静态数据
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

export default UpdateData;
