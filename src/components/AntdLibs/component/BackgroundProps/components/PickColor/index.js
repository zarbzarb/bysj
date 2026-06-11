import React, { useState, useCallback } from 'react';
import { Tooltip, Input } from 'antd';
import HandlePickColor from '../HandlePickColor';
import s from './index.less';
// v7.6 颜色选择支持拷贝
function PickColor(props) {
  const { value, onChange, disabled = false } = props;
  const [color, setColor] = useState(() => {
    const { isGradient, gradient, color } = value;
    if (isGradient) {
      return gradient;
    }
    return color;
  });
  const _onChange = useCallback(
    (v) => {
      if (v.isGradient) {
        setColor(v.gradient);
      } else {
        setColor(v.color);
      }
      onChange(v);
    },
    [onChange],
  );
  //v7.6.0 支持拷贝
  const handleChange = useCallback(
    (evt) => {
      let colorString = evt.target.value;
      // console.log('colorString', colorString);
      let v = {
        ...value,
      };
      if (colorString && colorString.includes('linear-gradient')) {
        v.isGradient = true;
        v.gradient = colorString;
        setColor(colorString);
      } else {
        v.isGradient = false;
        v.color = colorString;
        setColor(colorString);
      }
      onChange(v);
    },
    [onChange],
  );
  // v7.6.0 渐变色支持拷贝
  const { style, hideInput, trigger = 'hover', getPopupContainer = () => document.body } = props;
  return (
    <Tooltip
      trigger={trigger}
      getPopupContainer={getPopupContainer}
      placement='left'
      overlayClassName={s.tooltipContent}
      destroyTooltipOnHide={true}
      title={<HandlePickColor disabled={disabled} onChange={_onChange} gradientColor={value} />}
      color='#fff'
    >
      <div className='colorPicker' style={style}>
        <div className='color-preview'>
          <div style={{ background: color }}></div>
        </div>
        {!hideInput && <Input value={color} onChange={handleChange} />}
      </div>
      {/* <Input readOnly placeholder="请选择颜色" value={color} /> */}
    </Tooltip>
  );
}

export default PickColor;
