/**
 *  为了快速获取加载页配置信息
 *  单独新建文件，通过 script 标签引入
 *  
 */

if (!String.prototype.startsWith) {
  Object.defineProperty(String.prototype, 'startsWith', {
    value: function (search, pos) {
      pos = !pos || pos < 0 ? 0 : +pos;
      return this.substring(pos, pos + search.length) === search;
    }
  });
}

function GetQueryString(name) {
  var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
  var r = window.location.search.substr(1).match(reg);
  if (r != null) return unescape(r[2]);
  return null;
}

// 获取指定名称的cookie
function getCookie(name) {
  var strcookie = document.cookie;//获取cookie字符串
  var arrcookie = strcookie.split("; ");//分割
  //遍历匹配
  for (var i = 0; i < arrcookie.length; i++) {
    var arr = arrcookie[i].split("=");
    if (name === 'gw-share' && arr[0].startsWith && arr[0].startsWith(name)) {
      return [arr[0], arr[1]];
    } else if (arr[0] == name) {
      return arr[1];
    }
  }
  return "";
}

const getImageUrl = (path) => {
  let imgUrl = path;
  // 支持多级目录部署
  if (
    imgUrl &&
    typeof imgUrl === 'string' &&
    imgUrl.indexOf('http://') === -1
  ) {
    if (imgUrl.indexOf('/assets') > -1) {
      // 使用默认图片
      imgUrl = imgUrl.replace('./', '/'); // 兼容处理
      imgUrl = window.publicPath + imgUrl;
      imgUrl = imgUrl.replace('//', '/'); // 去重
    } else if (
      imgUrl.indexOf('/iocoss') > -1 ||
      imgUrl.indexOf('/imageproxy') > -1
    ) {
      // 使用OSS图片或者走图片代理
      if (
        window.publicPath !== './' &&
        window.publicPath !== '/visual-console/' // 兼容SDK中使用
      ) {
        imgUrl = window.publicPath + imgUrl;
        imgUrl = imgUrl.replace('//', '/'); // 去重
      } else if (
        window.publicPath === './' ||
        window.publicPath === '/visual-console/' // 兼容SDK中使用
      ) {
        imgUrl = '../' + imgUrl;
        imgUrl = imgUrl.replace('//', '/'); // 去重
      }
      // 走图片代理的都去掉桶名兼容阿里云OSS
      if (imgUrl.indexOf('/imageproxy') > -1) {
        const pathReg = new RegExp(
          `(/imageproxy/[^\/]+/([^\/]+/).*)((screen|card|layer|custom)\/.+)`,
          'g'
        );
        const matches = pathReg.exec(imgUrl);
        if (matches && matches.length > 0) {
          let prefix = matches[1];
          const bucketPath = matches[2];
          const path = matches[3]; // 不带桶的路径
          prefix = prefix.replace(bucketPath, '');
          imgUrl = prefix + path;
        }
      }
    }
  }
  return imgUrl;
};

let loading = document.getElementById('i-loading');
const hideLoading = () => {
  if (!GetQueryString('error_code') && loading ) {
    if(GetQueryString('type') === 'card' && GetQueryString('share') === 'true') {
      return false
    }
    // // 展示分享错误页面不需要走这里
    if (GetQueryString('type') === 'page') {
      // 页面类型，优先使用 window.screenConfig 中的 loading 配置
      if (window.screenConfig && window.screenConfig.loading) {
        // 直接使用 screenConfig 中的 loading 配置
        const loadConfig = window.screenConfig.loading;
        if (loadConfig?.resetPageType) {
          const url = window.location.href;
          const regex = /&subPageId=[^&]*(?:&|$)/;
          const newUrl = url.replace(regex, '');
          if (url !== newUrl) {
            window.location.href = newUrl;
          }
        }
        loading.style.backgroundColor = loadConfig.backgroundColor || '#040C1F';
        loading.style.display = 'block';

        if (loadConfig.imgSrc) {
          const loadingImgEle = loading.querySelector('.loading-img');
          loadingImgEle.src = getImageUrl(loadConfig.imgSrc);
          loadingImgEle.style.display = 'block';
        } else {
          // 没有图片配置，则显示默认 css loading
          loading.querySelector('.loading-css-wrap').style.display = 'block';
        }
      } else if (window.fetch) {
        // 如果 screenConfig 还没有，则尝试从 queryBigScreenInfoForPreview 获取
        let pageId = GetQueryString('id') || (function() {
          var pathParts = window.location.pathname.split('/');
          for (var i = 0; i < pathParts.length; i++) {
            if (pathParts[i] === 'preview' && pathParts[i + 1]) {
              return pathParts[i + 1];
            }
          }
          return null;
        })();
        let version = GetQueryString('version') || 'major';
        const query = `pageId=${pageId}&version=${version}`;
        let init = { headers: {} };
        // v8.0 增加分享请求头
        if (GetQueryString('share')) {
          if (window.sessionStorage.gwShareKey) {
            init.headers[window.sessionStorage.gwShareKey] = window.sessionStorage.gwShareVal;
          } else {
            let arr = getCookie('gw-share');
            if (Array.isArray(arr)) {
              init.headers[arr[0]] = arr[1];
              window.sessionStorage.gwShareKey = arr[0];
              window.sessionStorage.gwShareVal = arr[1];
            }
          }
        }
        let spaceId = GetQueryString('spaceId') || window.wutongNsKey;
        if (!!spaceId) {
          init.headers['CLIENT_APP'] = 'WT';
          init.headers['CUSTOM_SESSION_DATA_WT_NS'] = spaceId;
        }
        // 获取配置信息（使用 queryBigScreenInfoForPreview）
        fetch(`../api/page/infoHistory/v1/queryBigScreenInfoForPreview?${query}`, init)
          .then(res => res.json())
          .then(data => {
            if (!window.screenConfig) {
              // 没有 window.screenConfig， 表示配置信息还没返回，此时才需要显示 loading
              if (data.code == '200' && data.data && data.data.jsonConfig) {
                try {
                  const configInfo = JSON.parse(data.data.jsonConfig);
                  const loadConfig = configInfo.screenConfig?.loading || { backgroundColor: '#040C1F' };

                  if (loadConfig?.resetPageType) {
                    const url = window.location.href;
                    const regex = /&subPageId=[^&]*(?:&|$)/;
                    const newUrl = url.replace(regex, '');
                    if (url !== newUrl) {
                      window.location.href = newUrl;
                    }
                  }
                  loading.style.backgroundColor = loadConfig.backgroundColor || '#040C1F';
                  loading.style.display = 'block';

                  if (loadConfig.imgSrc) {
                    const loadingImgEle = loading.querySelector('.loading-img');
                    loadingImgEle.src = getImageUrl(loadConfig.imgSrc);
                    loadingImgEle.style.display = 'block';
                  } else {
                    // 没有配置信息，则显示默认 css loading
                    loading.querySelector('.loading-css-wrap').style.display = 'block';
                  }
                } catch (e) {
                  console.error('解析配置失败:', e);
                  loading.style.display = 'block';
                  loading.querySelector('.loading-css-wrap').style.display = 'block';
                }
              } else {
                // 没有配置信息，则显示默认 css loading
                loading.style.display = 'block';
                loading.querySelector('.loading-css-wrap').style.display = 'block';
              }
            }
          })
          .catch(err => {
            console.error('获取配置信息失败:', err);
            // 出错时显示默认 loading
            loading.style.display = 'block';
            loading.querySelector('.loading-css-wrap').style.display = 'block';
          });
      } else {
        console.warn('当前浏览器版本不支持fetch，请升级');
        if (loading) {
          loading.style.display = 'block'
          loading.querySelector('.loading-css-wrap').style.display = 'block';
        };
      }
    } else if (loading) {
      loading.style.display = 'block';
      loading.querySelector('.loading-css-wrap').style.display = 'block';
    }
  }
}
hideLoading();


window.fontFamilyList = [
  { label: '微软雅黑', value: 'Microsoft Yahei' },
  { label: '宋体', value: 'SimSun' },
  { label: '黑体', value: 'SimHei' },
  { label: '隶书', value: 'LiSu' },
  { label: '幼圆', value: 'YouYuan' },
  { label: 'tahoma', value: 'tahoma' },
  { label: 'arial', value: 'arial' },
  { label: '思源字体', value: 'siyuan' },
  { label: '优设标准黑', value: 'yousebiaozhunhei' },
  { label: '阿里巴巴字体', value: 'alibaba' },
  { label: '胡晓波字体', value: 'huxiaobo' },
  { label: '阿里巴巴普惠体H', value: 'alibabapushiti' },
  { label: '液晶数字', value: 'digital' },
  { label: '造字工房版黑常规体', value: 'zaozigongfang' },
  { label: 'DIN', value: 'din' },
  { label: '庞门正道标题体2.0增强版', value: 'pangmenzhengdao' },
];