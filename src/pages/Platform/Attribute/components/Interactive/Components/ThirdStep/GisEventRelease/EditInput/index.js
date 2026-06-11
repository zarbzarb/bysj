import React, { useEffect, useState } from 'react';
import s from './index.less';
import classnames from 'classnames';
import { Input, message } from 'antd';

function EditInput(props) {
  const [isEdit, setEdit] = useState(false);
  const [v, setV] = useState('');
  const { value, onBlur, onChange = () => {}, name = '接口别名', verify = true } = props;
  const onToggleEdit = () => {
    if (!isEdit) {
      setEdit(true);
    }
  };
  useEffect(() => {
    setV(value);
  }, [value, onChange]);
  const onChangeV = (e) => {
    const { value } = e.target;
    setV(value);
  };
  const onSave = () => {
    if (verify && (!v || !v.trim())) {
      return message.warning(`请输入${name}`);
    }
    // console.log(v, '------------------');
    onChange(v);
    setEdit(false);
    onBlur && typeof onBlur == 'function' && onBlur();
  };
  // console.log(v, value, '00000000000');
  return (
    <div
      onClick={onToggleEdit}
      className={classnames(s.wrap, {
        [s['not-edit']]: !isEdit,
      })}
    >
      {isEdit ? (
        <Input
          placeholder='请输入别名，回车保存'
          onBlur={onSave}
          value={v}
          onChange={onChangeV}
          autoFocus
          onPressEnter={onSave}
        />
      ) : (
        <span title={value}>{value}</span>
      )}
    </div>
  );
}

export default EditInput;
