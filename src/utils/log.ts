import _ from 'lodash';
import moment from 'moment';

export const addLog = (info: string, data: any) => {
  (window as any).logList = (window as any).logList ?? [];

  const log = {
    info,
    time: moment().format('HH:mm:ss.SSS'),
    ...data,
  };

  (window as any).logList.push(log);

  (window as any).globalEventEmitter.emit('logUpdate');
};

export const antdLog = (comp: any, type: string, data?: any) => {
  const obj = {
    actionType: 'antd',
    action: '组件初始化',
    el: comp,
    ...data,
  };
  addLog(type, obj);
};

export const compListenVariableLog = (info: any) => {
  let obj = {
    actionType: 'format',
    action: '',
    el: '',
    variableName: '',
    variable: '',
    result: '',
    resultType: '',
  };
  obj = { ...obj, ...info };
  addLog(obj.action, obj);
};

export const formatErrorLog = (settings: any) => {
  const obj = {
    actionType: 'format',
    action: '格式化数据',
    el: '',
    settings,
    variableName: '',
    variable: '',
    result: '失败',
    resultType: 'error',
  };
  addLog(obj.action, obj);
};

export const dataQueryLog = (settings: any, result: any, resultType: any) => {
  const obj = {
    actionType: 'dataQuery',
    action: '接口请求',
    el: '',
    settings: _.cloneDeep(settings),
    variableName: '',
    variable: '',
    result,
    resultType,
  };
  addLog(obj.action, obj);
};
