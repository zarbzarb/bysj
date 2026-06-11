import { useState, useEffect } from 'react';
import { message } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { isEqual, isPlainObject } from 'lodash';
import { getDataByKey } from '@/utils/dataStoreUtils';
import { TriggerRequest } from '@/TriggerAction/DataQueray';
import CompatibleTool from '@/pages/Platform/DataSource/Compatible';
// import ScreenConfigContext from '@/pages/Preview/Render/ScreenConfigContext';
import { babelTransform } from '@/utils/utils';

// antd 组件，获取数据的方法
export const useComponentConfigDataSource = (config, dataset, el) => {
  const { variable, expression, dynamic, indicator, defaultValue = [], _api, variableDataMap } = dataset;
  const { dynamicApis = [] } = config;
  let { category } = dataset;
  if (!category) {
    category = dataset.isVariable ? 'variableRef' : 'json';
  }

  const [value, _setValue] = useState([]);

  const setValue = useMemoizedFn((v, o) => {
    if (!isEqual(v, value)) {
      _setValue(v);
      dataset._data = v;
    }

    if (o) {
      // console.log({ o });
      dataset._originalData = o; // v8.6 保存接口原始数据
    }
  });

  useEffect(() => {
    let listenFn;
    // const screenConfig = toJS(config);
    if (category === 'variableRef') {
      // 引用变量
      if (variable) {
        const parseExpression = (data) => {
          if (expression && expression.trim().length > 0) {
            try {
              const str = expression || 'data';
              data = babelTransform(str, data); // 运行时ES6转ES5
              data = data === 0 || data ? data : []; // 变量值支持传0
              if (variableDataMap && Array.isArray(data)) {
                // v8.4 静态数据源支持属性映射
                const dimensionMap = variableDataMap.map((v) => ({ dataMapKey: v.field, col: v.mapField, row: v.row }));
                data = CompatibleTool.dataFieldMapArrayObject(
                  dimensionMap,
                  data,
                  el.type !== 'List' && el.type !== 'Table',
                  true,
                );
                // console.log({ data });
                setValue(data);
              } else {
                setValue(data);
              }
            } catch (error) {
              console.error('变量解析失败', error);
              setValue([]);
            }
          }
        };

        listenFn = (data) => {
          parseExpression(data);
        };
        const data = getDataByKey(variable); // 根据key获取全局变量的值
        parseExpression(data);
        window.globalEventEmitter.on(variable, listenFn); // 监听变量变换
      } else {
        setValue([]);
      }
    } else if (category === 'json') {
      // 静态数据源
      if (_api && Array.isArray(defaultValue)) {
        // v8.4 静态数据源支持属性映射
        const dimensionMap = _api.map((v) => ({ dataMapKey: v.field, col: v.mapField, row: v.row }));
        const data = CompatibleTool.dataFieldMapArrayObject(
          dimensionMap,
          defaultValue,
          el.type !== 'List' && el.type !== 'Table',
        );
        // console.log({ data });
        if (!isEqual(data, value)) {
          setValue(data);
        }
      } else {
        setValue(Array.isArray(defaultValue) ? [...defaultValue] : defaultValue ?? []);
      }
    } else if (category === 'dynamic') {
      // 动态数据源
      const { source, dimensionMap, data, originalData, interactDynamicParams, dataFromParent } = dynamic;
      if (el.isCustomListChild && dataFromParent) {
        // v8.5 自定义列表的子组件，直接使用父组件传递过来的数据，而不用发起请求
        const normalData = CompatibleTool.dataFieldMapArrayObject(dimensionMap, dataFromParent);
        console.log({ normalData });
        setValue(normalData);
        return;
      }
      // TODO 8.0 dynamicApis
      const apis = dynamicApis.filter((api) => isPlainObject(api));
      if (data) {
        delete dynamic.data;
        delete dynamic.originalData;
        // 防止dataset被深拷贝，增强删除(兼容3D饼图组件动态数据源使用)
        delete el.dataset.dynamic.data;
        delete el.dataset.dynamic.originalData;
        setValue(data, originalData);
        return;
      }
      const currentApi = apis.find((api) => api.id === source.id);
      if (!currentApi) {
        setValue([]);
        return;
      }
      const requestParam = {
        apiInfo: currentApi.apiInfo,
        contentType: currentApi.contentType, // v7-10-0 添加参数contentType
        paramList: source.params, // 使用组件自己配置过的参数
        headers: currentApi.headers,
        isLoop: source.repeat.on,
        apiMs: source.repeat.intervalTime,
      };
      // v7.9 用于区分走的刷新数据源交互
      if (interactDynamicParams) {
        requestParam.paramList = interactDynamicParams.params;
        requestParam.headers = interactDynamicParams.headers;
        requestParam.isLoop = false;
      }
      TriggerRequest(requestParam, (res) => {
        if (interactDynamicParams) {
          delete dynamic.interactDynamicParams;
        }
        if (res?.code === '403') {
          if (window.DataI.isConfigPage()) {
            message.warning(`${currentApi.interfaceName}接口已被禁用`);
          }
          return;
        }
        if (!Array.isArray(res)) {
          if (window.DataI.isConfigPage()) {
            message.warning(`${currentApi.interfaceName}数据不符合规范`);
          }
          return;
        }
        let normaldata = res;
        let rawData;
        if (!['CustomList', 'CustomCell'].includes(el.type)) {
          normaldata = CompatibleTool.dataFieldMapArrayObject(dimensionMap, res);
          rawData = CompatibleTool.filterDataset(dimensionMap, res);
        }
        console.log('normaldata==>', normaldata, { rawData });
        setValue(normaldata, rawData);
      });
    } else if (category === 'indicator') {
      // 指标数据源（v7.11 新增）
      const { source, dimensionMap, data, originalData } = indicator;
      const apis = dynamicApis.filter((api) => isPlainObject(api)); // TODO 8.0 dynamicApis
      if (data) {
        delete indicator.data;
        delete indicator.originalData;
        setValue(data, originalData);
        return;
      }
      const currentApi = apis.find((api) => api.id === source.id);
      if (!currentApi) {
        setValue([]);
        return;
      }
      const requestParam = {
        apiInfo: currentApi.apiInfo,
        contentType: currentApi.contentType, // v7-10-0 添加参数contentType
        paramList: source.params, // 使用组件自己配置过的参数
        headers: currentApi.headers,
        isLoop: source.repeat.on,
        apiMs: source.repeat.intervalTime,
      };
      // v7.9 用于区分走的刷新数据源交互
      if (dynamic.interactDynamicParams) {
        // NOTE: interactDynamicParams 只是一个临时变量，直接复用 dynamic 的
        requestParam.paramList = dynamic.interactDynamicParams.params;
        requestParam.headers = dynamic.interactDynamicParams.headers;
        requestParam.isLoop = false;
      }
      // console.log({ requestParam });
      TriggerRequest(requestParam, (res) => {
        if (dynamic.interactDynamicParams) {
          delete dynamic.interactDynamicParams;
        }
        if (res?.code === '403') {
          if (window.DataI.isConfigPage()) {
            message.warning(`${currentApi.interfaceName}接口已被禁用`);
          }
          return;
        }
        if (!Array.isArray(res)) {
          if (window.DataI.isConfigPage()) {
            message.warning(`${currentApi.interfaceName}数据不符合规范`);
          }
          return;
        }
        let normaldata = res;
        let rawData;
        if (!['CustomList', 'CustomCell'].includes(el.type)) {
          normaldata = CompatibleTool.dataFieldMapArrayObject(dimensionMap, res);
          rawData = CompatibleTool.filterDataset(dimensionMap, res);
        }
        setValue(normaldata, rawData);
      });
    }

    // eslint-disable-next-line consistent-return
    return () => {
      if (category === 'variableRef' && variable && listenFn) {
        window.globalEventEmitter.removeListener(variable, listenFn);
      }
    };
  }, [
    category,
    variable,
    expression,
    defaultValue,
    dynamic,
    indicator,
    _api,
    variableDataMap,
    el.type,
    setValue,
    dynamicApis,
  ]);

  return value;
};
