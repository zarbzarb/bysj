import React, { useEffect, useState, Fragment } from 'react';
import { Tooltip, Row, Col, TreeSelect } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import add from '@/assets/newIcon/add.png';
import styles from '../index.less';
// import DataManage, { toggleDataVisible } from '@/pages/Platform/DataManage';
// import { getDataByKey } from '@/utils/dataStoreUtils';
import { variablesText } from '@/staticJson/MapBasic';
import { useStore } from '@/hooks';

const { TreeNode } = TreeSelect;
const renderNode = (children = []) => {
  return children.map((variableGroup, idx) => {
    return (
      <TreeNode key={variableGroup.key} disabled value={variableGroup.key} title={variableGroup.name}>
        {variableGroup.children &&
          variableGroup.children.map((variable, index) => {
            return <TreeNode key={variable.key} value={variable.key} title={variable.name}></TreeNode>;
          })}
      </TreeNode>
    );
  });
};
const VariableMonitor = (props) => {
  let { variable, name, updateField } = props;
  const {
    controlStore: { toggleDataVisible },
  } = useStore();

  return (
    <Fragment>
      <Row className={styles.field + ' ' + styles.treeStyles} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          {/* 请选择变量 */}
          <span className='margin-right-8'>设置清除变量</span>
          <Tooltip title={variablesText[name] || '格式：0表示清除，例："0"'}>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
        <Col flex='186px' style={{ display: 'flex' }} className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <TreeSelect
            showSearch
            defaultValue={variable}
            placeholder='请选择变量'
            treeNodeFilterProp='title'
            onChange={(evt) => {
              switch (name) {
                case name:
                  updateField(name, evt);
                  break;
                default:
                  updateField('variable', evt);
                  break;
              }
            }}
            showCheckedStrategy='TreeSelect.SHOW_ALL'
            className='yl-comp-field-content row'
          >
            {renderNode(window.dataStore)}
          </TreeSelect>
          <a
            style={{ margin: '3px 0 0 5px' }}
            onClick={(value) => {
              toggleDataVisible();
            }}
          >
            <img src={add} />
          </a>
        </Col>
      </Row>
      {/* <DataManage type={'1'} /> */}
    </Fragment>
  );
};

export default VariableMonitor;
