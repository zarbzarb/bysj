import React, { useEffect, useState, Fragment } from 'react';
import { Tooltip, Modal, Row, Col } from 'antd';
import ExpressionEdit from '@/components/commons/ExpressionEdit';
import { QuestionCircleOutlined } from '@ant-design/icons';
import PreviewVariable from '@/components/DataHandler/PreviewVariable';
import styles from './index.less';

const Variable = (props) => {
  const { visible, param, onOk, onCancel } = props;
  const { variableKey, expression = 'data' } = param;
  const [variables, setVariables] = useState();
  const [expressions, setExpressions] = useState(expression);

  const okHandler = () => {
    param.expression = expressions;
    onOk();
  };

  return (
    <Modal
      className={styles.modalDataSwitch}
      getContainer={false}
      keyboard={false}
      // title={titleNode}
      width={500}
      height={500}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button type='primary' onClick={okHandler} key={0}>
          确定
        </Button>,
      ]}
    >
      {/* name == 'renderLayerData' ? variablesText.renderText : variablesText.comText */}
      <Row className={styles.field} align='middle'>
        <Col className={styles.fieldLabel}>
          <span className='margin-right-8'>变量表达式</span>
          <Tooltip
            placement='top'
            color='#454141'
            getPopupContainer={() => document.body}
            overlayStyle={{ zIndex: 2001 }}
            title='变量表达式是对引用的变量进行加工处理，处理后的数据直接被组件引用。例:(1)data.value;(2)data[0].data.value;(3)[ {"id": 123,"text": data.value} ]'
          >
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
              if (expressions.includes('return')) {
                expr = expressions.replace('return ', '');
              }
              param.expression = value;
              setExpressions(expr);
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
            variable={variableKey}
            expression={expressions}
          />
        </Col>
      </Row>
      {/* <DataManage type={'1'} /> */}
    </Modal>
  );
};

export default Variable;
