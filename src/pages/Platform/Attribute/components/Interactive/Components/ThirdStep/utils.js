import { isPlainObject } from 'lodash';
import { getDataset, getCategory } from '@/utils/common';

/**
 * 获取组件接口数据的所有字段和字段描述
 * @param {object} comp 组件实例
 * @param {object} screenConfig screenConfig配置
 * @returns
 */
export const getOriginalDataFields = (comp, screenConfig) => {
  const dynamicApis = (screenConfig.dynamicApis || []).filter((api) => isPlainObject(api));
  let resultMetadata = {};

  const options = [];
  const { classType } = comp;
  const dataset = getDataset(comp);
  // v8.6.0处理无dataset组件
  if (!dataset) {
    return [];
  }
  const category = getCategory(dataset, classType);
  const isDynamic = category === 'dynamic' || category === 'indicator';
  if (isDynamic && dynamicApis.length > 0) {
    const dynamic = dataset[category];
    const foundApi = dynamicApis.find((api) => api.id === dynamic.source.id);
    if (foundApi && foundApi.apiInfo.resultMetadata) {
      resultMetadata = foundApi.apiInfo.resultMetadata;
    }
  }

  if (dataset && dataset._originalData?.[0] && isDynamic) {
    const firstRow = dataset._originalData[0];
    const fields = Object.keys(firstRow);
    fields.forEach((field) => {
      const label = resultMetadata[field] ? `${field}(${resultMetadata[field]})` : field;
      options.push({ label, value: `#${field}`, isOriginal: true });
    });
  }
  return options;
};

// 将组件数据选项进行分组
export const groupDataItemOptions = (compDataItemOptions) => {
  const options = [];
  const apiOptions = [];
  compDataItemOptions.forEach((item) => {
    if (item.isOriginal) {
      apiOptions.push(item);
    } else {
      options.push(item);
    }
  });
  if (apiOptions.length === 0) return options;
  return [
    {
      label: '属性映射',
      options,
    },
    {
      label: '接口数据',
      options: apiOptions,
    },
  ];
};
