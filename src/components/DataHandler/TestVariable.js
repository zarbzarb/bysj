import React, { useState } from 'react';
import { Tooltip, Button } from 'antd';
import { getDataByKey } from '@/utils/dataStoreUtils';
import LargeEdit from '@/components/commons/LargeEdit';
import styles from './index.less';
import { babelTransform } from '@/utils/utils';

const TestVariable = ({ variable, expression, title, label = '测试' }) => {
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
    } catch (e) {
      data = JSON.stringify(e);
    }
    if (data == undefined) {
      setUndefinedState(true);
    } else {
      setUndefinedState(false);
    }
    setTestResult(data);
  };

  return (
    <div className='yl-comp-text-field variableTest'>
      <div className='yl-comp-field-label'>{title}</div>
      <div className='yl-comp-field-content'>
        <Button onClick={testHandler}>{label}</Button>
        {undefinedState && <span>无返回结果</span>}
        {testResult && (
          <Tooltip
            autoAdjustOverflow={true}
            destroyTooltipOnHide={true}
            overlayClassName={styles.dataShowTooltip}
            placement='topLeft'
            getPopupContainer={() => document.querySelector('.variableTest')}
            title={
              <div style={{ width: '240px' }}>
                <LargeEdit value={testResult} readOnly={true} />
              </div>
            }
          >
            <Button>查看返回值</Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default TestVariable;
