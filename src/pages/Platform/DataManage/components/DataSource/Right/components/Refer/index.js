import React, { useEffect, useState } from 'react';
import { Modal, Table } from 'antd';
import { inject, observer } from 'mobx-react';
import Text from 'antd/lib/typography/Text';
import _ from 'lodash';
import { useStore } from '@/hooks';

const Refer = (props) => {
  const { visible, onCancel, apiInfo, dataSource } = props;
  const {
    globalStore: { isApp }, // v8.6.0
  } = useStore();

  // v8.6.0 过滤当前接口
  const [dataSourceLeft, setDataSourceLeft] = useState(
    dataSource.filter((um) => um.interfaceCode === apiInfo.interfaceCode) || [],
  );

  const columnsLeft = [
    {
      title: '序号',
      align: 'center',
      width: 64,
      render: (text, record, index) => `${index + 1}`,
    },
    {
      title: '组件名称',
      align: 'center',
      dataIndex: 'name',
    },
    {
      title: '引用类型',
      align: 'center',
      width: 96,
      dataIndex: 'refType',
    },
    {
      title: '操作',
      align: 'center',
      width: 104,
      key: 'action',
      render: (text, record, index) => {
        return record.key ? (
          <Text copyable={{ text: record.key }} style={{ color: '#3fb5d2' }}>
            复制key
          </Text>
        ) : (
          '-'
        );
      },
    },
  ];

  // v8.6.0 变量引用关系支持查看所属页面 toSpliced生成新数组，不会修改旧数组
  const columnsPageLeft = columnsLeft.toSpliced(1, 0, {
    title: '所属页面',
    align: 'center',
    width: 96,
    dataIndex: 'pageName',
  });

  useEffect(() => {
    // v8.6.0 过滤当前接口
    const dataSourceLeft1 = dataSource.filter((um) => um.interfaceCode === apiInfo.interfaceCode);
    setDataSourceLeft(dataSourceLeft1);
  }, [apiInfo, dataSource]);

  return (
    <Modal title='接口引用关系' getContainer={false} open={visible} onCancel={onCancel} footer={null}>
      <Table
        // title={() => '组件'}
        columns={isApp ? columnsPageLeft : columnsLeft}
        dataSource={dataSourceLeft}
        rowKey='id'
      />
      {/* {treeData.length > 0 ? <Tree treeData={treeData} defaultExpandAll /> : '没有组件配置此接口'} */}
    </Modal>
  );
};

export default observer(Refer);
