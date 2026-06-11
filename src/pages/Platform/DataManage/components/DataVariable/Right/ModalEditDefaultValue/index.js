import React, { useState } from 'react';
import { Modal, Button } from 'antd';
import Edit from '@/components/commons/Edit';
import { CloseCircleOutlined } from '@ant-design/icons';
import { initDataByDefault } from '@/utils/dataStoreUtils';
import { useStore } from '@/hooks';
import styles from './index.less';

const EditDefaultValue = (props) => {
  let { visiable, onCancel, resetVariableValueHandler, setIsDataStoreModify } = props;
  let store = useStore();
  const [errorString, setErrorStr] = useState('');
  const [value, setValue] = useState(visiable.defaultValueCode);

  const valueChangeHandler = (codeValue) => {
    setValue(codeValue);
  };

  const okHandler = () => {
    // let result;
    let errorStr;
    try {
      visiable.defaultValueCode = value;
      errorStr = initDataByDefault(visiable);
      if (errorStr) {
        setErrorStr(errorStr);
        throw `变量 ${visiable.key}：` + errorStr;
      } else {
        setStoreData(visiable.key, visiable.defaultValue, visiable);
        store.globalStore.updateDataStore(); // 更新全局存储的变量数据
        store.editorStore.forceUpdateAttr(); // 更新配置栏
        store.editorStore.forceUpdateLayout(); // 更新画布中组件
        setIsDataStoreModify(true);
      }
    } catch (e) {
      throw `变量 ${visiable.key}：` + e;
    }
    onCancel();
  };

  const reset = () => {
    setValue(`//请将返回值以retun方式返回
return ""`);
    resetVariableValueHandler?.(visiable);
    setIsDataStoreModify(true);
  };

  return (
    <Modal getContainer={false} title='设置默认值' open={true} onOk={okHandler} onCancel={onCancel} keyboard={false}>
      <div className='margin-bottom-16'>
        <div>1. 默认全局变量：$（jQuery）, moment , _ （lodasdh）</div>
        <div>2. 可以通过window.initParams 获取sdk传递进来的数据或参数信息</div>
      </div>
      <Edit code={value} changeValue={valueChangeHandler} />
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
      <Button className={styles.btnReset} type={'primary'} onClick={reset}>
        重置
      </Button>
    </Modal>
  );
};

export default EditDefaultValue;
