import React, { useCallback, useRef, useState } from 'react';
import { inject, observer } from 'mobx-react';
import { Tabs, Button, Modal, ConfigProvider, theme } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import classnames from 'classnames';
import styles from './index.less';
import IndicatorPane from './IndicatorPane';
import DimensionPane from './DimensionPane';

const { TabPane } = Tabs;

// 选择指标/维度数据对话框
const IndicatorModal = (props) => {
  const { visible: apiVisiable, onClose: toggleApiVisiable, updateDynamicData, dynamic } = props;

  const [currentTab, setCurrentTab] = useState('1');

  const indicatorRef = useRef(null);
  const dimensionRef = useRef(null);

  const handleClose = () => {
    apiVisiable && toggleApiVisiable();
  };

  const handleOk = useCallback(() => {
    if (currentTab === '1') {
      indicatorRef.current.submit(handleClose);
    } else {
      dimensionRef.current.submit(handleClose);
    }
  }, [currentTab, handleClose]);

  return (
    <ConfigProvider
      componentSize='small'
      theme={{
        algorithm: theme.darkAlgorithm, // 暗色主题
      }}
    >
      <Modal
        open={apiVisiable}
        destroyOnClose={true}
        width={1200}
        closable={false}
        onClose={handleClose}
        style={{
          transform: 'translateX(0px)',
        }}
        okText='选择'
        onOk={handleOk}
        onCancel={handleClose}
        className={classnames('antd-dark', styles.modal)}
      >
        <Tabs
          defaultActiveKey='1'
          onChange={(key) => setCurrentTab(key)}
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
        >
          <TabPane tab='指标数据' key='1' className={styles.tabPanel}>
            <IndicatorPane ref={indicatorRef} dynamic={dynamic} updateDynamicData={updateDynamicData} />
          </TabPane>
          <TabPane tab='维度数据' key='2' className={styles.tabPanel}>
            <DimensionPane ref={dimensionRef} dynamic={dynamic} updateDynamicData={updateDynamicData} />
          </TabPane>
        </Tabs>
      </Modal>
    </ConfigProvider>
  );
};

export default observer(IndicatorModal);
