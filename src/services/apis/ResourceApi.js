import { get, post } from '@/services/xhr/fetch';

const GET_SOURCE_LIST_URL = '/api/datai/dataResources/pageDataResources';
const ADD_DATA_RESOURCES_URL = '/api/datai/dataResources/addDataResources';
const REMOVE_DATA_RESOURCES_URL = '/api/datai/dataResources/removeDataResources';
const MODIFY_DATA_RESOURCES_URL = '/api/datai/dataResources/modifyDataResources';
const REQUEST_PROXY_URL = '/api/datai/proxy/request';
const REMOVE_ALL_DATA_RESOURCES_URL = '/api/datai/dataResources/removeDataResourcesByBigScreen';
const QUERY_DATA_CATEGORY_LIST_URL = '/api/dataSet/category/queryDataCategoryList';
const QUERY_DATA_SETS_LIST_URL = '/api/dataset/v1/dataSet/set/queryList';
const QUERY_DATA_SET_INFO_URL = '/api/dataSet/set/queryDataSetInfo';
// http://mid-dev.console.com/api/dataset/api/v1/dataSet/set/queryList

export const GETSOURCELIST = (data = {}) => {
  return get(GET_SOURCE_LIST_URL, data);
};
export const ADDDATARESOURCES = (data = {}) => {
  return post(ADD_DATA_RESOURCES_URL, data);
};

export const REMOVEALLDATARESOURCES = (data = {}) => {
  return post(REMOVE_ALL_DATA_RESOURCES_URL, data);
};

export const REMOVEDATARESOURCES = (data = {}) => {
  return post(REMOVE_DATA_RESOURCES_URL, data);
};
export const MODIFYDATARESOURCES = (data = {}) => {
  return post(MODIFY_DATA_RESOURCES_URL, data);
};

export const REQUESTPROXY = (data = {}) => {
  return get(REQUEST_PROXY_URL, data);
};

export const QUERYDATACATEGORYLIST = (data = {}) => {
  return get(QUERY_DATA_CATEGORY_LIST_URL, data);
};

export const QUERYDATASETSLIST = (data = {}) => {
  return post(QUERY_DATA_SETS_LIST_URL, data);
};

export const QUERYDATASETINFO = (data = {}) => {
  return post(QUERY_DATA_SET_INFO_URL, data);
};
