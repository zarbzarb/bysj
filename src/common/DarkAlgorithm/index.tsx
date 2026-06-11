/**
 * 暗色主题容器组件
 */
import React, { FC } from 'react';
import { ConfigProvider, theme } from 'antd';

type IProps = {
  children: React.ReactElement;
};

const MyComponent: FC<IProps> = (props) => {
  const { children } = props;

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm, // 暗色主题
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default MyComponent;
