import $ from 'jquery';
import Cookies from 'js-cookie';
import { message } from 'antd';
import { setSpaceIdHeader } from '@/utils/BrowserUtils';

const GET_INFO_BY_ID_URL = '/page/infoHistory/v1/queryBigScreenInfoForPreview'; // queryBigScreenInfo没有做缓存
const GET_CATEGORY_LIST_URL = '/page/version/v1/queryVersionInfoList';
const GET_CARD_INFO_BY_ID_URL = '/page/card/v1/selectSysCard';
const GET_MARKET_CARD_INFO = '/page/cardManage/v1/selectCustomCardCodeJs';
const GET_CARD_INFO_BY_UID_URL = '/page/card/v1/selectSysCardByCardId'; // 新增接口，跨屏迁移ID保持不变
const GET_CONFIG = '/page/storage/v1/getConfig'; // 获取桶名和租户
const GET_LAYERINFO_URL = '/page/layer/v1/selectLayerByLayerUid'; // 查询图层配置信息
const GET_CONFIG_INFO = '/page/config/v1/configInfo'; // 获取开关信息
const GET_SYSLAYERLIST_BY_ID = '/page/layer/v1/querySysLayerListByBatchId'; // 获取业务图层
const GET_SDK_VERSION_INFO = '/page/version/v1/sdkVersionInfo'; // 获取版本信息
const GET_APP_PAGE_INFO = '/page/app/page/v1/info'; // 查询页面信息
const APP_PAGE_OLD_PAGE_TO_APP = '/page/app/page/v1/oldPageToApp'; // 旧页面转成应用

export const ajax = ({ url, type, data = {}, config = { contentType: 'application/x-www-form-urlencoded' } }) => {
  let extConfig = setSpaceIdHeader();
  return $.ajax({
    url: window.requestPrefix + url,
    type: type || 'get',
    contentType: config.contentType,
    headers: {
      ...extConfig.headers,
    },
    data: data,
    // beforeSend: function (request) {
    //   request.setRequestHeader('token', getToken());
    // },
    error: function (xhr) {
      if (xhr.status == 401) {
        const isPreviewPath = window.location.pathname.startsWith('/preview/') || window.location.pathname.startsWith('/pre.');
        if (!isPreviewPath) {
          Cookies.remove('token');
          window.location.href = '/' + '?redirect=' + encodeURIComponent(window.location.href); // 跳转到根路径
        } else {
          console.log('预览模式：忽略401错误');
        }
      }
    },
    complete: function (XMLHttpRequest) {
      var response = XMLHttpRequest.responseText;
      try {
        var res = JSON.parse(response);
        if (res.code == 0 || res.code == 200) {
          return res.data;
        } else if (res.code == 401) {
          const isPreviewPath = window.location.pathname.startsWith('/preview/') || window.location.pathname.startsWith('/pre.');
          if (!isPreviewPath) {
            Cookies.remove('token');
            window.location.href = '/' + '?redirect=' + encodeURIComponent(window.location.href); // 跳转到根路径
          } else {
            console.log('预览模式：忽略401错误');
          }
        } else if (res.code != '10001006') {
          message.error(res.msg || res.message || response.message);
        }
      } catch (e) {}
    },
  });
};

/**
 *
 * @param {根据id}获取要渲染的界面组件信息 id
 */
export function getInfoById(id, version) {
  return ajax({
    url: GET_INFO_BY_ID_URL,
    data: {
      pageId: id,
      version,
      share: sessionStorage.share, // 是否是分享链接访问
    },
  });
}

export function getLayerInfoById(id) {
  return ajax({
    url: GET_LAYERINFO_URL,
    data: {
      layerUid: id,
    },
  });
}

export function getCardInfoById(id) {
  return ajax({
    url: GET_CARD_INFO_BY_ID_URL,
    data: {
      sysCardId: id,
    },
  });
}

// 查询卡片集市中的卡片配置信息
export function getMarketCardInfoById(id) {
  return ajax({
    url: GET_MARKET_CARD_INFO,
    data: {
      id,
    },
  });
}

// 版本升级后，新建卡片的查询都走这里
export function getCardInfoByUid(id) {
  return ajax({
    url: GET_CARD_INFO_BY_UID_URL,
    data: {
      sysCardId: id,
    },
  });
}

/**
 *
 * @param {根据id 获取当前页面配置 hook 代码} pageId
 */
export function getHookJsonSettings(appId, appPageId, version) {
  const URL = `/page/app/page/hook/v1/info`;
  return ajax({
    url: URL,
    data: {
      appId,
      appPageId,
      version,
    },
  }).then((rs) => {
    if (rs.code == 200) {
      window.hookSaveAble = true;
    } else {
      message.error('获取脚本失败！');
    }
    return rs;
  });
}

export function getConfig() {
  return ajax({
    url: GET_CONFIG,
  });
}

export function getConfigInfo() {
  return ajax({
    url: GET_CONFIG_INFO,
  });
}

export function getSysLayerListByBatch() {
  return ajax({
    url: GET_CONFGET_SYSLAYERLIST_BY_IDIG_INFO,
  });
}

/**
 * @param {批量获取业务图层} layerUidList
 */
export const getSysLayerListByBatchID = (data) => {
  let params = '';
  data.forEach((item) => {
    params = params.length > 0 ? params + '&' : params;
    params = params + 'layerUidList=' + item;
  });
  return ajax({
    url: GET_SYSLAYERLIST_BY_ID,
    type: 'POST',
    data: params,
  });
};

export const getSDKVersion = () => {
  return ajax({
    url: GET_SDK_VERSION_INFO,
  });
};

// 获取应用中页面的信息
export const getAppPageInfo = (data = {}) => {
  return ajax({
    url: GET_APP_PAGE_INFO,
    data,
  });
};

// 旧页面转成应用
export const oldPageToApp = (data = {}) => {
  return ajax({
    url: APP_PAGE_OLD_PAGE_TO_APP,
    type: 'POST',
    data: JSON.stringify(data),
    config: {
      contentType: 'application/json',
    },
  });
};

// 生成链接
export const getShareGeneral = (id, data) => {
  return ajax({
    url: '/page/share/general/' + id,
    data,
  });
};
