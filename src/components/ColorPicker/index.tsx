import React, { useState, useEffect } from 'react';
import { Input, Tooltip } from 'antd';
import { SketchPicker } from 'react-color';
import { observer } from 'mobx-react';
import _ from 'lodash';
import 'Components/ColorPicker/index.less';

interface IProps {
  value: string;
  style?: any;
  hideInput?: any;
  getPopupContainer?: () => any;
  trigger?: any;
  onChange: (val: string) => void;
}

const ColorPicker = (props: IProps) => {
  const {
    style,
    hideInput,
    getPopupContainer = () => document.body,
    trigger = 'hover',
    onChange,
    value: propsValue,
  } = props;

  const [value, setValue] = useState(propsValue);

  /**
   * props的value值发生改变
   */
  useEffect(() => {
    if (onChange && propsValue !== value) {
      setValue(propsValue);
    }
  }, [onChange, propsValue, value]);
  /**
   * 颜色板SketchPicker选中值改变
   * @param value 颜色
   */
  const handleColorChange = (evt) => {
    const { r, g, b, a } = evt.rgb;
    const val = `rgba(${r},${g},${b},${a})`;
    if (_.isFunction(onChange)) {
      onChange(val);
    } else {
      setValue(val);
    }
  };
  /**
   * 输入框颜色发生改变
   * @param evt 事件
   */
  const handleChange = (evt) => {
    const val = evt.target.value;
    if (_.isFunction(onChange)) {
      onChange(val);
    } else {
      setValue(val);
    }
  };
  // console.log(props, propsValue, value, '--------------==');
  return (
    <Tooltip
      trigger={trigger}
      getPopupContainer={getPopupContainer}
      placement='left'
      color='#fff'
      title={<SketchPicker color={value} className='pickColor' onChange={handleColorChange} />}
    >
      <div className='colorPicker' style={style}>
        <div className='color-preview'>
          <div style={{ background: value }} />
        </div>
        {!hideInput && <Input value={value} onChange={handleChange} />}
      </div>
    </Tooltip>
  );
};
ColorPicker.defaultProps = {
  getPopupContainer: () => document.body,
  trigger: 'hover',
  hideInput: false,
  style: {},
};
export default observer(ColorPicker);
