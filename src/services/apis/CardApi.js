import { get, post } from '@/services/xhr/fetch';

const GET_CATEGORY_URL = '/api/page/customSort/v1/queryCustomSortList'; // 请求自定义卡片分类列表

const ADD_CARD_URL = '/api/page/card/v1/saveOrUpdateSysCard';

const UPDATE_CARD_JSON_URL = '/api/page/card/v1/updateSysCardConfig'; // 保存自定义的卡片配置

const UPDATE_MARKET_CARD = '/api/page/cardManage/v1/saveCustomCardJs'; // 保存卡片集市中的卡片配置

const CARD_LIST_URL = '/api/page/card/v1/querySysCardListPage'; // 请求自定义卡片列表

const CARD_INFO_BYID_URL = '/api/page/card/v1/selectSysCard'; // 请求自定义卡片的详情

const CARD_INFO_BYUID_URL = '/api/page/card/v1/selectSysCardByCardId'; // 新增请求自定义卡片的详情接口，跨屏迁移ID保持不变

const MARKET_CARD_INFO = '/api/page/cardManage/v1/selectCustomCardCodeJs'; // 请求卡片集市中的卡片详情

const CARD_PREVIEW_IMG_URL = '/api/page/card/v1/uploadCardPreviewImg'; // 保存自定义卡片的封面图

const MARKET_CARD_PREVIEW_IMG = '/api/page/cardManage/v1/uploadCardPreviewImg'; // 保存卡片集市中的卡片封面图

const FILE_COPY_URL = '/api/page/storage/v1/cpResource'; // 卡片提交相关的Storage资源迁移

const CUSTOM_CAED_MARKET = '/api/page/cardManage/v1/queryCustomCardManageList'; // 请求卡片集市分类列表

const SAVE_UE_CARD = '/api/page/card/v1/saveUeScutcheonCard'; // 保存UE标牌

/**
 *
 * @param {获取所有卡片分类信息} data
 */
// 卡片集市
export const CUSTOMCAEDMARKETLIST = (data = {}) => {
  return post(CUSTOM_CAED_MARKET, data);
};

export const UPDATEMARKETCARD = (data = {}) => {
  return post(UPDATE_MARKET_CARD, data);
};

export const GETCATEGORYLIST = (data = {}) => {
  return get(GET_CATEGORY_URL, data);
};

export const ADDCARDINFO = (data = {}) => {
  return post(ADD_CARD_URL, data);
};

export const UPDATECARDINFO = (data = {}) => {
  return post(UPDATE_CARD_JSON_URL, data);
};

// 自定义卡片集合
export const ALLCARDLIST = (data = {}) => {
  return post(CARD_LIST_URL, data);
};

export const CARDINFOBYID = (data = {}) => {
  return get(CARD_INFO_BYID_URL, data);
};

// 新增接口，跨屏迁移ID保持不变
export const CARDINFOBYUID = (data = {}) => {
  return get(CARD_INFO_BYUID_URL, data);
};

export const MARKETCARDINFOBYID = (data = {}) => {
  return get(MARKET_CARD_INFO, data);
};

export const CARDPREVIEWIMGURL = (data = {}) => {
  return post(CARD_PREVIEW_IMG_URL, data);
};

export const MARKETCARDPREVIEWIMGURL = (data = {}) => {
  return post(MARKET_CARD_PREVIEW_IMG, data);
};

export const FILECOPY = (data = {}) => {
  return post(FILE_COPY_URL, data);
};

export const SAVEUECARD = (data = {}) => {
  return post(SAVE_UE_CARD, data);
};
