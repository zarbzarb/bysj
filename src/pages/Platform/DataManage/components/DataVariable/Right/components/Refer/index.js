import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Table } from 'antd';
import Text from 'antd/lib/typography/Text';
import { getRelatedApiList, getIdbyUid } from '@/services/apis/dataManage';
import { GetQueryString } from '@/utils/BrowserUtils';
import { useStore } from '@/hooks';

const Refer = (props) => {
  const {
    versionStore: { apiVersion },
    globalStore: { isApp },
  } = useStore();
  const { visible, onCancel, visiable = {}, getVariableRefer } = props;

  const columnsLeft = [
    {
      title: '序号',
      align: 'center',
      width: 65,
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

  const columnsRight = [
    {
      title: '序号',
      align: 'center',
      width: 64,
      render: (text, record, index) => `${index + 1}`,
    },
    {
      title: '接口名称',
      align: 'center',
      dataIndex: 'interfaceName',
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

  const [dataSourceLeft, setDataSourceLeft] = useState([]); // 绑定变量列表
  // let dataSourceLeft = getVariableRefer();
  // dataSourceLeft = dataSourceLeft.filter((item) => item.vKey === visiable.key); // 过滤指定的变量

  // const [relatedApiList, setRelatedApiList] = useState([]); // 接口列表
  const [dataSourceRight, setDataSourceRight] = useState([]); // 绑定变量的接口列表

  // const getRApiList = () => {
  //   const type = GetQueryString('type');
  //   const pageId = GetQueryString('id');
  //   getRelatedApiList({ pageId, ver: apiVersion })
  //     .then(({ success, data }) => {
  //       if (!success) return;
  //       if (data.length === 0 && type === 'card') {
  //         getIdbyUid({
  //           sysCardId: pageId, // 卡片统一获取自增的卡片ID
  //         })
  //           .then(({ success, data }) => {
  //             if (!success) return;
  //             getRelatedApiList({ pageId: data.id, ver: apiVersion })
  //               .then(({ success, data }) => {
  //                 if (!success) return;
  //                 setRelatedApiList(data);
  //               })
  //               .catch((err) => {
  //                 console.log(err);
  //                 setRelatedApiList([]);
  //               });
  //           })
  //           .catch((err) => {
  //             console.log(err);
  //             setRelatedApiList([]);
  //           });
  //       } else {
  //         setRelatedApiList(data);
  //       }
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //       setRelatedApiList([]);
  //     });
  // };

  useEffect(() => {
    if (visible) {
      console.log('Refer getVariableRefer');
      const dataSourceLeft1 = getVariableRefer();
      const dataSourceLeft2 = dataSourceLeft1.filter((item) => item.vKey === visiable.key); // 过滤指定的变量
      setDataSourceLeft(dataSourceLeft2);
      // v8.6.0 获取接变量引用信息
      const dataSourceRight1 = dataSourceLeft2.filter((item) => item.interfaceCode && item.interfaceName); // 过滤包含接口请求
      setDataSourceRight(dataSourceRight1);
    }
  }, [visible, visiable.key, getVariableRefer]);

  // useEffect(() => {
  //   if (visible) {
  //     getRApiList(); // 弹框后需要重新获取接口绑定变量关系
  //   }
  // }, [visible]);

  // useEffect(() => {
  //   if (relatedApiList.length > 0 && !!visiable.key) {
  //     let dataSourceRight = [];
  //     relatedApiList.forEach((relatedApi) => {
  //       if (relatedApi.hasOwnProperty('paramJson')) {
  //         const { paramJson, interfaceName: name } = relatedApi;
  //         const paramArr = paramJson ? JSON.parse(paramJson) : []; // 数组
  //         paramArr.forEach((param) => {
  //           if (param.exampleValue) {
  //             const vKey = param.exampleValue; // 获取绑定变量的key
  //             const data = {
  //               name,
  //               vKey,
  //               refType: '初始化引用',
  //             };
  //             dataSourceRight.push(data);
  //           }
  //         });
  //       }
  //     });
  //     dataSourceRight = dataSourceRight.filter(
  //       (item) => item.vKey === visiable.key, // 过滤指定的变量
  //     );
  //     setDataSourceRight(dataSourceRight);
  //   }
  // }, [relatedApiList, visiable.key]);

  return (
    <Modal title='变量引用关系' getContainer={false} open={visible} onCancel={onCancel} footer={null} width={1000}>
      <Row gutter={24}>
        <Col span={12}>
          <Table
            title={() => '组件'}
            columns={isApp ? columnsPageLeft : columnsLeft}
            dataSource={dataSourceLeft}
            rowKey='id'
          />
        </Col>
        <Col span={12}>
          <Table title={() => '接口'} columns={columnsRight} dataSource={dataSourceRight} rowKey='id' />
        </Col>
      </Row>
    </Modal>
  );
};

export default Refer;
