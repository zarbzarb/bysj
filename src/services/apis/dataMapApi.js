import { get, post, postFile } from '@/services/xhr/fetch';

const SAVE_DATA_MAP_URL = '/api/datai/big-screen/addBigScreenMappingJs';

export const ADDDATAMAPINFO = (data = {}) => {
  return post(SAVE_DATA_MAP_URL, data);
};

// 获取业务图层列表
export const getSysLayerList = (data = {}) =>
  post('/api/page/layer/v1/querySysLayerList', {
    currentPage: 1,
    pageSize: 500,
    ...data,
  });

// 获取业务图层分类
export const getCustomSortList = (data) => get('/api/page/customSort/v1/queryCustomSortList', data);

// 批量获取业务图层列表
export const getSysLayerListByBatch = (data) => {
  let params = '';
  data.forEach((item) => {
    params = params.length > 0 ? params + '&' : params;
    params = params + 'layerUidList=' + item;
  });
  return post('/api/page/layer/v1/querySysLayerListByBatchId' + '?' + params);
};

export const getSysLayerListByBatchId = (data) => {
  let formData = new FormData();
  data.forEach((item) => {
    formData.append('layerUidList', item);
  });
  return postFile('/api/page/layer/v1/querySysLayerListByBatchId', formData);
};

//模糊搜索要素
export const queryGisByEs = (data) => {
  let param = Object.assign({}, { returnFields: true, returnGeometry: true, pageNum: 1, pageSize: 20 }, data);
  return post('/api/gis/api/features/queryByEs', param);
};
