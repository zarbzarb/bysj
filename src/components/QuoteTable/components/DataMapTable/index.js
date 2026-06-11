import React, { useState, useRef, useEffect } from 'react';
import { Button, Table, Drawer, Popconfirm } from 'antd';
import s from './index.less';
import classnames from 'classnames';
import EditDataMap from './EditDataMap';
import shortId from 'short-uuid';
import { PlusCircleOutlined } from '@ant-design/icons';

function DataMapTable(props) {
  const {
    resultList, // 返回参数列表
    value = [], // 数据映射列表
    onChange, // 值修改
    callBack, // 保存 暂无处理
    item, // 动作指针
    getApiList, // 获取api列表
  } = props;
  const editMapRef = useRef(); // EditDataMap
  const currMap = useRef({}); // 当前被编辑的行的数据
  const [visible, setVisible] = useState(false); // 编辑弹框是否可见
  const [ids, setIds] = useState([]); // 编辑选中行数据的ids
  // 编辑
  const onEdit = (record) => {
    getApiList();
    setVisible(true);
    setIds(record.ids); //回显选中的值
    currMap.current = record;
  };
  // 删除 映射关系 key
  const onDelete = ({ key }) => {
    const newV = value.filter((v) => v.key !== key);
    onChange(newV);
  };
  // 打开弹框
  const onAdd = () => {
    getApiList();
    setVisible(true);
  };
  // 关闭弹框
  const onClose = () => {
    setVisible(false);
  };
  useEffect(() => {
    if (!visible) {
      // 关闭之后，重置
      editMapRef.current && editMapRef.current.resetFields();
      currMap.current = {};
    } else {
      const {
        type = 'config', // 映射方式
        mapName, // 映射名称
        mapDesc, // 映射描述
        code, // 代码
        path, // 选中字段
        variable, // 变量
      } = currMap.current;
      const initValues = {
        type,
        mapName,
        mapDesc,
        variable,
      };
      if (type === 'config') {
        initValues.path = path;
      } else {
        initValues.code = code;
      }
      editMapRef.current.setFieldsValue(initValues);
    }
  }, [visible]);
  const saveIds = (id) => {
    setIds(id);
  };
  const onSave = () => {
    editMapRef.current.validateFields().then((values) => {
      let newValue = [];
      if (Object.keys(currMap.current).length === 0) {
        // 新增 数据映射 key随机生成
        newValue = value.concat({
          ...values,
          key: `map_${shortId.generate()}`,
        });
      } else {
        // 编辑
        newValue = value.map((item) => {
          if (item.key === currMap.current.key) {
            item = {
              ...item,
              ...values,
              ids: ids,
            };
          }
          return item;
        });
      }
      onChange(newValue);
      setVisible(false);
      typeof callBack == 'function' && callBack();
    });
  };
  const columns = [
    {
      title: '映射名称',
      dataIndex: 'mapName',
      ellipsis: true,
      width: 68,
    },
    {
      title: '映射描述',
      dataIndex: 'mapDesc',
      ellipsis: true,
    },
    {
      title: '操作',
      dataIndex: 'active',
      width: 80,
      render: (text, record, i) => {
        return (
          <span className={s.handleWrap}>
            <a onClick={() => onEdit(record)}>编辑</a>
            <Popconfirm
              getPopupContainer={() => document.body}
              placement='topRight'
              title='是否删除该条数据过滤？'
              onConfirm={() => onDelete(record)}
            >
              <a>删除</a>
            </Popconfirm>
          </span>
        );
      },
    },
  ];

  return (
    <div className={s.wrap}>
      <div className={s.titleWrap}>
        <div className={s.title}>数据映射</div>
        <Button type='link' onClick={onAdd} icon={<PlusCircleOutlined />}>
          新增
        </Button>
      </div>
      <Table
        columns={columns}
        className={s.table}
        dataSource={value}
        pagination={false}
        bordered
        rowKey='key'
        size='small'
      />

      <Drawer
        visible={visible}
        placement='right'
        width={500}
        zIndex={2000}
        bodyStyle={{ paddingBottom: 80 }}
        keyboard={false}
        footer={
          <div
            style={{
              textAlign: 'right',
            }}
          >
            <Button style={{ marginRight: 8 }} onClick={() => setVisible(false)}>
              取消
            </Button>
            <Button type='primary' onClick={onSave}>
              保存
            </Button>
          </div>
        }
        title='数据映射'
        onClose={onClose}
        getContainer={() => document.body}
        className={classnames('antd-dark')}
      >
        {visible && (
          <EditDataMap
            item={item}
            resultList={resultList}
            ref={editMapRef}
            mapInfo={undefined}
            saveIds={saveIds}
            ids={ids}
          />
        )}
      </Drawer>
    </div>
  );
}

export default DataMapTable;
