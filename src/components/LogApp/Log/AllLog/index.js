import React, { memo, Fragment } from 'react';
import FormatLog from './FormatLog';
import VariableLog from './VariableLog';
import DataQueryLog from './DataQueryLog';
import '../index.less';

const AllLog = memo(
  ({ logList }) => {
    return (
      <div>
        {logList.map((log, key) => {
          const { actionType } = log;

          return (
            <>
              {actionType === 'format' || actionType === 'antd' ? <FormatLog key={key} idx={key} log={log} /> : <></>}

              {actionType === 'variable' ? <VariableLog key={key} idx={key} log={log} /> : <></>}

              {actionType === 'dataQuery' ? <DataQueryLog key={key} idx={key} log={log} /> : <></>}
            </>
          );
        })}
      </div>
    );
  },
  (pre, next) => {
    return pre.len === next.len;
  },
);

export default AllLog;
