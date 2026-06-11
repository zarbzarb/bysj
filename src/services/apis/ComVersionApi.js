import { get, post } from '@/services/xhr/fetch';

const GET_ALL_VERSION_LIST_URL = '/-/verdaccio/search/';

const GET_ALL_PUBLISH_VERSION_URL = '/api/datai/version/getVersionInfo';
const PUBLISH_VERSION_URL = '/api/datai/version/addVersionInfo';

export const GETALLVERSIONLIST = (query = 'dataq-com-') => {
  return get(GET_ALL_VERSION_LIST_URL + query, {});
};

export const GETALLPUBLISHVERSION = (data = {}) => {
  return get(GET_ALL_PUBLISH_VERSION_URL, data);
};

export const PUBLISHVERSION = (data = {}) => {
  return post(PUBLISH_VERSION_URL, data);
};
