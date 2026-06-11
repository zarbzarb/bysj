// 注册DataI函数
import '@/utils/global-api/index';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { GetQueryString } from '@/utils/BrowserUtils';
import App from './App';
import Share from './Share';
import 'core-js/es/array/to-sorted';
import 'core-js/es/array/to-reversed';

if (module && module.hot) {
  module.hot.accept();
}

window.addEventListener('error', function (event) {
  console.error('Error captured:', event.message);
  console.error('Source file:', event.filename);
  console.error('Line number:', event.lineno);
  console.error('Column number:', event.colno);
  console.error('Error object:', event.error);

  // document.write(
  //   `<div><p>${event.message}</p><p>${event.filename}</p><p>${event.lineno}</p><p>${event.error}</p></div>`,
  // );
  // 阻止默认的错误处理
  event.preventDefault();
});

const errorCode = GetQueryString('error_code');
const Index = errorCode ? <Share errorCode={errorCode} /> : <App />;

const root = ReactDOM.createRoot(document.querySelector('#app'));
root.render(Index);
