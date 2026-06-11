/*
 * @Author: lvbowen
 * @Date: 2022-04-01 10:46:19
 * @LastEditors: lvbowen
 * @LastEditTime: 2022-06-14 16:16:47
 * @Description:
 */
import React, { useState } from 'react';
import { Row, Col, Button, Tooltip } from 'antd';
import { getDataByKey } from '@/utils/dataStoreUtils';
import LargeEdit from '@/components/commons/LargeEdit';
import { babelTransform } from '@/utils/utils';
import PreviewVariableStyles from './index.less';

const TestVariable = ({
  popupContainer = (triggerNode) => document.querySelector('.com-layer-attr') || triggerNode.parentNode,
  styles,
  variable,
  expression,
  // title,
  label = '测试',
}) => {
  // const [status, setStatus] = useState(0);
  const [testResult, setTestResult] = useState();
  const [undefinedState, setUndefinedState] = useState(false);

  const testHandler = () => {
    let data;
    try {
      data = getDataByKey(variable); // 根据key获取全局变量的值
      // if (expression.indexOf('return') < 0) {
      //   expression = `return ${expression}`;
      // }
      data = babelTransform(expression, data); // 运行时ES6转ES5
    } catch (error) {
      data = JSON.stringify(error);
    }
    if (data == undefined) {
      setUndefinedState(true);
    } else {
      setUndefinedState(false);
    }
    setTestResult(data);
  };

  return (
    <Row className={`${styles.field} variableTest antd-dark`} align='middle'>
      <Col flex='auto' className={styles.fieldLabel}>
        预览结果
      </Col>
      <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput} ${PreviewVariableStyles.buttonBox}`}>
        <Button className={`margin-right-12 ${PreviewVariableStyles.divButton}`} onClick={testHandler}>
          {label}
        </Button>
        {undefinedState && <span>无返回结果</span>}
        {(testResult || testResult === '') && (
          <Tooltip
            autoAdjustOverflow={true}
            destroyTooltipOnHide={true}
            overlayClassName={styles.dataShowTooltip}
            placement='topLeft'
            // getPopupContainer={(triggerNode) => triggerNode.parentNode}
            getPopupContainer={popupContainer}
            title={
              <div style={{ width: '240px' }}>
                <LargeEdit value={testResult} readOnly={true} />
              </div>
            }
          >
            <Button className={PreviewVariableStyles.divButton}>查看返回值</Button>
          </Tooltip>
        )}
      </Col>
    </Row>
  );
};

export default TestVariable;
