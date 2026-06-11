import React, { Fragment } from 'react';
import { Tooltip, Row, Col, TreeSelect } from 'antd';
import ExpressionEdit from '@/components/commons/ExpressionEdit';
import { QuestionCircleOutlined } from '@ant-design/icons';
import PreviewVariable from '@/components/DataHandler/PreviewVariable';
import add from '@/assets/newIcon/add.png';
import { inject, observer } from 'mobx-react';
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

let Variables = (props) => {
  let { config, styles, changeValue, variableTip } = props;
  const {
    controlStore: { toggleDataVisible, dataVisible },
  } = useStore();

  return (
    // <Fragment>
    <Fragment>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='marginLeft4 marginRight4'>请选择变量</span>
          {variableTip && (
            <Tooltip title={variableTip}>
              <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
            </Tooltip>
          )}
        </Col>
        <Col
          flex='206px'
          style={{ display: 'flex', alignItems: 'center' }}
          className={styles.fieldInput + ' ' + styles.antdFieldInput}
        >
          <TreeSelect
            style={{ width: '100%' }}
            showSearch
            defaultValue={config['_variable']}
            placeholder='请选择变量'
            treeNodeFilterProp='title'
            onChange={(evt) => {
              changeValue(evt, '_variable');
            }}
            getPopupContainer={(e) => e.parentNode}
            showCheckedStrategy='TreeSelect.SHOW_ALL'
            // className='yl-comp-field-content row'
          >
            {renderNode(window.dataStore)}
          </TreeSelect>
          <a
            style={{ margin: '5px 0 0 5px' }}
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
          <span className='marginLeft4 marginRight4'>变量表达式</span>
          <Tooltip title='变量表达式是对引用的变量进行加工处理，处理后的数据直接被组件引用。例:(1)data.value(2)data[0].data.value(3)[ {"id": 123,"text": data.value} ]'>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <ExpressionEdit
            value={config['_expression'] || 'data'}
            codeType='javascript'
            container={() => document.querySelector('#app')}
            onChange={(evt) => {
              let expression = evt;
              if (expression.indexOf('return') >= 0) {
                expression = expression.replace('return ', '');
              }
              // updateField('expression', expression);
              // console.log(expression);
              changeValue(expression, '_expression');
            }}
          />
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput} style={{ paddingLeft: '8px' }}>
          <PreviewVariable
            label='测试'
            title='预览值'
            styles={styles}
            variable={config['_variable']}
            expression={config['_expression'] || 'data'}
          />
        </Col>
      </Row>
    </Fragment>
  );
};
export default Variables;
