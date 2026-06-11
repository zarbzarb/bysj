import React from 'react';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { designToken } from '@/utils/constant';

/**
 * 用于属性、数据和交互配置面板的 antd 主题配置
 */
export default <P,>(Com: React.ComponentType<P>, zIndex?: number): React.FC<P> =>
  (props: P) => {
    // console.log('props', props);
    // console.log('zIndex', zIndex);
    return (
      <ConfigProvider
        componentSize='small'
        locale={zhCN}
        getPopupContainer={() => document.querySelector('.ConfigProvider')}
        theme={{ algorithm: theme.darkAlgorithm, ...designToken }}
      >
        <div className='antd-dark ConfigProvider' style={{ zIndex }}>
          <Com {...props} />
        </div>
      </ConfigProvider>
    );
  };
