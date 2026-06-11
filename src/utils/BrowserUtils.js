import Cookies from 'js-cookie';

function GetQueryString(name) {
  const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`);
  const r = window.location.search.slice(1).match(reg);
  if (r != null) return unescape(r[2]);
  return null;
}

const setSpaceIdHeader = (config = { headers: {} }) => {
  const spaceId = GetQueryString('spaceId') || window.wutongNsKey;
  if (spaceId) {
    // v8.6： 如果传了空间信息请求头则用传的，否则用自己的
    config.headers.CLIENT_APP = config.headers.CLIENT_APP || 'WT';
    config.headers.CUSTOM_SESSION_DATA_WT_NS = config.headers.CUSTOM_SESSION_DATA_WT_NS || spaceId;
  }
  return config;
};

const setGwShareHeader = (headers = {}) => {
  if (sessionStorage.gwShareKey) {
    headers[sessionStorage.gwShareKey] = sessionStorage.gwShareVal;
  }
  return headers;
};

/**
 * 获取分享的 token
 * @returns
 */
const getGwShareCookie = () => {
  const allCookies = Cookies.get();
  const keys = Object.keys(allCookies);
  const gw = ['', ''];
  for (const key of keys) {
    if (key.startsWith('gw-share')) {
      gw[0] = key;
      gw[1] = allCookies[key];
      break;
    }
  }
  return gw;
};

/**
 * 清除分享相关的 sessionStorage
 */
const clearShareSessionStorage = () => {
  try {
    Cookies.remove(sessionStorage.gwShareKey);
  } catch {}
  sessionStorage.removeItem('share');
  sessionStorage.removeItem('gwShareKey');
  sessionStorage.removeItem('gwShareVal');
};

// 重写 replaceState
const rewriteReplaceState = () => {
  const { history } = window;
  const { replaceState } = history;
  history.replaceState = function (state) {
    replaceState.apply(history, arguments);
    if (typeof history.onreplacestate === 'function') {
      history.onreplacestate({ state });
    }
  };
  history.rewriteReplaceState = true;
};

/**
 * 重写 xhr， 存储 pending 请求和增加分享 token 请求头
 * @param {*} isSdk
 */
const rewriteHttpRequest = (isSdk = false) => {
  rewriteFetch(isSdk);
  if (window.XMLHttpRequest) {
    const oldXMLHttpRequest = window.XMLHttpRequest;
    // 重写
    window.XMLHttpRequest = function () {
      let xmlObj = new oldXMLHttpRequest();
      const originSend = xmlObj.send;
      const originOpen = xmlObj.open;
      xmlObj.open = function (...args) {
        if (args[1]) {
          this._url = args[1];
        }
        return originOpen.apply(this, args);
      };
      xmlObj.send = function (...args) {
        if (window.pendingXhrList) {
          window.pendingXhrList.push(this);
        } else {
          window.pendingXhrList = [this];
        }
        // v8.0 增加分享认证请求头
        if (
          sessionStorage.gwShareKey &&
          !isSdk &&
          (this._url.includes(window.location.origin) || this._url.startsWith('/') || this._url.startsWith('../')) // 同域
        ) {
          // 非 sdk 才加（布局页面是 sdk 引入它里面设置过，这里就不需要再加免得重复！）且同域（跨域不加）
          this.setRequestHeader(sessionStorage.gwShareKey, sessionStorage.gwShareVal);
        }
        const cb = () => {
          window.pendingXhrList = window.pendingXhrList.filter((item) => item !== this);
          xmlObj = null;
          this.removeEventListener('loadend', cb);
        };
        try {
          // 监听请求结束事件，移除已经结束的请求
          this.addEventListener('loadend', cb, false);
        } catch {}
        return originSend.apply(this, args);
      };
      return xmlObj;
    };
  }
};

/**
 * 重写 xhr， 增加分享 token 请求头
 * @param {*} isSdk
 */
const rewriteFetch = (isSdk) => {
  if (window.fetch) {
    const oldFetch = window.fetch;
    window.fetch = function (...args) {
      // v8.0 增加分享认证请求头
      // 判断url是否跨域，跨域就不需要加请求头
      const getNotCrossDomain = (_url) => {
        return _url.includes(window.location.origin) || _url.startsWith('/') || _url.startsWith('../');
      };
      if (sessionStorage.gwShareKey && args && !isSdk) {
        if (typeof args[0] === 'object' && args[0].url) {
          //参数是 Request 对象
          const notCrossDomain = getNotCrossDomain(args[0].url);
          if (notCrossDomain) {
            const url = args[0].url;
            args[0].headers.append(sessionStorage.gwShareKey, sessionStorage.gwShareVal);
            delete args[0].url;
            args[1] = { ...args[0] };
            args[0] = url;
          }
        } else {
          // 参数直接是 url
          const notCrossDomain = getNotCrossDomain(args[0]);
          if (notCrossDomain) {
            const o = { [sessionStorage.gwShareKey]: sessionStorage.gwShareVal };
            if (args[1]) {
              if (args[1].headers) {
                args[1].headers[sessionStorage.gwShareKey] = sessionStorage.gwShareVal;
              } else {
                args[1].headers = o;
              }
            } else {
              args[1] = {
                headers: o,
              };
            }
          }
        }
      }
      // 执行 fetch
      return oldFetch.apply(this, args);
    };
  }
};

/**
 *  取消 pending 中的请求
 */
const clearPendingXhrList = () => {
  if (window.pendingXhrList?.length) {
    window.pendingXhrList.forEach((xhr) => xhr.abort());
    window.pendingXhrList = [];
  }
};

export {
  GetQueryString,
  setSpaceIdHeader,
  setGwShareHeader,
  rewriteReplaceState,
  rewriteHttpRequest,
  clearPendingXhrList,
  getGwShareCookie,
  clearShareSessionStorage,
};
