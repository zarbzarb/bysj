import { get, post } from '@/services/xhr/fetch';
const LOGIN_URL = '/api/sys/data/userInfo/login'; // 用户登录
const QUERY_BIGSCREEN_INFO_URL = '/api/page/infoHistory/v1/queryBigScreenInfo'; // 查询大屏配置
const SAVE_BIGSCREEN_INFO_URL = '/api/page/infoHistory/v1/saveBigScreenInfoHistory'; // 保存大屏配置
const GET_HOOK_URL = '/api/page/hook/v1/';
const SAVE_OR_UPDATE_HOOK_URL = '/api/page/hook/v1/saveOrUpdate'; // 更新大屏hook
const ADD_ANIMATION_URL = '/api/page/animation/v1/add';
const UPDATE_ANIMATION_URL = '/api/page/animation/v1/update';
const DELETE_ANIMATION_URL = '/api/page/animation/v1/delete/';
const GET_ANIMATION_URL = '/api/page/animation/v1/';
const QUERY_ANIMATION_LIST_URL = '/api/page/animation/v1/queryList';
const QUERY_ANIMATION_ENABLED_LIST_URL = '/api/page/animation/v1/queryEnabledList/';

export const LOGIN = (data) => {
  return post(LOGIN_URL, data);
};

export const QUERY_BIGSCREEN_INFO = (data) => {
  return get(QUERY_BIGSCREEN_INFO_URL, data);
};

export const SAVE_BIGSCREEN_INFO = (data) => {
  return post(SAVE_BIGSCREEN_INFO_URL, data);
};

export const GET_HOOK = (data) => {
  return get(`${GET_HOOK_URL}${data}`);
};

export const SAVE_OR_UPDATE_HOOK = (data) => {
  return post(SAVE_OR_UPDATE_HOOK_URL, data);
};

export const ADD_ANIMATION = (data) => {
  return post(ADD_ANIMATION_URL, data);
};

export const UPDATE_ANIMATION = (data) => {
  return post(UPDATE_ANIMATION_URL, data);
};

export const DELETE_ANIMATION = (data) => {
  return post(`${DELETE_ANIMATION_URL}${data}`);
};

export const GET_ANIMATION = (data) => {
  return get(`${GET_ANIMATION_URL}${data}`);
};

export const QUERY_ANIMATION_LIST = (data) => {
  return post(QUERY_ANIMATION_LIST_URL, data);
};

export const QUERY_ANIMATION_ENABLED_LIST = (data) => {
  return get(`${QUERY_ANIMATION_ENABLED_LIST_URL}${data}`);
};

// export const
