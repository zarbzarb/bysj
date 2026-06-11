import React, { Fragment } from 'react';
import { Tooltip } from 'antd';
import ReactJson from 'react-json-view';
import '../../index.less';

const CurrentTimeData = ({ data }) => {
  const isJson = typeof data === 'object';
  return (
    <>
      {!isJson && <div className='log_dataShow'>{data}</div>}
      {isJson && <ReactJson name={false} displayDataTypes={false} src={data} theme='monokai' />}
    </>
  );
};
const Log = ({ log, idx }) => {
  const { time, action, el, result, resultType, settings } = log;

  return (
    <div className='infoLine' key={`${time}_${idx}`}>
      <div className='log_time'>
        <span className='log_nub'>{idx + 1}</span>
        {time}
      </div>

      <div className='log_rightInfo'>
        <span className='log_action'>{action}</span>

        <span className='log_el'>
          <Tooltip
            trigger='click'
            mouseLeaveDelay={2}
            getPopupContainer={() => document.body}
            destroyTooltipOnHide={true}
            overlayClassName='log_cardStyle'
            placement='topLeft'
            title={<CurrentTimeData data={`组件key：${el.key}`} />}
          >
            {el?.name}
          </Tooltip>
        </span>

        <span className='log_variable'>
          <Tooltip
            trigger='click'
            mouseLeaveDelay={2}
            getPopupContainer={() => document.body}
            destroyTooltipOnHide={true}
            overlayClassName='log_cardStyle'
            placement='topLeft'
            title={<CurrentTimeData data={settings} />}
          >
            配置信息
          </Tooltip>
        </span>
        <span className={` ${resultType}`}>{result}</span>
      </div>
    </div>
  );
};

export default Log;
