import React from 'react';
import { Table } from 'antd';
import { inject, observer } from 'mobx-react';
import Text from 'antd/lib/typography/Text';
import { useStore } from '@/hooks';

let EventRelated = (props) => {
  const {
    editorStore: { getCompList },
  } = useStore();

  const columns = [
    {
      title: '序号',
      render: (text, record, index) => `${index + 1}`,
    },
    {
      title: '组件名称',
      dataIndex: 'name',
    },
    {
      title: '事件操作',
      dataIndex: 'eventType',
    },
    {
      title: '事件key',
      dataIndex: 'eventKey',
      render: (text) => (text ? text : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (text, record, index) => {
        return (
          <Text copyable={{ text: record.key }} style={{ color: '#3fb5d2' }}>
            复制组件key
          </Text>
        );
      },
    },
  ];

  const getDataFun = (item, dataSource) => {
    const key = item.key; // 为了定位组件获取组件的key
    const name = item.name || item.compName; // antd组件初始用的compName
    // 交互配置
    let { eventSetings = [] } = item; // eventSetings可能不存在
    if (eventSetings.length === 0) return; // 没有配置一级交互事件直接返回
    // 监听事件
    const monitoringEvent = eventSetings.filter((event) => {
      return event.eventType == 'monitoringEvent';
    });
    monitoringEvent.forEach((event) => {
      const eventKey = event.eventListenKey; // 事件key
      const data = { key, name, eventType: '监听', eventKey };
      dataSource.push(data);
    });
    eventSetings.forEach((event) => {
      const { actions = [] } = event; // actions可能不存在
      if (actions.length === 0) return; // 没有配置二级交互事件直接返回
      actions.forEach((action) => {
        const { actionSettings = {} } = action; // actionSettings可能不存在
        // 事件发布
        if (action.actionType === 'eventEmit') {
          const eventKey = actionSettings.eventKey; // 事件key
          const data = { key, name, eventType: '发布', eventKey };
          dataSource.push(data);
        }
      });
    });
  };

  const getDataSource = () => {
    const dataSource = [];
    const loop = (componentList) => {
      componentList.forEach((item) => {
        if (item.classType === 'group') {
          getDataFun(item, dataSource);
          loop(item.childComList);
        } else if (item.type === 'DynamicPanel' || item.type === 'CollapsePanel') {
          // v8.17 新增折叠面板
          // 动态面板
          getDataFun(item, dataSource);
          item.children.forEach((child) => {
            loop(child.AntdChildComponents);
          });
        } else {
          getDataFun(item, dataSource);
        }
      });
    };

    loop(componentList);
    return dataSource;
  };

  const componentList = getCompList();
  const dataSource = getDataSource();

  return <Table style={{ width: '100%' }} columns={columns} dataSource={dataSource} rowKey='id' />;
};

export default observer(EventRelated);
