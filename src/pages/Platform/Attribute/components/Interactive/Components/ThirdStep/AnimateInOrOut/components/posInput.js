import React, { Component } from 'react';
import { InputNumber } from 'antd';

export default class PosInput extends Component {
  handleXChange = (x) => {
    this.triggerChange({ x });
  };

  handleYChange = (y) => {
    this.triggerChange({ y });
  };

  triggerChange = (changedValue) => {
    const { onChange, value } = this.props;
    if (onChange) {
      onChange({
        ...value,
        ...changedValue,
      });
    }
  };

  render() {
    const { value, posAlign } = this.props;
    return (
      <span>
        {posAlign == 'bottom' || posAlign == 'center' ? null : (
          <>
            <label style={{ color: '#fff', marginLeft: '10px' }}>x:</label>
            <InputNumber
              value={value && value.x ? value.x : 0}
              onChange={this.handleXChange}
              style={{ width: 'calc( 50% - 30px )', margin: '0 10px 0 5px' }}
            />
          </>
        )}
        <label style={{ color: '#fff' }}>y:</label>
        <InputNumber
          value={value && value.y ? value.y : 0}
          onChange={this.handleYChange}
          style={{
            width: posAlign == 'bottom' || posAlign == 'center' ? 'calc( 100% - 18px )' : 'calc( 50% - 27px )',
            marginLeft: '5px',
          }}
        />
      </span>
    );
  }
}
