import { post, get, del, put, postFormData } from '@/services/xhr/fetch';

const SCREEN_LIST_URL = '/api/datai/big-screen/getList';
const SCREEN_CREATE_URL = '/api/datai/big-screen/create';
const SCREEN_UPDATE_URL = '/api/datai/big-screen/update';
const SCREEN_DELETE_URL = '/api/datai/big-screen/del';

// 原有的 API（根据 ServiceStore.ts 中的调用）
const GETLISTOBJECT_URL = '/api/datai/screen/getListObject';
const CREATEPAGEPATH_URL = '/api/datai/screen/createPagePath';
const UPLOADFILE_URL = '/api/datai/screen/uploadFile';
const UPLOADFILES_URL = '/api/datai/screen/uploadFiles';
const GETLAYERCONFIG_URL = '/api/datai/screen/getLayerConfig';
const DELETEEDITLAYER_URL = '/api/datai/screen/deleteEditLayer';
const GETBYID_URL = '/api/datai/screen/getById';
const UPDATELAYERCONFIG_URL = '/api/datai/screen/updateLayerConfig';
const ADDITEM_URL = '/api/datai/screen/addItem';
const POSTPAGEPREVIEWIMGURL_URL = '/api/datai/screen/postPagePreviewImg';
const UPDATELAYERPREIMAGE_URL = '/api/datai/screen/updateLayerPreImage';

export const GET_SCREEN_LIST = (params) => {
  return get(SCREEN_LIST_URL, params);
};

export const CREATE_SCREEN = (data) => {
  return post(SCREEN_CREATE_URL, data);
};

export const UPDATE_SCREEN = (data) => {
  return post(SCREEN_UPDATE_URL, data);
};

export const DELETE_SCREEN = (screenId, params) => {
  return get(`${SCREEN_DELETE_URL}/${screenId}`, params);
};

// 以下是原有的 API（恢复）
export const GETLISTOBJECT = (data) => {
  return get(GETLISTOBJECT_URL, data);
};

export const CREATEPAGEPATH = (data) => {
  return post(CREATEPAGEPATH_URL, data);
};

export const UPLOADFILE = (data) => {
  return postFormData(UPLOADFILE_URL, data);
};

export const UPLOADFILES = (data) => {
  return postFormData(UPLOADFILES_URL, data);
};

export const GETLAYERCONFIG = (data) => {
  return get(GETLAYERCONFIG_URL, data);
};

export const DELETEEDITLAYER = (data) => {
  return post(DELETEEDITLAYER_URL, data);
};

export const GETBYID = (data) => {
  return get(GETBYID_URL, data);
};

export const UPDATELAYERCONFIG = (data) => {
  return post(UPDATELAYERCONFIG_URL, data);
};

export const ADDITEM = (data) => {
  return post(ADDITEM_URL, data);
};

export const POSTPAGEPREVIEWIMGURL = (data) => {
  return post(POSTPAGEPREVIEWIMGURL_URL, data);
};

export const UPDATELAYERPREIMAGE = (data) => {
  return post(UPDATELAYERPREIMAGE_URL, data);
};
