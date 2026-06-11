import React from 'react';
import { Modal, Select } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

function SelectInfo(props) {
  // otherProps: {placeholder onBlur style}
  // data = relatedApiList
  // value 选中接口值
  // idName value值路径
  const { onChange, value = {}, data, idName, isRemovedApi, children, ...otherProps } = props;
  const vId = value[idName];
  const handleChange = (v) => {
    //转换成对应对象
    const vInfo = data.find((item) => item[idName] === v);
    onChange && onChange(vInfo);
  };
  const _onChange = (v) => {
    if (Object.keys(value).length !== 0) {
      return Modal.confirm({
        getContainer: () => document.querySelector('#app'), // 弹框挂在到当前应用
        icon: <ExclamationCircleOutlined />,
        content: <span style={{ color: '#fff' }}>修改接口后已编辑的参数信息会丢失，是否修改？</span>,
        onOk() {
          handleChange(v);
        },
      });
    }
    handleChange(v);
  };
  return (
    // value 指定当前选中的条目，多选时为一个数组。（value 数组引用未变化时，Select 不会更新）
    // onChange 选中 option，或 input 的 value 变化时，调用此函数
    // autoFocus 默认获取焦点
    // otherProps 其他参数
    // children Option节点
    <Select value={isRemovedApi ? '接口已被删除,请选择其他接口' : vId} onChange={_onChange} autoFocus {...otherProps}>
      {children}
    </Select>
  );
}

SelectInfo.Option = Option;

export default SelectInfo;
