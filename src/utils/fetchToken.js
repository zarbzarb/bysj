import { message } from 'antd';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';

// 测试环境 datai 账号
const TEST_DATAI_ACCOUNT = {
  nsKey: 'datai',
  authTicket: 'test-datai',
  password: 'Root_123456',
};
// default 账号
const DEFAULT_ACCOUNT = {
  nsKey: 'default',
  // authTicket: 'datai',
  // password: '@datai.123',
  authTicket: 'dataiadmin',
  password: 'Wt.kfpt2022',
};

const postSync = (url, param) => {
  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.open('POST', url, false);
    request.setRequestHeader('Content-Type', 'application/json');
    request.onreadystatechange = function () {
      if (!request || request.readyState !== 4) {
        return;
      }
      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return;
      }
      let responseData = request.response;
      try {
        responseData = JSON.parse(responseData);
      } catch {
        responseData = null;
      }
      const response = {
        response: responseData,
        status: request.status,
        statusText: request.statusText,
      };
      resolve(response);
      request = null;
    };
    request.addEventListener('error', function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(request);
      // Clean up request
      request = null;
    });
    request.ontimeout = (e) => {
      message.error('token获取异常');
      reject(new AxiosError('token获取异常'));
      request = null;
    };
    request.send(JSON.stringify(param));
  });
};

export const fetchToken = () => {
  if (process.env.NODE_ENV === 'development') {
    const param = {
      // ...TEST_DATAI_ACCOUNT,
      ...DEFAULT_ACCOUNT,
      authType: 0,
      isEncryption: false,
    };
    return postSync('/gw/auth/login', param).then((res) => {
      const { status, response = {} } = res;
      if (status === 200) {
        const { result, code, message: msg } = response;
        if (code !== 0) {
          message.error(msg);
          return;
        }
        Cookies.set('token', result.token);
      }
    });
  }
  return Promise.resolve();
};
