import React from 'react';
import { Row, Col, TreeSelect, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import styles from '../../selectDataToForm.less';

const { TreeNode } = TreeSelect;
const renderNode = (children = []) => {
  return children.map((variableGroup, idx) => {
    return (
      <TreeNode disabled value={variableGroup.key} title={variableGroup.name} key={idx}>
        {variableGroup.children &&
          variableGroup.children.map((variable, index) => {
            return <TreeNode value={variable.key} title={variable.name} key={index} />;
          })}
      </TreeNode>
    );
  });
};

const index = ({ comp, idx, refresh, agIdx }) => {
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
          数据存储到
          {/* v8.5.0 添加提示 */}
          <Tooltip title='不用必须配置'>
            <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
        <Col flex='206px' className={styles.fieldInput} style={{ marginBottom: 12 }}>
          <TreeSelect
            suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
            value={currentGroup.variable}
            showSearch
            allowClear={true}
            placeholder='请选择'
            treeNodeFilterProp='title'
            onChange={(value) => {
              updateEventSettings();
              currentGroup.variable = value;
              if (value === undefined) {
                value = '';
              }
              window.executeCommand('InteractionCommand', comp, eventSettings);
              refresh();
            }}
            showCheckedStrategy='TreeSelect.SHOW_ALL'
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
