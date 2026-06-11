import React, { useCallback, useMemo } from 'react';
import { Table } from 'antd';

function FetchTable(props) {
  const {
    className,
    columns,
    rowKey,
    tableProps,
    paginationProps,
    // isPagination
  } = props;
  const { dataSource, ...otherTableProps } = tableProps;
  const recursiveData = useCallback((data) => {
    const result = data.map((item) => {
      if (item.children) {
        if (item.children.length === 0) {
          delete item.children;
        } else {
          item.children = recursiveData(item.children);
        }
      }
      return item;
    });
    return result;
  }, []);
  // 去掉空的children
  const _dataSource = useMemo(() => {
    let d = JSON.parse(JSON.stringify(dataSource));
    d = recursiveData(d);
    return d;
  }, [dataSource, recursiveData]);
  return (
    <div className={className}>
      <Table
        rowKey={rowKey}
        bordered
        pagination={paginationProps}
        columns={columns}
        {...otherTableProps}
        dataSource={_dataSource}
        tableLayout='fixed'
      />
    </div>
  );
}

export default FetchTable;
