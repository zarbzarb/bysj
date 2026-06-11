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
  const { time } = log;
  const { action, actionType, el, result, resultType, type, variable, variableName, settings } = log.info;
  let apiName;
  let paramList;
  let dataMapList;
  let realParams;
  let response;
  // 完善apiInfo字段判断
  if (settings) {
    apiName = settings.apiInfo?.interfaceName;
    paramList = settings.paramList;
    dataMapList = settings.dataMapList;
    realParams = settings.realParams;
    response = settings.response;
  }

  return (
    <div className='infoLine' key={`${time}_${idx}`}>
      <div className='log_time'>
        <span className='log_nub'> {idx + 1}</span>
        {time}
      </div>

      <div className='log_rightInfo'>
        <span className='log_action'>{action}</span>
        {/** 接口名称（中文的名称） */}
        <span className='log_el'>
          <Tooltip
            trigger='click'
            mouseLeaveDelay={2}
            getPopupContainer={() => document.body}
            destroyTooltipOnHide={true}
            overlayClassName='log_cardStyle'
            placement='topLeft'
            title={<CurrentTimeData data={paramList} />}
          >
            {apiName}
          </Tooltip>
        </span>

        <span className='log_el'>
          <Tooltip
            trigger='click'
            mouseLeaveDelay={2}
            getPopupContainer={() => document.body}
            destroyTooltipOnHide={true}
            overlayClassName='log_cardStyle'
            placement='topLeft'
            title={el?.key ? <CurrentTimeData data={`组件key：${el.key}`} /> : '无法获取组件名称'}
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
            title={<CurrentTimeData data={log && log.data} />}
          >
            {variableName}
          </Tooltip>
        </span>
        <span className={` ${resultType}`}>{result}</span>

        {realParams && (
          <span className='log_el'>
            <Tooltip
              trigger='click'
              mouseLeaveDelay={2}
              getPopupContainer={() => document.body}
              destroyTooltipOnHide={true}
              overlayClassName='log_cardStyle'
              placement='topLeft'
              title={<CurrentTimeData data={realParams} />}
            >
              参数
            </Tooltip>
          </span>
        )}

        {response && (
          <span className='log_el'>
            <Tooltip
              trigger='click'
              mouseLeaveDelay={2}
              getPopupContainer={() => document.body}
              destroyTooltipOnHide={true}
              overlayClassName='log_cardStyle'
              placement='topLeft'
              title={<CurrentTimeData data={response} />}
            >
              返回值
            </Tooltip>
          </span>
        )}

        {apiName && !response && !realParams && (
          <span className='log_el' style={{ marginLeft: '6px' }}>
            <Tooltip
              trigger='click'
              mouseLeaveDelay={2}
              getPopupContainer={() => document.body}
              destroyTooltipOnHide={true}
              overlayClassName='log_cardStyle'
              placement='topLeft'
              title={<CurrentTimeData data={dataMapList} />}
            >
              数据映射（{dataMapList?.length}）
            </Tooltip>
          </span>
        )}
      </div>
    </div>
  );
};

export default Log;
