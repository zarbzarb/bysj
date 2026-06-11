import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { designToken } from '@/utils/constant';

const HocConfigProviderTheme = (Comp: React.ComponentType) => {
  return (props: any) => (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm, // 暗色主题
        ...designToken,
      }}
    >
      <Comp {...props} />
    </ConfigProvider>
  );
};

export default HocConfigProviderTheme;
