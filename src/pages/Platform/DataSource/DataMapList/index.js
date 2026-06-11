import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Table, Modal, Checkbox, Pagination, ConfigProvider, theme } from 'antd';
import { Resizable } from 'react-resizable';
import classnames from 'classnames';
import CompatibleTool from '../Compatible';
import { getDataFields } from '../utils';
import styles from './index.less';

// 调整table表头
const ResizeableTitle = (props) => {
  const { onResize, width, ...restProps } = props;
  // console.log('ResizeableTitle props', props);
  if (!width) {
    return <th {...restProps} />;
  }
  return (
    <Resizable
      className={styles.resizableWrap}
      width={width}
      height={0}
      // axis="x"
      // resizeHandles={['w']} // 拖拽左侧
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

const maxTableWidth = 1150;

/**
 * 数据映射选择弹窗
 */
const DataMapList = (props) => {
  const {
    visible, // 是否可见
    dataset, // 数据
    checkedField = {}, // 选中列、行
    disabledRowSelection = false, // 是否禁止选择行
    onlyFirstRowFields = true, // 是否只取第一行数据的字段，否则取所有数据行的不重复字段
    onConfirm, // 点击确定回调函数
    onClose, // 点击关闭回调函数
  } = props;

  // console.log({ checkedField });
  const [checkedColField, setCheckedColField] = useState(checkedField.col); // 已经选中的列 单选
  const [selectedRowKeys, setSelectedRowKeys] = useState(
    CompatibleTool.filterCheckFieldRows(checkedField.row, dataset),
  ); // 已经选中行 多选
  const [cols, setCols] = useState([]); // 列数据
  const [columns, setColumns] = useState([]); // Table columns 属性
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 每行数据增加key
  const dataSource = useMemo(() => {
    return dataset.map((val, idx) => {
      return {
        _key_: idx,
        ...val,
      };
    });
  }, [dataset]);

  // 分页数据源
  const dataSourcePage = useMemo(() => {
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return dataSource.slice(startIndex, endIndex);
  }, [dataSource, pageNum, pageSize]);

  const onChangePage = (_pageNum, _pageSize) => {
    setPageNum(_pageNum);
    setPageSize(_pageSize);
  };

  // // 添加防抖动
  // const warningShow = _.debounce(() => {
  //   message.warning('达到列表最大宽度！');
  // }, 500);
  // 处理拖拽
  const handleResize = useCallback(
    (index) =>
      (e, { size }) => {
        const nextColumns = [...cols];
        // 拖拽是调整宽度
        nextColumns[index] = {
          ...nextColumns[index],
          width: size.width,
        };
        const totalWidth = nextColumns.reduce((pre, cru) => {
          return pre + cru.width || 0;
        }, 0);
        // 超过最大宽度，重新设置；
        if (totalWidth > maxTableWidth) {
          // warningShow();
          let curWidth = size.width - (totalWidth - maxTableWidth);
          curWidth = curWidth > 0 ? curWidth : nextColumns[index].width;
          nextColumns[index] = {
            ...nextColumns[index],
            width: curWidth,
          };
        }
        setCols(nextColumns);
      },
    [cols],
  );

  const cellHeader = useCallback(
    (field) => {
      return (
        <Checkbox
          checked={checkedColField === field}
          onChange={(evt) => {
            // console.log(
            //   'evt.target.checked',
            //   evt.target.checked,
            //   'field',
            //   field
            // );
            // 点击列字段默认选中所有行数据
            if (evt.target.checked) {
              setCheckedColField(field);
              if (
                // 已有选择项，则不会全选
                !(Array.isArray(selectedRowKeys) && selectedRowKeys.length > 0)
              ) {
                setSelectedRowKeys(dataset.map((v, idx) => idx));
              }
            } else {
              setCheckedColField('');
              setSelectedRowKeys([]);
            }
          }}
        >
          {field}
        </Checkbox>
      );
    },
    [checkedColField, dataset, selectedRowKeys],
  );

  // 保存
  const onSave = () => {
    // console.log({ selectedRowKeys }, { checkedColField }, { checkedField });
    if (typeof onConfirm === 'function') {
      onConfirm({
        col: checkedColField,
        row: CompatibleTool.filterCheckFieldRows(selectedRowKeys, dataset),
      });
    }
  };

  // 取消
  const onCancel = () => {
    setCheckedColField(checkedField.col);
    setSelectedRowKeys(CompatibleTool.filterCheckFieldRows(checkedField.row, dataset));
    onClose && onClose();
  };

  // const paginationChange = (page, pageSize) => {};

  useEffect(() => {
    setCheckedColField(checkedField.col);
    return () => {};
  }, [checkedField.col, checkedField.dataMapKey]); // fix:bug KQ-4008 增加checkedField.dataMapKey依赖的目的是当两个映射选择的是相同的字段时，修改了其中一个映射，不会影响另一个映射的界面展示

  // 当 dataset 改变，重新 setSelectedRowKeys
  useEffect(() => {
    const rows = CompatibleTool.filterCheckFieldRows(checkedField.row, dataset);
    setSelectedRowKeys(rows);
    return () => {};
  }, [checkedField.row, dataset]);

  // 当 dataset 改变，重新 setCols
  useEffect(() => {
    const fields = getDataFields(dataset, onlyFirstRowFields) || []; // 接口返回映射字段
    setCols(
      fields.map((field) => {
        return {
          dataIndex: field,
          key: field,
          ellipsis: true,
          width: fields.length < 10 ? undefined : 100,
        };
      }),
    );
  }, [dataset, onlyFirstRowFields]);

  // 当 cols 改变，重新 setColumns
  useEffect(() => {
    setColumns(
      (cols || []).map((col, index) => ({
        ...col,
        title: () => {
          return cellHeader(col.key);
        },
        onHeaderCell: (column) => ({
          width: column.width,
          onResize: handleResize(index),
        }),
        render: (text) => {
          // 解决布尔值没有渲染问题
          return typeof text === 'boolean' ? `${text}` : text;
        },
      })),
    );
  }, [cellHeader, cols, handleResize]);
  // console.log('cols', cols);
  // console.log('columns', columns);

  const rowSelection = {
    type: 'checkbox',
    hideSelectAll: true,
    columnWidth: 40,
    fixed: true,
    onChange: (selectedKeys, selectedRows) => {
      console.log(`selectedRowKeys: ${selectedKeys}`, selectedRows);
      const currentPageRowKeys = new Set(dataSourcePage.map((row) => row._key_));
      const otherPageSelectedRowKeys = selectedRowKeys.filter((key) => !currentPageRowKeys.has(key));
      setSelectedRowKeys([...selectedKeys, ...otherPageSelectedRowKeys]);
    },
    getCheckboxProps: () => ({
      disabled: disabledRowSelection,
    }),
    selectedRowKeys,
  };

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: '#007693' } }}>
      <Modal
        className={classnames('antd-dark', 'settings-modal')}
        open={visible}
        getContainer={false}
        width={1300}
        title='设置数据映射'
        closable={false}
        onClose={onClose}
        style={{
          transform: 'translateX(0px)',
        }}
        okText='确认'
        onOk={onSave}
        onCancel={onCancel}
      >
        {/* <div className="components-table-resizable-column"> */}
        <div className={styles.bodyWrap}>
          <Table
            className={styles.tableWrap}
            scroll={{ y: 310 }}
            rowSelection={rowSelection}
            components={{
              header: {
                cell: ResizeableTitle,
              },
            }}
            columns={columns}
            dataSource={dataSourcePage}
            pagination={false}
            bordered
            rowKey={(record) => record._key_}
            size='small'
          />
        </div>

        <Pagination
          size='small'
          style={{ marginTop: '10px', marginBottom: '-62px' }}
          className={styles.pagination}
          current={pageNum}
          pageSize={pageSize}
          onChange={onChangePage}
          defaultPageSize={10}
          total={dataSource?.length || 0}
          showTotal={(total) => `共 ${total} 条记录`}
          showLessItems
          showQuickJumper
          showSizeChanger
        />
      </Modal>
    </ConfigProvider>
  );
};

export default DataMapList;
