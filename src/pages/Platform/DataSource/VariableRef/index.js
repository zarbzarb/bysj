import React, { Fragment } from 'react';
import { Tooltip, Row, Col, TreeSelect } from 'antd';
import ExpressionEdit from '@/components/commons/ExpressionEdit';
import { QuestionCircleOutlined } from '@ant-design/icons';
import PreviewVariable from '@/components/DataHandler/PreviewVariable';
import add from '@/assets/newIcon/add.png';
// import { toggleDataVisible } from '@/pages/Platform/DataManage';
import { useStore } from '@/hooks';

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
  const { config, styles, changeValue } = props;

  const {
    controlStore: { toggleDataVisible },
  } = useStore();

  return (
    <>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          请选择变量
        </Col>
        <Col
          flex='206px'
          style={{ display: 'flex', alignItems: 'center' }}
          className={`${styles.fieldInput} ${styles.antdFieldInput}`}
        >
          <TreeSelect
            showSearch
            defaultValue={config._variable}
            placeholder='请选择变量'
            treeNodeFilterProp='title'
            onChange={(evt) => {
              changeValue(evt, '_variable');
            }}
            getPopupContainer={(e) => e.parentNode}
            showCheckedStrategy='TreeSelect.SHOW_ALL'
            className='yl-comp-field-content row'
          >
            {renderNode(window.dataStore)}
          </TreeSelect>
          <a
            style={{ marginLeft: '5px' }}
            onClick={(value) => {
              toggleDataVisible();
            }}
          >
            <img src={add} alt='' />
          </a>
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>变量表达式</span>
          <Tooltip
            placement='left'
            title='变量表达式是对引用的变量进行加工处理，处理后的数据直接被组件引用。例:(1)data.value(2)data[0].data.value(3)[ {"id": 123,"text": data.value} ]'
          >
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <ExpressionEdit
            value={config._expression || 'data'}
            codeType='javascript'
            onChange={(evt) => {
              let expression = evt;
              if (expression.includes('return')) {
                expression = expression.replace('return ', '');
              }

              changeValue(expression, '_expression');
            }}
          />
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <PreviewVariable
            label='测试'
            title='预览值'
            styles={styles}
            variable={config._variable}
            expression={config._expression || 'data'}
          />
        </Col>
      </Row>
    </>
  );
};

export default Variable;
