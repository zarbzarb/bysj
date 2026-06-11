import React, { useEffect, useState, useCallback } from 'react';
import { Tabs, message, Button, Modal, ConfigProvider, theme } from 'antd';
import classnames from 'classnames';
import { GetQueryString } from '@/utils/BrowserUtils';
import { postInterfaceCategory } from '@/services/apis/dataManage';
import { CloseOutlined } from '@ant-design/icons';
import { inject, observer } from 'mobx-react';
import { useStore } from '@/hooks';
import s from './index.less';
import { Right } from './components/DataSource';
import DataVariable from './components/DataVariable';
import EventRelated from './components/EventRelated';
import InitRelated from './components/InitRelated';

const { TabPane } = Tabs;

const DataManage = (props) => {
  const {
    controlStore: { dataVisible, toggleDataVisible },
    globalStore: { setVariableName },
  } = useStore();
  const { container = false } = props;
  const [field, setField] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const pageId = GetQueryString('id');
  const deepMapToCode = useCallback((data) => {
    if (Array.isArray(data)) {
      data.forEach((child, idx) => {
        child.code = child.id;
        child.children && deepMapToCode(child.children);
      });
    }
  }, []);

  const fetchInterfaceCategory = useCallback(async () => {
    console.log('postInterfaceCategory');
    const { data, success, message: msg } = await postInterfaceCategory();
    if (!success) {
      return message.error(msg);
    }
    deepMapToCode(data);
    const topLevelData = [
      {
        category: '全部',
        code: '0',
        children: data,
      },
    ];
    setField(topLevelData);
    setSelectedKeys(['0']);
  }, [deepMapToCode]);

  useEffect(() => {
    if (dataVisible && field.length === 0) {
      fetchInterfaceCategory();
    }
  }, [fetchInterfaceCategory, dataVisible]);

  const handleClose = useCallback(() => {
    toggleDataVisible();

    // 关闭时，需要清空 CommonStore.variableName
    setVariableName('');
  }, [toggleDataVisible, setVariableName]);

  const items = [
    {
      key: '1',
      label: '数据变量管理',
      children: (
        <div className={classnames(s.tabPanel)}>
          <DataVariable parentStyle={s} />
        </div>
      ),
    },
    {
      key: '2',
      label: '数据源配置',
      children: (
        <div className={classnames(s.tabPanel)}>
          <div className={s.rightWrap}>
            <Right pageId={pageId} categoryId={selectedKeys[0] === '0' ? '' : selectedKeys[0]} />
          </div>
        </div>
      ),
    },
    {
      key: '3',
      label: '事件关联查看',
      children: (
        <div className={classnames(s.tabPanel)}>
          <EventRelated />
        </div>
      ),
    },
    {
      key: '4',
      label: '初始化关联查看',
      children: (
        <div className={classnames(s.tabPanel)}>
          <InitRelated />
        </div>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm, // 暗色主题
      }}
    >
      <Modal
        getContainer={container}
        open={dataVisible}
        width={1300}
        closable={false}
        onClose={handleClose}
        style={{
          transform: 'translateX(0px)',
        }}
        footer={null}
        className={`${classnames('antd-dark', s.wrap)} settings-modal`}
      >
        <Tabs
          defaultActiveKey='0'
          tabBarExtraContent={
            <Button
              icon={<CloseOutlined />}
              size='small'
              type='primary'
              title='关闭'
              style={{ width: '40px' }}
              onClick={handleClose}
            />
          }
          items={items}
        />
      </Modal>
    </ConfigProvider>
  );
};

export default observer(DataManage);
