import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import '@/utils/global-api/index';
import Hook from './pages/Hook/index';
import './styles/index.less';
import './styles/edit.less'; // 编辑状态专用的样式
import './utils/dataStoreUtils';

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Hook />
    </ConfigProvider>
  );
};

ReactDOM.render(<App />, document.querySelector('#hookApp'));
