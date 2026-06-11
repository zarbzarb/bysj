import React from 'react';
import { FileTextOutlined } from '@ant-design/icons';
// import $ from 'jquery';
// const { RangeInput } = window.dataqUi;
import { RangeInput } from '@yl/datai-ui';

export default (props: any) => {
  const { filter, updateScreenConfig } = props;
  return (
    <div className='yl-comp-config filterConfig'>
      <div className='yl-comp-text-field'>
        <div className='yl-comp-field-label'>色相</div>
        <div className='yl-comp-field-content'>
          <RangeInput
            max={360}
            unit={1}
            suffix='度'
            data-field='hueRotate'
            data-parent-field='filter'
            onChange={updateScreenConfig}
            value={filter.hueRotate}
          />
          <span>色相：[0,360]</span>
        </div>
      </div>
      <div className='yl-comp-text-field'>
        <div className='yl-comp-field-label'>饱和度</div>
        <div className='yl-comp-field-content'>
          <RangeInput
            max={200}
            unit={1}
            suffix='%'
            data-field='saturation'
            data-parent-field='filter'
            onChange={updateScreenConfig}
            value={filter.saturation}
          />
          <span>饱和度：[0,200]</span>
        </div>
      </div>
      <div className='yl-comp-text-field'>
        <div className='yl-comp-field-label'>亮度</div>
        <div className='yl-comp-field-content'>
          <RangeInput
            max={200}
            unit={1}
            suffix='%'
            data-field='brightness'
            data-parent-field='filter'
            onChange={updateScreenConfig}
            value={filter.brightness}
          />
          <span>亮度：[0,200]</span>
        </div>
      </div>
      <div className='yl-comp-text-field'>
        <div className='yl-comp-field-label'>对比度</div>
        <div className='yl-comp-field-content'>
          <RangeInput
            max={200}
            unit={1}
            suffix='%'
            data-field='contrastRatio'
            data-parent-field='filter'
            onChange={updateScreenConfig}
            value={filter.contrastRatio}
          />
          <span>对比度：[0,200]</span>
        </div>
      </div>
      <div className='yl-comp-text-field'>
        <div className='yl-comp-field-label'>不透明度</div>
        <div className='yl-comp-field-content'>
          <RangeInput
            max={100}
            unit={1}
            suffix='%'
            data-field='opacity'
            data-parent-field='filter'
            onChange={updateScreenConfig}
            value={filter.opacity}
          />
          <span>不透明度：[0,100]</span>
        </div>
      </div>
      <div className='footer'>
        <div>
          <FileTextOutlined />
          帮助文档
        </div>
        <div onClick={() => props.setFilterClick(false)}>关闭</div>
        {/* <div>更新滤镜配置</div> */}
      </div>
    </div>
  );
};
