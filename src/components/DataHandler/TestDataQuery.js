import React, { useState } from 'react';
import { Tooltip, Button } from 'antd';
import { executeAjax } from '@/TriggerAction/DataQueray';
import LargeEdit from '@/components/commons/LargeEdit';
import styles from './index.less';
import { babelTransform2 } from '@/utils/utils';

// const FormItem = Form.Item;

const TestDataQuery = ({ item, refFormFilter }) => {
  const [status, setStatus] = useState(0);
  const [testResult, setTestResult] = useState();

  const filterFn = (result) => {
    let values = refFormFilter.getFieldsValue();
    const str = values.code || `return data.${values.path}`; // 添加配置编译
    result = babelTransform2(str, result); // 运行时ES6转ES5
    return result;
  };

  const testAjaxHandler = () => {
    setStatus(1);
    setTestResult(undefined);
    try {
      const dataQuery = item.current.actionSettings;
      executeAjax(dataQuery, window.screenConfig, (result) => {
        setStatus(2);
        if (refFormFilter) {
          result = filterFn(result);
        }
        setTestResult(result);
      });
    } catch (e) {}
  };

  return (
    <div className='dataTest'>
      <Button type='primary' ghost onClick={testAjaxHandler} style={{ marginRight: '12px' }}>
        测试接口返回值
      </Button>
      {status == 1 && <span>编译中</span>}
      {status == 2 && testResult && (
        <Tooltip
          autoAdjustOverflow={true}
          destroyTooltipOnHide={true}
          overlayClassName={styles.dataShowTooltip}
          placement='topLeft'
          getPopupContainer={() => document.querySelector('.dataTest')}
          title={
            <div style={{ width: '240px' }}>
              <LargeEdit language={'json'} value={testResult} />
            </div>
          }
        >
          <span>查看结果</span>
        </Tooltip>
      )}

      {status == 2 && testResult == undefined && <span>编译失败</span>}
    </div>
  );
};

export default TestDataQuery;
