import { get, post } from '@/services/xhr/fetch';

// 原领域分类
export const getSysCategory = (data) => get('/api/page/category/v1/querySelectSysCategory', data);

// 接口中心分类
export const postInterfaceCategory = (data) => post('/api/V1/category', data);

// 接口中心列表
export const getApiList = (data) => post('/api/query/interface/v1/queryIocInterfacePage', data);

// 接口中心列表
export const getInterfaceTree = (data) => get('/api/query/interface/v1/getInterfaceTree', data);

// 已关联到大屏的接口
export const getRelatedApiList = (data) => get('/api/query/interfaceFilter/v1/queryIocInterfaceFilterList', data);

// 新增已关联
export const addApiRelated = (data) => post('/api/query/interfaceFilter/v1/saveOrUpdateIocInterfaceFilter', data);

// 删除已关联
export const deleteApiRelated = (data) => post('/api/query/interfaceFilter/v1/deleteIocInterfaceFilter', data);

// 查询接口默认参数配置
export const getSourceApiInfo = (data) => get('/api/query/interface/v1/selectIocInterfaceByCode', data);

// 查询接口修改参数配置
export const getAipInterfaceFilter = (data) =>
  get('/api/query/interfaceFilter/v1/selectIocInterfaceFilterByApiCodeAndPageId', data);

// 批量新增已关联
export const addApiRelatedByList = (data) => post('/api/query/interfaceFilter/v1/batchSaveIocInterfaceFilter', data);

// 增加根据卡片唯一标识查询卡片ID
export const getIdbyUid = (data) => get('/api/page/card/v1/selectSysCardByParamId', data);
