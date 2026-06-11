import React, { useState } from 'react';
import { InputNumber, Select } from 'antd';
import ColorPicker from '@/components/ColorPicker';
import RenderForm from '../RenderForm';
import PickColor from '../BackgroundProps/components/PickColor';
import { fontWeightList } from '@/staticJson/AnimationComponentsList';

const { Option } = Select;
export const initialFontProps = (font = { color: '#fff' }) => {
  const { color } = font;
  return {
    fontSize: '14px',
    color,
    fontFamily: 'Microsoft Yahei',
    fontWeight: 'inherit',
    fontStyle: 'normal',
  };
};

function FontProps(props) {
  const { extendColor = false, initValue, tableType } = props;
  const fontInitData = {
    fontSize: '14px',
    color: extendColor
      ? {
          isGradient: false,
          color: '#FF3CAC',
          gradient: 'linear-gradient(225deg, #FF3CAC 0%, #784BA0 50%, #2B86C5 100%)',
        }
      : '#fff',
    fontFamily: 'Microsoft Yahei',
    fontWeight: 'normal',
    fontStyle: 'normal',
  };

  const [initValues, setInitValues] = useState(initValue || fontInitData);
  // v7.6.0 FontProps 颜色支持拷贝
  let formData = [
    {
      label: '字体颜色',
      id: 'color',
      Com: extendColor ? <PickColor /> : <ColorPicker />,
    },
    {
      label: '字体大小',
      id: 'fontSize',
      suffix: 'px',
      format: (v) => v + 'px',
      Com: (
        <InputNumber
          style={{ width: '100%' }}
          formatter={(value) => `${String(value).replace(/\D+/g, '')}px`}
          // parser={(value) => value.replace('px', '')}
          min={12}
        />
      ),
    },
    {
      label: '字体',
      id: 'fontFamily',
      Com: (
        <Select style={{ width: '100%' }}>
          {window.fontFamilyList.map(({ label, value }) => (
            <Option key={value} value={value}>
              {label}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      label: '字体粗细',
      id: 'fontWeight',
      Com: (
        <Select style={{ width: '100%' }}>
          {fontWeightList.map(({ label, value }) => (
            <Option key={value} value={value}>
              {label}
            </Option>
          ))}
        </Select>
      ),
    },
    // {
    //   label: '斜体',
    //   id: 'fontStyle',
    //   Com: (
    //     <Select style={{ width: '100%' }}>
    //       {window.fontStyleList.map(({ label, value }) => (
    //         <Option key={value} value={value}>
    //           {label}
    //         </Option>
    //       ))}
    //     </Select>
    //   )
    // }
  ];
  //兼容table弹框下拉框无法点开
  if (tableType == 'table') {
    formData = formData.splice(0, formData.length - 2);
  }
  if (tableType == 'map3D') {
    formData = formData.splice(0, formData.length - 1);
  }
  return <RenderForm {...props} initValues={initValues} formData={formData} />;
}

export default FontProps;
