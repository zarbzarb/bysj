import { get, post } from '@/services/xhr/fetch';

const ADD_FONT_URL = '/api/page/app/font/v1/upload';

const DEL_FONT_URL = '/api/page/app/font/v1/delete';

const GET_FONT_URL = '/api/page/app/font/v1/list';

export const UPLOADFONT = (data = {}) => {
  return post(ADD_FONT_URL, data);
};

export const GETFONTLIST = (data) => {
  return get(`${GET_FONT_URL}`, data);
};

export const DELETEFONT = (id) => {
  return post(`${DEL_FONT_URL}/${id}`);
};
