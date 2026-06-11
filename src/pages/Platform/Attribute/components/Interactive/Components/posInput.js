import React, { memo } from 'react';
import { InputNumber } from 'antd';

export default memo((props) => {
  const { onChange, value, posAlign } = props;
  const triggerChange = (changedValue) => {
    if (onChange) {
      onChange({
        ...value,
        ...changedValue,
      });
    }
  };
  const handleXChange = (x) => {
    triggerChange({ x });
  };
  const handleYChange = (y) => {
    triggerChange({ y });
  };
  return (
    <span>
      {posAlign == 'bottom' || posAlign == 'center' ? null : (
        <React.Fragment>
          <label style={{ color: '#fff', marginLeft: '10px' }}>x:</label>
          <InputNumber
            placeholder={'请输入'}
            value={value && value.x ? value.x : 0}
            onChange={handleXChange}
            style={{ width: 'calc( 50% - 30px )', margin: '0 10px 0 5px' }}
          />
        </React.Fragment>
      )}
      <label style={{ color: '#fff' }}>y:</label>
      <InputNumber
        placeholder={'请输入'}
        value={value && value.y ? value.y : 0}
        onChange={handleYChange}
        style={{
          width: posAlign == 'bottom' || posAlign == 'center' ? 'calc( 100% - 18px )' : 'calc( 50% - 27px )',
          marginLeft: '5px',
        }}
      />
    </span>
  );
});
