import React, { useEffect, useState } from 'react';
import { Row, Col, Select } from 'antd';
import _ from 'lodash';
import { useStore } from '@/hooks';
import styles from '../UpdateData/index.less';
import CompTree from './CompTree';
import SelectPage from '../components/SelectPage';
import { getActionOptions } from './utils';
import { getCurrentAction, setCurrentAction } from '../../../utils';

const getComponent = window.DataI.getComponentByKey;
// 兼容旧屏
const compatible = (item, selectedKey) => {
  if (item?.actionSettings?.appPageId === undefined) {
    item.actionSettings.appPageId = selectedKey;
  }
};

const ComspecialAction = ({ comp, parentIdx, idx }) => {
  const {
    pageTabsStore,
    pageTreeStore: { pageInfoMap },
    globalStore: { bigScreenType },
  } = useStore();

  compatible(getCurrentAction(comp.eventSetings, parentIdx, idx), pageTabsStore.selectedKey); // 兼容旧屏

  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = getCurrentAction(eventSettings, parentIdx, idx);

  /**
   * 当触发组件的数据源不再是静态的，或者被删除，应该将选中的当前触发对象置空
   * LayerLegend：图层图例
   * Calendar：日历卡片
   */

  if (item?.actionSettings?.compKey) {
    const v = getComponent(item.actionSettings.compKey);
    if (!v && pageInfoMap[item.actionSettings.appPageId]) {
      item.actionSettings.compKey = '';
    }
  }

  const [count, setCount] = useState(0);
  const [options, setOptions] = useState(() => {
    return getActionOptions(item?.actionSettings?.compKey);
  });

  useEffect(() => {
    if (options.length === 0) {
      // 保证“操作页面”不是主页时，“动作列表”也能正常获取
      setOptions(getActionOptions(item?.actionSettings?.compKey));
    }
  }, [count]);

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
    item.actionSettings.actionParam = '';
    window.executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
    setOptions(getActionOptions(value));
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
      item.actionSettings.actionParam = '';
      window.executeCommand('InteractionCommand', comp, eventSettings);
    }
    refresh();
  };

  const handleChange = (val) => {
    updateEventSettings();
    item.actionSettings.actionParam = val;
    window.executeCommand('InteractionCommand', comp, eventSettings);
    refresh(); // 这个方法很关键，页面某个值为空时，可以刷新
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
          <CompTree
            type='comspecialAction'
            appPageId={item.actionSettings.appPageId}
            relation={item.actionSettings.compKey}
            onTreeChange={changeRefComp}
          />
        </Col>
      </Row>
      <Row className={styles.dataSourceValueRow}>
        <Col className={styles.label} span={7}>
          触发动作
        </Col>
        <Col span={17}>
          <Select
            defaultValue={item.actionSettings.actionParam}
            value={item.actionSettings.actionParam}
            style={{ width: 200 }}
            disabled={!item.actionSettings.compKey}
            onChange={handleChange}
            options={options}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ComspecialAction;
