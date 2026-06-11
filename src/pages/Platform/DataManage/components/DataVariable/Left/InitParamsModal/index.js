import { message, Modal } from 'antd';
import React, { useState } from 'react';
import Edit from '@/components/commons/Edit';

const InitParamsModal = ({ visible, onCancel }) => {
  const [value, setValue] = useState(window.screenConfig.initParams || {});
  const valueChangeHandler = (codeValue) => {
    setValue(codeValue);
  };

  const okHandler = () => {
    try {
      window.screenConfig.initParams = JSON.parse(value);
      onCancel();
    } catch (e) {
      message.error('initParams必须为对象格式，请检查代码！');
    }
  };

  return (
    <Modal getContainer={false} open={visible} title={'临时设值初始化参数'} onOk={okHandler} onCancel={onCancel}>
      <Edit code={JSON.stringify(value, null, '\t')} changeValue={valueChangeHandler} />
    </Modal>
  );
};

export default InitParamsModal;
