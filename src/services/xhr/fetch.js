import axios from 'axios';
import { message } from 'antd';
// import qs from 'qs';
import { toJS } from 'mobx';
import Cookies from 'js-cookie';
import { setSpaceIdHeader } from '@/utils/BrowserUtils';
// import getToken from '@/utils/getToken';

const baseurl = 'http://localhost:8080';

/**
 * 创建xhr实例
 * 路径前缀
 * 超时失败时间
 */
const service = axios.create({
  baseURL: baseurl,
  timeout: 50000,
  async: true,
  crossDomain: true,
  withCredentials: false,
  headers: {
    Accept: '*/*',
    'Content-Type': 'application/json',
  },
});

let overdue = true;
/**
 * @desc 设置服务请求拦截器
 * 定义token请求设置
 */
// service.interceptors.request.use(
//   (config) => {
//     // let reg = /^\/\-+/;
//     const token = getToken();
//     if (token != '' && token != undefined && token != null) {
//       let str = token;
//       config.headers.token = str; // IOC需要设置
//       if (str == undefined || str == null) {
//         message.warning('当前用户token无效，请重新登陆或从控制台进入！');
//       }
//     }
//     // else {
//     //   if (localStorage.getItem('authToken') && !reg.test(config.url)) {
//     //     config.headers['Authorization'] = localStorage.getItem('authToken');
//     //     Cookies.set('token', localStorage.getItem('authToken'));
//     //   }
//     // }

//     return config;
//   },
//   (error) => {
//     Promise.reject(error);
//   }
// );
/**
 * @desc 设置服务请求拦截器
 * 应用跳转携带梧桐的空间ID
 */
service.interceptors.request.use(
  (config) => {
    config = setSpaceIdHeader(config);

    // 如果是指标接口，自动带上 x-token
    const isIndicator = config.url.includes('/indicator/');
    if (isIndicator) {
      config.headers['x-token'] = Cookies.get('aksk-token');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * @desc 设置服务响应拦截器
 * 截取返回状态 统一定义成功失败
 */
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    // console.log('service res', res);
    if (typeof res.code !== 'undefined') {
      if (Number(res.code) === 0 || Number(res.code) === 200) {
        return res;
      }
      if (
        Number(res.code) === 401 &&
        ((response.config.source && response.config.source !== 3) || !response.config.source)
      ) {
        const isPreviewPath = window.location.pathname.startsWith('/preview/') || window.location.pathname.startsWith('/pre.');
        if (!isPreviewPath) {
          Cookies.remove('token');
          Cookies.remove('aksk-token');
          Cookies.remove('datai-gateway-token');
          Cookies.remove('yunli-api-gateway-datai_saas_test'); // 测试环境 token
          Cookies.remove('yunli-api-gateway-dataidev'); // sass 环境 token

          if (response.config.url.includes('/indicator/')) {
            message.error('指标接口token无效，请重新登陆或从控制台进入！');

            setTimeout(() => {
              window.location.href = `${'/?redirect='}${encodeURIComponent(window.location.href)}`; // 跳转到根路径
            }, 2000);
          } else {
            window.location.href = `${'/?redirect='}${encodeURIComponent(window.location.href)}`; // 跳转到根路径
          }
        } else {
          console.log('预览模式：忽略401错误');
        }
      } else {
        console.error(res.msg || res.message || response.message);
        return Promise.reject(res);
      }
    } else {
      return res; // 支持外部接口非标准数据结构
    }
  },
  (error) => {
    const obj = error.response;
    // console.log('service obj', obj);
    if (!overdue) return false;
    overdue = false;
    if (obj.status === 401 && ((obj.config.source && obj.config.source !== 3) || !obj.config.source)) {
      const isPreviewPath = window.location.pathname.startsWith('/preview/') || window.location.pathname.startsWith('/pre.');
      if (!isPreviewPath) {
        message.error(
          obj.config.url.includes('/indicator/')
            ? '指标接口token无效，请重新登陆或从控制台进入！'
            : '当前用户token无效，请重新登陆或从控制台进入！',
        );

        Cookies.remove('token');
        Cookies.remove('aksk-token');
        Cookies.remove('datai-gateway-token');
        Cookies.remove('yunli-api-gateway-datai_saas_test'); // 测试环境 token
        Cookies.remove('yunli-api-gateway-dataidev'); // sass 环境 token

        // 接口轮询跳到登录页
        if (process.env.NODE_ENV !== 'development') {
          setTimeout(() => {
            window.location.href = `${'/?redirect='}${encodeURIComponent(window.location.href)}`; // 跳转到根路径
          }, 2000);
        }
      } else {
        console.log('预览模式：忽略401错误');
      }
      overdue = false;
    } else {
      if (!obj.config.url.includes('/authenticate/login')) {
        console.error(obj.message || error.message);
      }
      overdue = true;
    }
    return Promise.reject(obj.message ?? obj.data);
  },
);

const get = (url, params = {}, config = {}) => {
  return service({
    url,
    method: 'get',
    params,
    ...config,
  }).then(
    (rs) => {
      return rs;
    },
    (error) => {
      return error;
    },
  );
};

const post = (url, data = {}, config = {}) => {
  return service({
    url,
    method: 'post',
    data,
    ...config,
  }).then(
    (rs) => {
      // console.log('post rs', rs);
      return rs;
    },
    (error) => {
      // console.log('post error', error);
      return error;
    },
  );
};

const del = (url, data = {}, config = {}) => {
  return service({
    url,
    method: 'delete',
    data,
    ...config,
  })
    .then((rs) => {
      return rs;
    })
    .catch((error) => {
      return error;
    });
};

const postForm = (url, data = {}, config = {}) => {
  let { headers } = config;
  headers = {
    ...headers,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  config.headers = headers;
  config = setSpaceIdHeader(config);
  let ret = '';
  Object.keys(data).forEach((it) => {
    let retItem = ret;
    if (typeof data[it] === 'object') {
      const obj = data[it];
      if (Array.isArray(toJS(obj)) && typeof obj[0] !== 'object') {
        retItem += `${encodeURIComponent(it)}=[${toJS(obj).toString()}]&`;
      } else {
        obj.forEach((vl, i) => {
          Object.keys(vl).forEach((c) => {
            let retItemInner = retItem;
            const child = vl[c];
            if (typeof child === 'object') {
              child.forEach((third, thirdIndex) => {
                Object.keys(third).forEach((s) => {
                  retItemInner += `${encodeURIComponent(it)}[${i}].${encodeURIComponent(
                    c,
                  )}[${thirdIndex}].${encodeURIComponent(s)}=${encodeURIComponent(third[s])}&`;
                });
              });
            } else {
              retItemInner += `${encodeURIComponent(it)}[${i}].${encodeURIComponent(c)}=${encodeURIComponent(vl[c])}&`;
            }
            retItem = retItemInner;
          });
        });
      }
    } else {
      retItem += `${encodeURIComponent(it)}=${encodeURIComponent(data[it])}&`;
    }
    ret = retItem;
  });
  return axios.post(baseurl + url, ret, config).then((response) => {
    return response?.data;
  });
};

const postFile = (url, data = {}, config = {}) => {
  // let config = {
  //   headers: {
  //     // token: getToken(),
  //     // authToken: localStorage.getItem('authToken'),
  //     'Content-Type': 'multipart/form-data'
  //   }
  // };
  let { headers } = config;
  headers = {
    ...headers,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  config.headers = headers;
  config = setSpaceIdHeader(config);
  return axios.post(baseurl + url, data, config).then((rs) => {
    return rs.data;
  });
};
// 生成FormUrlencoded参数
function createFormUrlencoded(data) {
  let formData = '';
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (Array.isArray(value)) {
      value.forEach((item) => {
        formData += `${key}[]=${encodeURIComponent(item)}&`;
      });
    } else {
      formData += `${key}=${encodeURIComponent(value)}&`;
    }
  });
  return formData.slice(0, -1);
}
// FormUrlencoded 请求
const postFormUrlencoded = (url, data = {}, config = {}) => {
  let { headers } = config;
  headers = {
    ...headers,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  // config = setSpaceIdHeader(config);
  config.headers = headers;
  const ret = createFormUrlencoded(data);
  return service.post(url, ret, config).then(
    (rs) => {
      return rs;
    },
    (error) => {
      return error;
    },
  );
};
// 生成FormData参数
function createFormData(data) {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (Array.isArray(value)) {
      value.forEach((item) => {
        formData.append(`${key}[]`, item);
      });
    } else {
      formData.append(key, value);
    }
  });
  return formData;
}
// FormData 请求
const postFormData = (url, data = {}, config = {}) => {
  let { headers } = config;
  headers = {
    ...headers,
    'Content-Type': 'multipart/form-data',
  };
  // config = setSpaceIdHeader(config);
  config.headers = headers;
  const ret = createFormData(data);
  return service.post(url, ret, config).then(
    (rs) => {
      return rs;
    },
    (error) => {
      return error;
    },
  );
};

export { get, post, service, postFile, axios, del, postForm, postFormUrlencoded, postFormData };
export default service;
