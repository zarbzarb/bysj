import { get, post, postFormData } from '@/services/xhr/fetch';

// 新增子页面或文件夹
const APP_PAGE_ADD = '/api/page/app/page/v1/add';
// 删除子页面或文件夹
const APP_PAGE_DELETE = '/api/page/app/page/v1/delete';
// 查询子页面信息
const APP_PAGE_INFO = '/api/page/app/page/v1/info';
// 旧页面转成应用
const APP_PAGE_OLD_PAGE_TO_APP = '/api/page/app/page/v1/oldPageToApp';
// 查询页面配置列表
const APP_PAGE_PAGELIST = '/api/page/app/page/v1/pageList';
// 重命名子页面
const APP_PAGE_RENAME = '/api/page/app/page/v1/rename';
// 保存子页面
const APP_PAGE_SAVE = '/api/page/app/page/v1/save';
// 设置主页面
const APP_PAGE_SET_HOME_PAGE = '/api/page/app/page/v1/setHomePage';
// 设置主页面常驻
const APP_PAGE_SET_HOME_PAGE_RESIDENCY = '/api/page/app/page/v1/setHomePageResidency';
// 更新页面配置列表
const APP_PAGE_UPDATE_PAGELIST = '/api/page/app/page/v1/updatePageList';
// 页面导出
const APP_PAGE_EXPORT = '/api/page/sys-export-job/v1/create-sys-export-job';
// 页面复制
const APP_PAGE_COPY = '/api/page/app/page/v1/copy';

// 页面导入
export const APP_PAGE_IMPORT = '/api/page/app/page/v1/importAppPage';

// 查询信息
const APP_PAGE_HOOK_INFO = '/api/page/app/page/hook/v1/info';
// 新增或更新tab
const APP_PAGE_HOOK_SAVE_OR_UPDATE = '/api/page/app/page/hook/v1/saveOrUpdate';
// 删除tab
const APP_PAGE_HOOK_TAB_DELETE = '/api/page/app/page/hook/v1/tabDelete';
// 修改tab名称
const HOOK_UPDATE_TAB_NAME_URL = '/api/page/app/page/hook/v1/updateTabName';
// 修改tab顺序
const HOOK_UPDATE_TAB_ORDER_URL = '/api/page/app/page/hook/v1/updateTabOrder';

// 查询应用所有页面的信息
const GET_ALL_PAGEINFO = '/api/page/app/page/get/all/pageInfo';

const objToQueryParams = (obj) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    params.append(key, value);
  }

  return params.toString();
};

/**
 *
 * @param {获取所有卡片分类信息} data
 */
// 卡片集市
/**
 * "appId": 0,
 * "appPageId": 0,
 * "id": 0,
 * "jsonConfig": "string",
 * "name": "string",
 * "parentId": 0,
 * "type": 0
 */
export const addPageOrFolder = (data = {}) => {
  return post(APP_PAGE_ADD, data);
};

/**
 *
 * @param {*} data id
 * @returns
 */
export const deletePageOrFolder = (data = {}) => {
  const params = objToQueryParams(data);
  return post(`${APP_PAGE_DELETE}?${params}`);
};

/**
 *
 * @param {*} data id
 * @returns
 */
export const getPageInfo = (data = {}) => {
  return get(APP_PAGE_INFO, data);
};

/**
 *
 * @param {*} data
 * @returns
 */
export const oldPageToApp = (data = {}) => {
  return post(APP_PAGE_OLD_PAGE_TO_APP, data);
};

/**
 *
 * @param {*} appId
 * @returns
 */
export const getPageList = (appId, data = {}) => {
  return get(`${APP_PAGE_PAGELIST}/${appId}`, data);
};

/**
 *
 * @param {*} data
 * @returns
 */
export const renamePageOrFolder = (data = {}) => {
  const params = objToQueryParams(data);
  return post(`${APP_PAGE_RENAME}?${params}`);
};

/**
 *
 * @param {*} data
 * @returns
 */
export const savePage = (data = {}) => {
  return post(APP_PAGE_SAVE, data);
};

/**
 *
 * @param {*} data
 * @returns
 */
export const setHomePage = (data = {}) => {
  const params = objToQueryParams(data);
  return post(`${APP_PAGE_SET_HOME_PAGE}?${params}`);
};

/**
 *
 * @param {*} data
 * @returns
 */
export const setHomePageResidency = (data = {}) => {
  const params = objToQueryParams(data);
  return post(`${APP_PAGE_SET_HOME_PAGE_RESIDENCY}?${params}`);
};

/**
 *
 * @param {*} data
 * @returns
 */
export const updatePageList = (data = {}) => {
  const params = objToQueryParams(data);
  return post(`${APP_PAGE_UPDATE_PAGELIST}?${params}`);
};

/**
 * 导出页面
 * @param {*} data
 * @returns
 */
export const exportAppPage = (data = {}) => {
  return post(APP_PAGE_EXPORT, data);
};

/**
 * 复制页面
 * @param {*} id
 * @returns
 */
export const copyAppPage = (id) => {
  return post(`${APP_PAGE_COPY}/${id}`);
};

/**
 * 导入页面
 * @param {*} id
 * @returns
 */
export const importAppPage = (data) => {
  return postFormData(APP_PAGE_IMPORT, data);
};

// 大屏获得上传进度
export const getStatusFetch = (params) => get('/api/page/v1/bigscreen/getStatus', params);
/**
 * 查询页面hook信息
 * @param {*} data
 * @returns
 */
export const getPageHookInfo = (data = {}) => {
  return get(APP_PAGE_HOOK_INFO, data);
};

/**
 *
 * @param {*} data
 * @returns
 */
export const saveOrUpdateHook = (data = {}) => {
  return post(APP_PAGE_HOOK_SAVE_OR_UPDATE, data);
};

/**
 *
 * @param {*} data
 * @returns
 */
export const deleteTabHook = (data = {}) => {
  const params = objToQueryParams(data);
  return post(`${APP_PAGE_HOOK_TAB_DELETE}?${params}`);
};

export const updateTabNameHook = (data = {}) => {
  return post(HOOK_UPDATE_TAB_NAME_URL, data);
};

export const updateTabOrderHook = (data = {}) => {
  return post(HOOK_UPDATE_TAB_ORDER_URL, data);
};

/**
 * 查询应用所有页面的信息
 * @param {*} data
 * @returns
 */
export const getAllPageInfo = (data = {}) => {
  return get(GET_ALL_PAGEINFO, data);
};
