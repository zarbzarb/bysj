import { get, post } from '@/services/xhr/fetch';
//根据源大屏id获取大屏发布信息
const GET_PUBLISH_INFO_URL = '/api/page/infoPublish/v1/selectBigScreenInfoPublish';
//根据发布的大屏id获取大屏发布信息
const GET_PUB_INFO_BY_PUB_SCR_URL = '/api/page/infoPublish/v1/getPubBigScreen';
//发布大屏
const PUBLISH_BIG_SCREEN_URL = '/api/page/infoPublish/v1/saveOrUpdateBigScreenInfoPublish';
const GET_IS_NEED_PASSWORD_URL = '/api/page/infoPublish/v1/getBigScreenInfoPublish';
//验证预览大屏访问密码
const VERIFY_ACCESS_PASSWORD_URL = '/api/page/infoPublish/v1/checkScreenPassword';
//预览获取发布的大屏信息
const GET_PUB_BIG_SCREEN_URL = '/api/page/infoPublish/v1/getPubBigScreen';
//预览获取发布的大屏js信息
const GET_PUB_BIG_SCREEN_JS_URL = '/api/page/hookPublish/v1/selectBigScreenHookPublish';
//预览获取发布的大屏数据资源信息
const LIST_PUB_DATA_RESOURCES_URL = '/api/page/dataPublish/v1/queryBigScreenDataPublishList';
// 发布版本
const RELEASE_VERSION_URL = '/api/page/infoHistory/v1/releaseVersion';
// 版本列表
const GET_VERSION_LIST_URL = '/api/page/infoHistory/v1/versionList';

export const GETPUBLISHINFO = (data = {}) => {
  return get(GET_PUBLISH_INFO_URL, data);
};

export const PUBLISHBIGSCREEN = (data = {}) => {
  return post(PUBLISH_BIG_SCREEN_URL, data);
};

export const GETISNEEDPASSWORD = (data = {}) => {
  return get(GET_IS_NEED_PASSWORD_URL, data);
};

export const VERIFYACCESSPASSWORD = (data = {}) => {
  return post(VERIFY_ACCESS_PASSWORD_URL, data);
};

export const GETPUBBIGSCREEN = (data = {}) => {
  return get(GET_PUB_BIG_SCREEN_URL, data);
};

export const GETPUBBIGSCREENJS = (data = {}) => {
  return get(GET_PUB_BIG_SCREEN_JS_URL, data);
};

export const LISTPUBDATARESOURCES = (data = {}) => {
  return get(LIST_PUB_DATA_RESOURCES_URL, data);
};

export const GETPUBINFOBYPUBSCR = (data = {}) => {
  return get(GET_PUB_INFO_BY_PUB_SCR_URL, data);
};

export const GET_VERSION_LIST = (data = {}) => {
  return get(GET_VERSION_LIST_URL, data);
};

export const POST_RELEASE_VERSION = (data = {}) => {
  return post(RELEASE_VERSION_URL, data);
};
