import { get } from '@/services/xhr/fetch';

// 高性能渲染数据分组
const UE_GROUP_LIST = '/api/page/gis/all/20010';

// 高性能渲染数据列表
const UE_DATA_LIST = '/api/page/gis/cim-platform/api/datamanager/ue4/pages';

// 高性能渲染分组数据 type=20010
export const GETUEGROUPLIST = () => {
  return get(`${UE_GROUP_LIST}`);
};

export const GETUEDATALIST = (data = {}) => {
  return get(UE_DATA_LIST, data);
};
