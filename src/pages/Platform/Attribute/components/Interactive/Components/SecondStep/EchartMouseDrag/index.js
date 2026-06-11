import React, { Fragment, useMemo } from 'react';
import { Input, Row, Col, Tooltip, Select, TreeSelect, Radio } from 'antd';
// import StoreTree from '@/components/StoreTree';
import { QuestionCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import styles from './index.less';

const { Option } = Select;
const { TreeNode } = TreeSelect;

const renderNode = (children = []) => {
  return children.map((variableGroup, idx) => {
    return (
      <TreeNode disabled={variableGroup.children} value={variableGroup.key} title={variableGroup.name}>
        {variableGroup.children &&
          variableGroup.children.map((variable, index) => {
            return <TreeNode value={variable.key} title={variable.name} />;
          })}
      </TreeNode>
    );
  });
};

const Index = ({ idx, refresh, comp }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = eventSettings[idx];
  // type 预留用于后期的组件本身引用复值
  const { expression = 'data', variable = '', strategy = 'all' } = item;

  const updateEventSettings = () => {
    try {
      comp.eventSetings[idx] = { ...comp.eventSetings[idx], ..._.omit(item, ['actions']) };
      eventSettings = _.cloneDeep(comp.eventSetings);
      item = eventSettings[idx];
    } catch (error) {
      console.error(error);
    }
  };

  const setExpression = (evt) => {
    updateEventSettings();
    item.expression = evt.target.value;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const changeSelectValue = (value) => {
    updateEventSettings();
    // 选中值存到变量字段统一
    item.variable = value;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const msgTip = {
    val: '拖动之后的数据，其中dataIndex表示拖动变化的x轴，seriesY表示Y轴数据，例如:{"dataIndex": 2,"seriesY":[1,2,3]}；',
    exp: '对当前拖动的值进行监听，并满足条件执行，表达式默认依赖变量值data，例：data.age>18',
  };
  return (
    <>
      <div className={styles.listenContainer}>
        {/* tab切换组值改变交互配置选择框 */}
        <Row className={styles.listenValueRow}>
          <Col className={styles.label} span={9}>
            拖动数据存到
            <Tooltip title={msgTip.val}>
              <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
            </Tooltip>
          </Col>
          <Col span={15}>
            <TreeSelect
              suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
              allowClear
              placeholder='请选择'
              showSearch
              treeNodeFilterProp='title'
              showCheckedStrategy='TreeSelect.SHOW_ALL'
              className='yl-comp-field-content row'
              onChange={changeSelectValue}
              value={variable}
            >
              {renderNode(window.dataStore)}
            </TreeSelect>
          </Col>
        </Row>
        <Row className={styles.listenValueRow}>
          <Col className={styles.label} span={9}>
            拖动表达式
            <Tooltip title={msgTip.exp}>
              <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
            </Tooltip>
          </Col>
          <Col span={15}>
            <Input defaultValue={expression} onBlur={setExpression} />
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Index;
