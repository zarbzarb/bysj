import { get, post } from '@/services/xhr/fetch';

const GET_CATEGORY_TREE_URL = '/api/page/category/v1/listCategoryInfoAndComponent';
const GET_CATEGORY_LIST_URL = '/api/page/version/v1/queryVersionInfoList';
const GET_BUCKET_LIST_URL = '/api/page/container/v1/queryContainerInfoList';
const GET_COMPONENT_LIST_URL = '/api/page/containerComponent/v1/listContainerComponent';
// const GET_LIST_URL = "/api/datai/version/getVersionStateList";
const ADD_ITEM_URL = '/api/datai/v1/image/store';
const DEL_ITEM_URL = '';
const UP_ITEM_URL = '';
const GET_BYID_URL = '/api/datai/v1/image/store/';
const TEXT_URL = '/api/datai/vm/componentVersion/findAll';
const GET_CATEGORY_COMPONENT_URL = '/api/page/categoryComponent/v1/listCategoryComponent';
const GET_CUSTOM_COMPONENT_URL = '/api/page/sandbox/v1/queryScreenSandboxList'; // 请求自定义组件列表
const GET_CONFIG_INFO = '/api/page/config/v1/configInfo'; // 获取开关信息
const GET_All_INFO = '/api/page/gis/groupSource/v1/getAllNew'; // 获取cim地图资源

export const GETCATEGORYTREE = (data = {}) => {
  return get(GET_CATEGORY_TREE_URL, data);
};

export const GETCATEGORYLIST = (data = {}) => {
  return get(GET_CATEGORY_LIST_URL, data);
};

export const GETBUCKETLIST = (data = {}) => {
  return post(GET_BUCKET_LIST_URL, data);
};

export const GETCOMPONENTLIST = (data = {}) => {
  return get(GET_COMPONENT_LIST_URL, data);
};

export const TEST = () => {
  return get(TEXT_URL, {});
};
// export const GETLIST = ( data ) => {
//     return get(GET_LIST_URL,data);
// }

export const ADDITEM = (data) => {
  return post(ADD_ITEM_URL, data);
};

export const UPITEM = (data) => {
  return post(UP_ITEM_URL, data);
};

export const DELITEM = (data) => {
  return post(DEL_ITEM_URL, data);
};

export const GETBYID = (id) => {
  return get(GET_BYID_URL + id, {});
};

export const GETCATEGORYCOMPONENT = (data) => {
  return get(GET_CATEGORY_COMPONENT_URL, data);
};

export const GETCUSTOMCOMPLIST = (data) => {
  return post(GET_CUSTOM_COMPONENT_URL, data);
};

export const GETCONFIGINFO = (data = {}) => {
  return get(GET_CONFIG_INFO, data);
};

export const GETAllINFO = (data = {}) => {
  return get(GET_All_INFO, data);
};
