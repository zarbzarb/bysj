import React from 'react';
import { Row, Col, TreeSelect, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import styles from './index.less';

const { TreeNode } = TreeSelect;
const renderNode = (children = []) => {
  return children.map((variableGroup, idx) => {
    return (
      <TreeNode disabled value={variableGroup.key} key={idx} title={variableGroup.name}>
        {variableGroup.children &&
          variableGroup.children.map((variable, index) => {
            return <TreeNode value={variable.key} title={variable.name} key={index} />;
          })}
      </TreeNode>
    );
  });
};

const index = ({ idx, refresh, comp, agIdx }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = eventSettings[idx];
  let currentGroup = item.groups[agIdx];
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
  return (
    <div className={styles.demo}>
      <Row className={styles.field}>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>数据存储到</span>
          <Tooltip title='存的数据格式示例：{pageNo:1,pageSize:10}'>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
        <Col flex='206px' className={styles.fieldInput}>
          <TreeSelect
            suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
            value={currentGroup.variable}
            allowClear={true}
            placeholder='请选择'
            onChange={(value) => {
              updateEventSettings();
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
