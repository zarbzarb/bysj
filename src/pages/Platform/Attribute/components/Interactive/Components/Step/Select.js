import React from 'react';
import { Select } from 'antd';
const { Option } = Select;
export default (props) => {
  let { data, value, handleChange, defaultOpen, placeholder } = props;
  return (
    <Select value={value} onChange={handleChange} className='select' placeholder={placeholder}>
      {data.map((item, index) => {
        return (
          <Option key={index} value={item.value}>
            {item.name}
          </Option>
        );
      })}
    </Select>
  );
};
