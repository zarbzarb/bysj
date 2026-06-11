import _ from 'lodash';
import { addLog } from '@/utils/log';
import { message } from 'antd';

const infoFormatToLog = (obj, currentData) => {
  currentData = _.cloneDeep(currentData);
  obj.type = 'variable';
  addLog(obj, currentData); // 大屏设计器控制台打印
};

const errorSetStore = (key, variableName, data, isBoth) => {
  if (isBoth) {
    infoFormatToLog(
      {
        actionType: 'variable',
        action: '设置变量',
        el: '',
        variableName,
        variable: key,
        result: '数据重复，无效',
        resultType: 'invalid',
      },
      data,
    );
  } else {
    infoFormatToLog(
      {
        actionType: 'variable',
        action: '设置变量',
        el: '',
        variableName,
        variable: key,
        result: '失败',
        resultType: 'error',
      },
      data,
    );
  }
};

const getDataNameByKey = (key) => {
  // let groupKey = key.split('-')[0];
  const groupKeyArr = key.split('-');
  let groupKey = groupKeyArr[0];
  // 兼容卡片
  if (groupKeyArr.length > 2) {
    groupKey = `${groupKeyArr[0]}-${groupKeyArr[2]}`;
  }
  const groupStore = window.dataStore && window.dataStore.find((group) => group.key == groupKey); // 查询变量组
  if (groupStore) {
    const variable = groupStore.children.find((variable) => variable.key == key); // 查询变量
    return variable && variable.name;
  }
};

const setStoreProps = (key = '', data, props, value) => {
  const variable = setStoreData(key, data);
  if (variable && props && value) {
    variable[props] = value;
    variable.defaultValue = data;
  }
};

const setStoreData = (key = '', data, visiable) => {
  if (key == undefined || key == '') {
    infoFormatToLog(
      {
        actionType: 'variable',
        action: '设置变量，传入key为空值',
        el: '',
        variableName: '',
        variable: key,
        result: '错误',
        resultType: 'error',
      },
      data,
    );
    return;
  }

  const dataName = getDataNameByKey(key); // 获取全局变量的名称

  if (dataName == undefined) {
    infoFormatToLog(
      {
        actionType: 'variable',
        action: '变量名称找不到，请确认变量是否存在：',
        el: '',
        variableName: key,
        variable: key,
        result: '',
        resultType: 'error',
      },
      data,
    );
    return;
  }

  infoFormatToLog(
    {
      actionType: 'variable',
      action: '设置变量',
      el: '',
      variableName: dataName,
      variable: key,
      result: '',
      resultType: '',
    },
    data,
  );

  if (!window.dataStore) return errorSetStore(key, dataName, data);

  const EventEmitter = window.globalEventEmitter;
  if (key == '') {
    return errorSetStore(key, dataName, data);
  }
  // let groupKey = key.split('-')[0];
  const groupKeyArr = key.split('-');
  let groupKey = groupKeyArr[0];
  // 兼容卡片
  if (groupKeyArr.length > 2) {
    groupKey = `${groupKeyArr[0]}-${groupKeyArr[2]}`;
  }
  if (!window.dataStore) return errorSetStore(key, dataName, data);

  const groupStore = window.dataStore.find((group) => group.key == groupKey); // 查询变量组
  if (!groupStore) return errorSetStore(key, dataName, data);

  const variable = groupStore.children.find((variable) => variable.key == key); // 查询变量

  const isBothValue = _.isEqual(data, variable.data);

  if (isBothValue) {
    // 两次之相等，判断是否超过了 0.3s
    if (Date.now() - variable.expires < 300) {
      // 小于0.3s 进行了第二次操作，可能是递归循环，计数
      variable.updateCount += 1;
    } else {
      variable.expires = Date.now() + 300;
      variable.updateCount = 0;
    }
    // 在0.3s内 计数超过10次，当前变量的操作引用可能涉及到死循环
    if (variable.updateCount > 10) {
      console.error(key, '当前变量死循环，请检查配置信息-----');
      return errorSetStore(key, dataName, data, true);
    }
  }

  if (!variable.expires) {
    variable.expires = Date.now() + 300;
    variable.updateCount = 0;
  }

  if (!!visiable && visiable.defaultValueCode) {
    variable.defaultValueCode = visiable.defaultValueCode; // REVIEW liuming 重置后需要重新设置初始值函数
  }
  variable.data = data;
  variable.count += 1; // 注意

  infoFormatToLog(
    {
      actionType: 'variable',
      action: '设置变量',
      el: '',
      variableName: dataName,
      variable: key,
      result: '成功',
      resultType: 'success',
    },
    data,
  );

  // variable.mapCompIds &&
  //   variable.mapCompIds.forEach((compKey, idx) => {
  //     EventEmitter.emit(compKey, data); // 修改全局变量通知相关组件, datai 组件不再使用这种方式，统一用下面变量的 key 发布
  //   });

  EventEmitter.emit(key, data); // 修改全局变量发布出去

  infoFormatToLog(
    {
      actionType: 'variable',
      action: '发布变量',
      el: '',
      variableName: dataName,
      variable: key,
      result: '值改变事件,通知其他组件',
      resultType: 'success',
    },
    data,
  );
  return variable;
};

const getDataByKey = (key = '') => {
  if (key === '') {
    return;
  }

  const groupKeyArr = key.split('-');
  let groupKey = groupKeyArr[0];

  // 兼容卡片
  if (groupKeyArr.length > 2) {
    groupKey = `${groupKeyArr[0]}-${groupKeyArr[2]}`;
  }

  const groupStore = window.dataStore && window.dataStore.find((group) => group.key == groupKey); // 查询变量组
  if (!groupStore) return;
  const variable = groupStore.children.find((variable) => variable.key == key); // 查询变量
  let variableData = variable && variable.data;

  // 变量中无data字段的情况下，返回默认值
  if (variable && !variable.hasOwnProperty('data')) {
    // 实时取值
    const fn = new Function(variable.defaultValueCode); // 构造代码执行函数
    variableData = fn(); // 执行自定义代码

    // 地图保存数据不能实时取值，暂时这么处理
    if (variable.defaultType == 'map') {
      variableData = variable && variable.defaultValue;
    }
  }

  return variableData;
};

// mapCompIds
const mapDataToComp = (variableKey = '', compKey) => {
  if (variableKey === '') {
    return;
  }
  // let groupKey = variableKey.split('-')[0];
  const groupKeyArr = variableKey.split('-');
  let groupKey = groupKeyArr[0];
  // 兼容卡片
  if (groupKeyArr.length > 2) {
    groupKey = `${groupKeyArr[0]}-${groupKeyArr[2]}`;
  }

  const groupStore = window.dataStore && window.dataStore.find((group) => group.key == groupKey); // 查询变量组
  if (!groupStore) return;
  const variable = groupStore.children.find(
    (variable) => variable.key == variableKey, // 查询变量
  );
  if (variable.mapCompIds.findIndex((key) => key == variable) < 0) {
    variable.mapCompIds.push(compKey); // 全局变量绑定相关组件
  }
};

const removeDataToComp = (variableKey = '', compKey) => {
  if (variableKey == '') {
    return;
  }
  // let groupKey = variableKey.split('-')[0];
  const groupKeyArr = variableKey.split('-');
  let groupKey = groupKeyArr[0];
  // 兼容卡片
  if (groupKeyArr.length > 2) {
    groupKey = `${groupKeyArr[0]}-${groupKeyArr[2]}`;
  }
  const groupStore = window.dataStore && window.dataStore.find((group) => group.key == groupKey); // 查询变量组
  if (!groupStore) return;
  const variable = groupStore.children.find(
    (variable) => variable.key == variableKey, // 查询变量
  );
  variable.mapCompIds = variable.mapCompIds.filter((key) => key != compKey); // 全局变量解绑不相关组件
};

const initDataByDefault = (visiable) => {
  let errorStr;
  const { variableType, defaultValueCode } = visiable;

  let value;
  try {
    const fn = new Function(defaultValueCode); // 构造代码执行函数
    value = fn(); // 执行自定义代码
  } catch (error) {
    infoFormatToLog(
      {
        actionType: 'variable',
        action: '变量初始化',
        el: '',
        variable: '',
        result: '失败',
        resultType: 'error',
      },
      visiable,
    );

    // console.error('错误变量信息初始化', visiable, defaultValueCode);
    visiable.defaultValueCode = `//请将返回值以retun方式返回
return ""`; // 临时方案,恢复到初始值
    message.error('错误变量信息初始化');
    errorStr = error;
    throw error;
  }

  if (variableType == 'string') {
    // 字符串
    if (typeof value === 'string') {
      visiable.defaultValue = value; // 设置默认值
    } else {
      errorStr = '当前默认数据格式不正确，应为string字符串，例："张三"';
    }
  } else if (variableType == 'Array String') {
    // 数组字符串
    if (!Array.isArray(value)) {
      errorStr = '当前默认数据格式不正确，应为数组字符串，例: ["张三","李四"]';
    } else {
      const i = value.findIndex((vl) => typeof vl === 'object');
      if (i > -1) {
        errorStr = `数据索引${i}数据格式不正确，应为字符串、布尔或数字`;
      } else {
        visiable.defaultValue = value; // 设置默认值
      }
    }
  } else if (variableType == 'Array Object') {
    // 数组对象
    if (!Array.isArray(value)) {
      errorStr = '当前默认值数据格式不正确，应为数组对象 Array Object！';
    } else {
      const i = value.findIndex((vl) => typeof vl !== 'object' || Array.isArray(vl));
      if (i > -1) {
        errorStr = `数据索引${i}数据格式应为string`;
      } else {
        visiable.defaultValue = value; // 设置默认值
      }
    }
  } else if (variableType == 'Object') {
    // 对象
    if (typeof value === 'object' && !Array.isArray(value)) {
      visiable.defaultValue = value; // 设置默认值
    } else {
      errorStr = '当前默认值数据不正确，应为对象结构！';
    }
  } else if (variableType == 'all') {
    // 随意数据
    visiable.defaultValue = value; // 设置默认值
  }
  return errorStr;
};

window.setStoreData = setStoreData; // 不能在沙箱隔离的微应用环境中使用
window.getDataByKey = getDataByKey; // 不能在沙箱隔离的微应用环境中使用

export { setStoreData, getDataByKey, mapDataToComp, removeDataToComp, initDataByDefault, setStoreProps };
