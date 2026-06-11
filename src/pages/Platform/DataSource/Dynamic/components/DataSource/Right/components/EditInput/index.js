import React, { useEffect, useState } from 'react';
import s from './index.less';
import classnames from 'classnames';
import { Input, message } from 'antd';

function EditInput(props) {
  const [isEdit, setEdit] = useState(false);
  const [v, setV] = useState('');
  const { value, onBlur, onChange = () => {}, name = '默认值', verify = true } = props;
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
    onChange(v);
    setEdit(false);
    onBlur && typeof onBlur == 'function' && onBlur();
  };
  return (
    <div
      onClick={onToggleEdit}
      className={classnames(s.wrap, {
        [s['not-edit']]: !isEdit,
      })}
    >
      {isEdit ? (
        <Input
          placeholder='请输入默认值'
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
