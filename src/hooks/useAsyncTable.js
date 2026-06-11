import { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';

const initParams = {};

function useAsycnTable(options) {
  const [data, setData] = useState({
    dataSource: [],
    loading: false,
    total: 0,
  });
  const [page, setPage] = useState({
    current: 1,
    pageSize: 10, // 每页默认显示10条
  });
  const formatResultRef = useRef(null);
  const getDataFun = useRef(null);
  const isRequestRef = useRef(true);
  const {
    getListPromise,
    formatResult = (data) => (Array.isArray(data) ? data : Array.isArray(data.records) ? data.records : []),
    params = initParams,
    isPagination = true,
    isRequest = true,
  } = options;

  formatResultRef.current = formatResult;
  getDataFun.current = getListPromise;
  isRequestRef.current = isRequest;
  const getData = useCallback(() => {
    if (!isRequestRef.current) return;
    setData((s) => ({
      ...s,
      loading: true,
    }));
    let p = params;
    if (isPagination) {
      p = {
        ...params,
        pageSize: page.pageSize,
        pageNum: page.current,
      };
    }
    getDataFun
      .current(p)
      .then(({ success, message: msg, data }) => {
        if (!success) {
          return msg;
        }
        const d = formatResultRef.current(data);
        setData((s) => ({
          ...s,
          dataSource: d,
          total: data.totalCount,
        }));
      })
      .finally(() => {
        setData((s) => ({
          ...s,
          loading: false,
        }));
      });
  }, [params, page, isPagination]);

  useEffect(() => {
    getData();
  }, [getData]);
  const onChange = (page) => {
    setPage((p) => ({
      ...p,
      current: page,
    }));
  };
  const onShowSizeChange = (current, size) => {
    setPage((p) => ({
      pageSize: size,
      current,
    }));
  };
  return {
    tableProps: {
      dataSource: data.dataSource,
      loading: data.loading,
    },
    paginationProps: {
      current: page.current, // 当前页数
      pageSize: page.pageSize, // 每页条数
      total: data.total, // 数据总数
      onChange: onChange, // 页码或 pageSize 改变的回调，参数是改变后的页码及每页条数
      onShowSizeChange: onShowSizeChange, // pageSize 变化的回调
    },
    getData,
  };
}

export default useAsycnTable;
