import { post, get, del } from '@/services/xhr/fetch';

const GROUP_LIST_URL = '/api/datai/group/getList';
const GROUP_CREATE_URL = '/api/datai/group/addOrUpdate';
const GROUP_UPDATE_URL = '/api/datai/group/addOrUpdate';
const GROUP_DELETE_URL = '/api/datai/group/del';

export const GET_GROUP_LIST = () => {
  return get(GROUP_LIST_URL);
};

export const CREATE_GROUP = (data) => {
  return post(GROUP_CREATE_URL, data);
};

export const UPDATE_GROUP = (data) => {
  return post(GROUP_UPDATE_URL, data);
};

export const DELETE_GROUP = (data) => {
  return del(`${GROUP_DELETE_URL}/${data.id}`);
};
