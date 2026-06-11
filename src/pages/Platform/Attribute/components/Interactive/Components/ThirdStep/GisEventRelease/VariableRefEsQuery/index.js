import React, { useEffect, useState, Fragment } from 'react';
import { Tooltip, Row, Col, TreeSelect, Button } from 'antd';
import ExpressionEdit from '@/components/commons/ExpressionEdit';
import { QuestionCircleOutlined } from '@ant-design/icons';
import add from '@/assets/newIcon/add.png';
import PreviewVariable from '@/components/DataHandler/PreviewVariable';
import { useStore } from '@/hooks';
import styles from '../index.less';
// import DataManage, { toggleDataVisible } from '@/pages/Platform/DataManage';

const { TreeNode } = TreeSelect;
const renderNode = (children = []) => {
  return children.map((variableGroup, idx) => {
    return (
      <TreeNode key={variableGroup.key} disabled value={variableGroup.key} title={variableGroup.name}>
        {variableGroup.children &&
          variableGroup.children.map((variable, index) => {
            return <TreeNode key={variable.key} value={variable.key} title={variable.name} />;
          })}
      </TreeNode>
    );
  });
};
const Variable = (props) => {
  const {
    label = '',
    variable,
    updateField,
    tipMsg,
    // filter,
    // layerCode,
    // isType,
    previewResult,
    name,
    expression,
  } = props;
  const [visible, setVisible] = useState(false);
  const {
    controlStore: { toggleDataVisible },
  } = useStore();

  const onClose = () => {
    setVisible(false);
  };

  const tooltipMsg =
    tipMsg ||
    '变量表达式是对引用的变量进行加工处理，处理后的数据直接被组件引用。例:(1)data.value(2)data[0].data.value(3)[ {"id": 123,"text": data.value} ]';
  return (
    <>
      <Row className={`${styles.field} ${styles.treeStyles}`} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          {label}
        </Col>
        <Col flex='206px' style={{ display: 'flex' }} className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <TreeSelect
            showSearch
            defaultValue={variable}
            placeholder='请选择变量'
            treeNodeFilterProp='title'
            onChange={(evt) => {
              updateField(name, evt);
            }}
            showCheckedStrategy='TreeSelect.SHOW_ALL'
            className='yl-comp-field-content row'
          >
            {renderNode(window.dataStore)}
          </TreeSelect>
          <a
            style={{ marginLeft: '5px', marginTop: '5px' }}
            onClick={(value) => {
              toggleDataVisible();
            }}
          >
            <img src={add} />
          </a>
        </Col>
      </Row>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>变量表达式</span>
          <Tooltip title={tooltipMsg}>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <ExpressionEdit
            value={expression}
            codeType='javascript'
            onChange={(value) => {
              let expr = value.trim();
              if (expr.includes('return')) {
                expr = expr.replace('return ', '');
              }
              updateField(`${name}Exp`, expr);
            }}
          />
        </Col>
      </Row>
      {previewResult && (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
            <PreviewVariable label='测试' title='预览值' styles={styles} variable={variable} expression={expression} />
          </Col>
        </Row>
      )}
      {/* <DataManage type={'1'} /> */}
    </>
  );
};

export default Variable;
