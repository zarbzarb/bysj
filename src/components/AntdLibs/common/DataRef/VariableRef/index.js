import React, { useState, Fragment, useEffect } from 'react';
import { Tooltip, Row, Col, TreeSelect } from 'antd';
import ExpressionEdit from '@/components/commons/ExpressionEdit';
import { QuestionCircleOutlined } from '@ant-design/icons';
import add from '@/assets/newIcon/add.png';
import PreviewVariable from '@/components/DataHandler/PreviewVariable';
import { useStore } from '@/hooks';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
// import { toggleDataVisible } from '@/pages/Platform/DataManage';

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
  const { el, styles, updateField, dataset } = props;
  const { variable, refDataType, expression, defaultValue, varTipMsg = '' } = dataset || el.dataset;
  const [count, setCount] = useState(0);

  const {
    controlStore: { toggleDataVisible },
  } = useStore();

  useEffect(() => {
    setCount(count + 1);
    return () => {};
  }, [variable]);
  return (
    <>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          请选择变量
          {varTipMsg && (
            <Tooltip title={varTipMsg}>
              <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
            </Tooltip>
          )}
        </Col>
        <Col
          flex='206px'
          style={{ display: 'flex', alignItems: 'center' }}
          className={`${styles.fieldInput} ${styles.antdFieldInput}`}
        >
          <TreeSelect
            suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
            value={variable}
            showSearch
            treeNodeFilterProp='title'
            defaultValue={variable}
            placeholder='请选择变量'
            onChange={(evt) => {
              updateField('variable', evt);
            }}
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
            <img src={add} />
          </a>
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>变量表达式</span>
          <Tooltip title='变量表达式是对引用的变量进行加工处理，处理后的数据直接被组件引用。例:(1)data.value(2)data[0].data.value(3)[ {"id": 123,"text": data.value} ]'>
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

              if (expr.includes('return')) expr = expr.replace('return ', '');

              updateField('expression', expr);
            }}
          />
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <PreviewVariable label='测试' title='预览值' styles={styles} variable={variable} expression={expression} />
        </Col>
      </Row>
    </>
  );
};

export default Variable;
