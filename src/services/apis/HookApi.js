import { get, post } from '@/services/xhr/fetch';

const SAVE_HOOK_URL = '/api/page/hook/v1/saveOrUpdate'; // 保存大屏hook

const GET_HOOK_URL = '/api/page/hook/v1';

export const SAVEHOOK = (data = {}) => {
  return post(SAVE_HOOK_URL, data);
};

export const GETHOOKBYSCREENID = (data) => {
  return get(`${GET_HOOK_URL}/${data}`);
};

// 单个tab删除
export const singleTabDelete = (data = {}) => {
  return post('/api/page/hook/v1/singleTab/delete', data);
};

// 单个tab保存
export const singleTabSaveOrUpdate = (data = {}) => {
  return post('/api/page/hook/v1/singleTab/saveOrUpdate', data);
};
