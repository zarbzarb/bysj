import { get, post } from '@/services/xhr/fetch';

const GET_ANIMATION_LIST_URL = '/api/page/animation/v1/queryList';
const ADD_ANIMATION_URL = '/api/page/animation/v1/add';
const UPDATE_ANIMATION_URL = '/api/page/animation/v1/update';
const LOGIC_DELETE_URL = '/api/page/animation/v1/delete';
const GET_ANIMATION_DETAIL_URL = '/api/page/animation/v1';
const QUERY_ENABLED_LIST_URL = '/api/page/animation/v1/queryEnabledList';

export const GETANIMATIONLIST = (data = {}) => {
  return post(GET_ANIMATION_LIST_URL, data);
};

export const ADDANIMATION = (data = {}) => {
  return post(ADD_ANIMATION_URL, data);
};

export const UPDATEANIMATION = (data = {}) => {
  return post(UPDATE_ANIMATION_URL, data);
};

export const LOGICDELETE = (data = '') => {
  return post(`${LOGIC_DELETE_URL}/${data}`);
};

export const GETANIMATIONDETAIL = (data = '') => {
  return get(`${GET_ANIMATION_DETAIL_URL}/${data}`);
};

export const QUERYENABLEDLIST = (data = '') => {
  return get(`${QUERY_ENABLED_LIST_URL}/${data}`);
};
