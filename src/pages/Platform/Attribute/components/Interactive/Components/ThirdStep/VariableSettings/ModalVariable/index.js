import React, { useState } from 'react';
import { Modal } from 'antd';
import Edit from '@/components/commons/Edit';
import styles from './index.less';
import { CloseCircleOutlined } from '@ant-design/icons';
// import { initDataByDefault } from '@/utils/dataStoreUtils';

const EditDefaultValue = (props) => {
  let { visiable, code, onOk, onCancel } = props;
  const [errorString, setErrorStr] = useState('');
  const [value, setValue] = useState(code);

  const valueChangeHandler = (codeValue) => {
    setValue(codeValue);
  };

  const okHandler = () => {
    // let result;
    // let errorStr;
    try {
      onOk(value);
    } catch (e) {
      console.error(e);
    }
    onCancel();
  };

  return (
    <Modal getContainer={false} title='设置变量值' open={visiable} onOk={okHandler} onCancel={onCancel}>
      <div className='margin-bottom-16'>
        <div>1.默认全局变量：$（jQuery）, moment , _ （lodasdh），以return方式返回结果</div>
        <div>2.当前修改的变量原值以data的参数形式传递进来</div>
        <div>3.触发条件的值将以expressionValue传递进来（不一定都有）</div>
      </div>
      <Edit code={code} changeValue={valueChangeHandler} />
      {errorString && (
        <div className={styles.errorText}>
          <CloseCircleOutlined
            className={styles.closeBtn}
            onClick={() => {
              setErrorStr();
            }}
          />
          {errorString}
        </div>
      )}
    </Modal>
  );
};

export default EditDefaultValue;
