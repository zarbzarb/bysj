import React from 'react';
import { Row, Col, TreeSelect } from 'antd';
import { isAction } from 'mobx';
import _ from 'lodash';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import styles from './index.less';

const { TreeNode } = TreeSelect;
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

const renderNodeCum = (children = []) => {
  return children.map((variableGroup, idx) => {
    return (
      <TreeNode disabled value={variableGroup.key} title={variableGroup.title}>
        {variableGroup.actionStyles &&
          variableGroup.actionStyles.map((variable, index) => {
            return <TreeNode value={variable.key} title={variable.title} />;
          })}
      </TreeNode>
    );
  });
};

const index = ({ idx, refresh, comp, agIdx }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = eventSettings[idx];
  let currentGroup = item.groups[agIdx];
  const { columns } = comp.props;

  const updateEventSettings = () => {
    try {
      comp.eventSetings[idx] = { ...comp.eventSetings[idx], ..._.pick(item, ['groups']) };
      eventSettings = _.cloneDeep(comp.eventSetings);
      item = eventSettings[idx];
      currentGroup = eventSettings[idx].groups[agIdx];
    } catch (error) {
      console.error(error);
    }
  };

  const actions = columns.filter((item) => item.isAction && item.actionStyles.length > 0);
  return (
    <div className={styles.demo}>
      <Row className={styles.field}>
        <Col flex='auto' className={styles.fieldLabel}>
          选中操作项
        </Col>
        <Col flex='206px' className={styles.fieldInput}>
          <TreeSelect
            suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
            style={{ width: '190px' }}
            value={currentGroup.actionKey}
            allowClear={true}
            placeholder='请选择'
            onChange={(value) => {
              updateEventSettings();
              currentGroup.actionKey = value;
              if (value == undefined) {
                value = '';
              }
              executeCommand('InteractionCommand', comp, eventSettings);
              refresh();
            }}
            showCheckedStrategy='TreeSelect.SHOW_ALL'
            className='yl-comp-field-content row'
          >
            {renderNodeCum(actions)}
          </TreeSelect>
        </Col>

        <Col flex='auto' className={styles.fieldLabel}>
          数据存储到
        </Col>
        <Col flex='206px' className={styles.fieldInput}>
          <TreeSelect
            suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
            value={currentGroup.variable}
            allowClear={true}
            placeholder='请选择'
            onChange={(value) => {
              currentGroup.variable = value;
              if (value == undefined) {
                value = '';
              }
              executeCommand('InteractionCommand', comp, eventSettings);
              refresh();
            }}
            showCheckedStrategy='TreeSelect.SHOW_PARENT'
            showArrow={true}
            treeDefaultExpandAll={true}
            showSearch
            treeNodeFilterProp='title'
            className='yl-comp-field-content row'
          >
            {renderNode(window.dataStore)}
          </TreeSelect>
        </Col>
      </Row>
    </div>
  );
};

export default index;
