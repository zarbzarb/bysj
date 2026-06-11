import { message } from 'antd';
import dayjs from 'dayjs';
import { setStoreData, getDataByKey } from '@/utils/dataStoreUtils';
import _ from 'lodash';
import { formatErrorLog, dataQueryLog } from '@/utils/log';
import qs from 'qs';
import { babelTransform, babelTransform6 } from '@/utils/utils';
import timerTask from '@/common/Dispatch/TimerTask';
import { allTypesFetch } from './utils';

const getExpDataByKey = (variable, expression) => {
  let data = getDataByKey(variable);
  data = babelTransform(expression, data); // 运行时ES6转ES5
  return data;
};

const setUrl = (url, params, regUrl, method) => {
  const result = url.match(regUrl);
  result?.forEach((val) => {
    const v = val.slice(1).slice(0, Math.max(0, val.slice(1).length - 1));

    for (const s in params) {
      if (s === v) {
        const reg = new RegExp(val, 'g');
        url = url.replace(reg, params[s]);
        // if (method == 'GET') {
        delete params[s];
        // }
      }
    }
  });
  return url;
};

const getExampleValue = (paramList) => {
  // 入参转换
  const params = paramList.reduce((prevParam, currParm) => {
    // eslint-disable-next-line prefer-const
    let { name: key, example: value, type, isRefer, exampleValue, exampleExpression, queryFlag } = currParm;
    if (exampleValue && isRefer) {
      value = getDataByKey(exampleValue) === 0 ? getDataByKey(exampleValue) : getDataByKey(exampleValue) || '';
      if (exampleExpression && exampleExpression.trim().length > 0) {
        try {
          value = babelTransform(exampleExpression, value); // 运行时ES6转ES5
        } catch (error) {
          // message.warning(e);
          console.log(error); // message.warning会导致白屏
        }
      }
    } else {
      // eslint-disable-next-line no-lonely-if
      if (type === 'number') {
        value = value ? Number.parseFloat(value) : '';
      } else if (type === 'array' || type === 'object') {
        value && (value = JSON.parse(value));
      }
      // else if (type === 'boolean') {
      //   value = value == 'false' ? false : Boolean(value);
      // }
    }
    if (!queryFlag && value !== undefined) {
      prevParam[key] = value;
    }
    return prevParam;
  }, {});
  return params;
};

// 是否是新接口(新接口路径 /easydata/api/center )
const isEasyDataApi = (url) => {
  return /.*\/easydata/.test(url);
};

export const executeAjax = (dataQuerys, screenConfig, testCallBack) => {
  const dataQuery = _.cloneDeep(dataQuerys);
  // apiInfo 数据信息 paramList入参 dataMapList 数据映射 variable 变量
  const { apiInfo, contentType, headers = [], dataMapList = [], variable } = dataQuery;
  if (!apiInfo) return;
  let paramList = dataQuery.paramList || [];
  // 变量表达式
  let { variableExpression = 'data.data' } = dataQuery;
  if (variableExpression === '') {
    variableExpression = 'data.data';
  }
  dataQueryLog(dataQuery, '开始', 'success');
  if (paramList == null) {
    paramList = [];
  }

  if (apiInfo.isIndicator) {
    // 遇到参数值类似 {Date@YYYY/MM/DD HH:mm:ss} 的，表示要替换为当前时间
    const pattern = /^{Date@(.+)}$/;
    paramList.forEach((item) => {
      if (item.type === 'string' && pattern.test(item.example)) {
        const match = pattern.exec(item.example);
        item.example = dayjs(new Date()).format(match[1]);
      }
    });
  }

  const params = getExampleValue(paramList);
  // 完善apiInfo字段判断
  if (Object.prototype.toString.call(apiInfo) !== '[object Object]') {
    return;
  }
  // eslint-disable-next-line prefer-const
  let { method, url, useProxy, interfaceCode, source, centerUrl } = apiInfo; // 添加useProxy和interfaceCode用于请求和保存缓存数据

  // 外部接口: 只有使用代理的情况下才使用centerUrl
  if (source === 3) {
    if (useProxy === 1) {
      // 使用代理
      url = centerUrl;
    }
  } else {
    // 其他类型接口: 有centerUrl使用centerUrl
    url = centerUrl || url; // 接口中心换了字段做兼容处理
  }

  method = method.toLocaleLowerCase();

  // 添加支持POST请求的query参数
  if (method === 'post') {
    const querys = paramList.filter((item) => !!item.queryFlag);
    const queryArr = [];
    querys.forEach((item, index) => {
      // eslint-disable-next-line prefer-const
      let { name: key, example: value, type, isRefer, exampleValue, exampleExpression, queryFlag } = item;
      if (exampleValue && isRefer) {
        value = getDataByKey(exampleValue) === 0 ? getDataByKey(exampleValue) : getDataByKey(exampleValue) || '';
        if (exampleExpression && exampleExpression.trim().length > 0) {
          try {
            value = babelTransform(exampleExpression, value); // 运行时ES6转ES5
          } catch (error) {
            // message.warning(e);
            console.log(error); // message.warning会导致白屏
          }
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (type === 'number') {
          value = value ? Number.parseFloat(value) : '';
        } else if (type === 'array' || type === 'object') {
          value && (value = JSON.parse(value));
        }
        // else if (type === 'string') {
        //   value = value === undefined ? '' : value;
        // }
        // else if (type === 'boolean') {
        //   value = value == 'false' ? false : Boolean(value);
        // }
      }
      if (value !== undefined) {
        queryArr[index] = `${key}=${value}`;
      }
    });
    const queryStr = queryArr.join('&');
    // 加判断解决没有query参数带?的情况
    if (queryStr) {
      url += !url.includes('?') ? '?' : '&';
      url += queryStr;
    }
  }

  // 处理url里面有变量{}
  const regUrl = /{(.+?)}/g;
  if (regUrl.test(url)) {
    url = setUrl(url, params, regUrl, method);
    // console.log(url);
  }

  dataQuery.realParams = params;
  dataQueryLog(dataQuery, '格式化请求参数信息', 'success');

  if (url.indexOf('api') === 0) {
    url = `/${url}`;
  }

  // 接口支持多级目录部署路径
  if (window.requestPrefix) {
    if ((source === 3 && useProxy === 0) || url.indexOf('/indicator/') === 0) {
      // 外部接口不使用代理这种情况是直接请求外部接口，不需要考虑多级目录部署路径
    } else {
      const prefix = window.requestPrefix.replace('/api', '');
      url = prefix + url;
    }
  }

  const getApi = (isLoop = false) => {
    /**
     * fetchUrl: 被处理的接口(加参数、换缓存路径)
     * url: 原始接口
     */
    let fetchUrl = url;
    let fetchMethod = method;

    // 兼容接口轮询时参数引用变量变化时能够更新参数
    let params = getExampleValue(paramList);

    // get 请求参数处理
    if (
      method === 'get' && // 外部接口代理 || api接口
      (source === 6 || (source === 3 && useProxy === 1))
    ) {
      const queryParams = qs.stringify(params);
      fetchUrl = isEasyDataApi(url) ? `${fetchUrl}?${queryParams}` : `${fetchUrl}&${queryParams}`;
      params = null;
    }

    // 执行数据缓存接口逻辑
    if (screenConfig.dataType === 1 && !(url.indexOf('/indicator/') === 0)) {
      fetchMethod = 'post';
      switch (source) {
        case 1: // SQL配置
          // url 是原始url，fetchUrl是请求的url
          fetchUrl = isEasyDataApi(url) ? '/api/query/cache/V1/cacheBodyQuery' : '/api/query/cache/V1/cacheBasicQuery';
          break;
        case 2: // 系统自研
          fetchUrl = '/api/query/cache/V1/queryExternalInterfaceData';
          params = {
            interfaceCode,
            queryParam: params ? JSON.stringify(params) : '{}',
          };
          break;
        case 3: // 外部接口
          // 开启代理
          if (useProxy) {
            const pos = fetchUrl.indexOf('?');
            const query = pos > 0 ? fetchUrl.slice(pos) : ''; // url后面的参数
            fetchUrl = isEasyDataApi(url)
              ? `/api/query/cache/V1/cacheProxyQueryByCode/${interfaceCode}${query}`
              : `/api/query/cache/V1/cacheProxyQuery${query}`;
          } else {
            // 前端直接请求外部接口
            fetchUrl = '/api/query/cache/V1/queryExternalInterfaceData';
            params = {
              interfaceCode,
              queryParam: params ? JSON.stringify(params) : '{}',
            };
          }
          break;
        case 5: // 数据集
          fetchUrl = '/api/query/cache/V1/cacheBodyQuery';
          params = { ...params, sqlApiCode: interfaceCode };
          break;
        case 6: // api接口
          const pos = fetchUrl.indexOf('?');
          const query = pos > 0 ? fetchUrl.slice(pos) : ''; // url后面的参数
          fetchUrl = `/api/query/cache/V1/cacheProxyQueryByCode/${interfaceCode}${query}`;
          break;

        default:
          break;
      }
      // 获取缓存接口支持多级目录部署路径
      if (window.requestPrefix) {
        const prefix = window.requestPrefix.replace('/api', '');
        fetchUrl = prefix + fetchUrl;
      }

      // if (isLoop) {
      //   fetchUrl += '?cycle=true'; // 轮询的接口在url后面加参数标识
      // }
    }

    const config = {};

    headers.forEach((item) => {
      config[item.key] = item.value;
    });
    // v7-10-0 区分post不同参数格式
    let methodType = fetchMethod;
    const paramsKeys = params && Object.keys(params);
    // console.log('paramsKeys', paramsKeys);
    if (method === 'post' && paramsKeys && paramsKeys.length > 0) {
      if (contentType === 'formData') {
        methodType = 'postFormData';
      } else if (contentType === 'xWwwFormUrlencoded') {
        methodType = 'postFormUrlencoded';
      }
    }
    // console.log('methodType', methodType);
    // 无参数时不传
    if (!paramsKeys || paramsKeys.length === 0) {
      params = null;
    }

    // 兼容外部老接口开启代理post请求参数为undefined时沈阳版本没有删除参数问题(沈阳应急版本导出后使用缓存问题)
    if (screenConfig.dataType == 1 && source == 3 && useProxy == 1 && method == 'post' && params == null) {
      // 只处理老接口
      if (!isEasyDataApi(url)) {
        params = {};
      }
    }

    // 公共逻辑，封装给下面的if else 使用
    const dynamicFn = (data) => {
      // 使用动态数据源的接口返回数据是数组
      let cacheData = data;

      // 系统自研和不使用代理的外部接口 需要 调用保存缓存的接口
      if ((source === 3 || source === 2) && useProxy === 0 && cacheData) {
        // 正常请求时进行缓存
        if (!screenConfig.dataType) {
          // 前端直接请求外部接口返回的数据保存到后端
          let urls = '/api/query/cache/V1/saveExternalInterfaceData';
          const saveParams = {
            cycle: isLoop,
            interfaceCode,
            queryParam: params ? JSON.stringify(params) : '{}',
            result: JSON.stringify(cacheData), // 有结果再保存
          };
          // 外部接口不启用代理保存缓存接口支持多级目录部署路径
          if (window.requestPrefix) {
            const prefix = window.requestPrefix.replace('/api', '');
            urls = prefix + urls;
          }
          allTypesFetch.post(urls, saveParams, { source }); // 提交保存
        }

        // 如果接口返回的是字符串，说明是调用缓存接口返回的数据，需要进行反序列化成对象
        if (typeof cacheData === 'string') {
          cacheData = JSON.parse(cacheData);
        }
      }

      dataQuery.response = cacheData;
      delete dataQuery.realParams;
      dataQueryLog(dataQuery, '接口请求成功', 'success');

      let store = {};
      // 测试回调 && 动态数据源使用回调
      if (testCallBack) {
        testCallBack && testCallBack(cacheData);
        return;
      }
      // 保存返回变量
      if (variable) {
        try {
          store[variable] = babelTransform(variableExpression, cacheData); // 运行时ES6转ES5
        } catch {
          formatErrorLog({
            cacheData,
            expression: `return ${variableExpression}`,
          });
        }
      }
      // 数据映射
      store = dataMapList.reduce((s, mapInfo) => {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const { type, path, code, variable } = mapInfo;
        let value;
        // v7.3.0 数据映射处理
        if (type === 'config') {
          value = _.get(cacheData, path);
        }
        if (type === 'code') {
          // eslint-disable-next-line @typescript-eslint/no-shadow
          const getFun = babelTransform6(code, (data) => data);
          value = getFun(cacheData);
        }
        if (value || typeof value !== 'undefined') {
          s[variable] = value.data ? value.data : value;
        }
        return s;
      }, store);

      Object.entries(store).forEach(([key, value]) => {
        // v7.3.0 数据更新 TODO数据类型校验
        setStoreData(key, value); // 更新全局存储的变量数据
      });
    };

    // 当对应组件有动态缓存数据时，不凋接口，否则请求接口
    if (dataQuery.newData && dataQuery.firstDynamic && !dataQuery.isDynamic) {
      dynamicFn(dataQuery.newData);
    } else {
      allTypesFetch[methodType](fetchUrl, params, { headers: config, source })
        .then((data) => {
          dynamicFn(data);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  };
  let timer;
  if (dataQuery.apiMs === undefined) {
    dataQuery.apiMs = 5;
  }
  // 预览的时候轮询
  if (dataQuery.isLoop && window.layerList) {
    let { apiMs } = dataQuery;
    if (dataQuery.msVariable) {
      apiMs = getExpDataByKey(dataQuery.msVariable, dataQuery.msExpression);
    }
    getApi(true);
    if (dataQuerys.timer) {
      clearInterval(dataQuerys.timer);
    }
    timer = setInterval(() => {
      getApi(true);
    }, Number.parseInt(apiMs * 1000));
    dataQuerys.timer = timer;
    // 暴露方法清除定时器
    dataQuerys.clearIntervalFn = function () {
      clearInterval(dataQuerys.timer);
    };

    timerTask.addTask({
      taskId: timer,
      taskType: 'interval',
      appPageId: screenConfig.pageId,
    });
  } else {
    clearInterval(timer);
    getApi();
  }
};

export default (action, settings) => {
  const dataQuery = action.actionSettings;
  // console.log('dataQuery', dataQuery);
  const screenConfig = settings.config;
  if (!dataQuery) {
    return message.warning(`组件${settings?.item?.key || ''}数据配置请求不完善，请先补全功能！`);
  }
  try {
    executeAjax(dataQuery, screenConfig);
  } catch (error) {
    console.error(error);
  }
};

export const TriggerRequest = (dataQuerys, testCallBack) => {
  executeAjax(dataQuerys, window.screenConfig, testCallBack);
};
