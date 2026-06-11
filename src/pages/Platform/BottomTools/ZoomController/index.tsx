import React from 'react';
import { Tooltip, ConfigProvider, theme } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { RangeInput } from '@yl/datai-ui';

function ZoomController(props: { changeZoom: (arg0: number) => void; zoom: number }) {
  const resetZoom = () => {
    props.changeZoom(100);
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: { colorPrimary: '#007693' },
      }}
      componentSize='small'
    >
      <div className='row floatRight screen-zoom-container yl-comp-config'>
        <label>
          缩放
          <Tooltip title='重置100%'>
            <QuestionCircleOutlined onClick={resetZoom} />
          </Tooltip>
        </label>

        <RangeInput
          style={{ display: 'flex' }}
          suffix='%'
          min={18}
          max={175}
          data-field='slide'
          value={Math.round(props.zoom)}
          onChange={(value) => {
            props.changeZoom(+value);
          }}
        />
      </div>
    </ConfigProvider>
  );
}

export default ZoomController;
