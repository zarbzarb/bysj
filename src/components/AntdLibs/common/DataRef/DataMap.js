import React, { Fragment, useState } from 'react';
import { Input, Line } from '@yl/datai-ui';
import { cloneDeep } from 'lodash';

const DataMap = (props) => {
  let { el, forceUpdateLayout } = props;
  let dataset = cloneDeep(el.dataset);
  console.log(props);

  const changeValue = (value, field, parent, idx) => {
    let _map = dataset.dataMap;
    _map[idx][field] = value;
    el.dataset.dataMap = _map;

    forceUpdateLayout();
  };
  return (
    <div className='yl-comp-config antd-dark ' style={{ paddingBottom: 0 }}>
      <div className='yl-comp-text-field row '>
        <div className='yl-comp-field-label'>数据接口</div>
        <div className='yl-comp-field-label right'>配置完成</div>
      </div>
      <div className='yl-comp-text-field row paddingLeft8'>
        <div className='col-8'>字段</div>
        <div className='col-6'>映射</div>
        <div className='col-10 paddingLeft16'>状态</div>
      </div>
      {dataset.dataMap.map((item, key) => {
        return (
          <div key={key} className='yl-comp-text-field row paddingLeft8'>
            <div className='col-8' style={{ lineHeight: '24px' }}>
              {item.field}
            </div>
            <div className='col-6'>
              <Input
                onChange={changeValue}
                data-index={key}
                data-parent-field='dataMap'
                data-field='mapField'
                value={item.mapField}
              />
            </div>
            <div className='col-10 paddingLeft16'>{item.state ? '可选' : '禁用'}</div>
          </div>
        );
      })}
      <Line className='marginBottom8 marginTop4' />
    </div>
  );
};

export default DataMap;
