import React, { useState, useEffect } from 'react';

function CollectValue(props) {
  const { onChange, format = (v) => v, id, value, valuePropName = 'value' } = props;

  const [v, setV] = useState(() => {
    if (value && value.replace && value.indexOf('px') > -1) {
      return value.replace(/px/g, '');
    }
    return value;
  });
  useEffect(() => {
    //bug 初始值发生变化时未更新
    setV(value);
  }, [value]);
  const change = (e) => {
    let v = e;
    if (e && e.nativeEvent instanceof Event) {
      if (e.target.type !== 'checkbox') {
        v = e.target.value;
      } else {
        v = e.target.checked;
      }
    }
    setV(v);
    v = format(v);
    onChange(id, v);
  };
  return React.cloneElement(props.children, {
    onChange: (e) => {
      e && e.persist && e.persist();
      change(e);
    },
    defaultValue: value,
    [valuePropName]: typeof v === 'string' && v.endsWith('px') ? parseInt(v) : v,
  });
}

export default CollectValue;
