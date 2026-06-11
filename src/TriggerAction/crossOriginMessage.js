import { message } from 'antd';
import { getParamValue } from './utils';

export default (action, settings) => {
  const { targetType, appPageId, compKey, isTarget, targetUrl = [], sendData = [] } = action.actionSettings;

  const getParentOrigin = () => {
    let origin = '';
    if (window.parent !== window) {
      try {
        origin = window.parent.origin; // 跨域这个会执行失败
      } catch (error) {
        origin = new URL(document.referrer).origin; // 跨域会走这个
      }
    } else {
      origin = window.origin;
    }
    return origin;
  };

  if (targetType === 'iframe') {
    if (!compKey) return message.warning('跨源通讯没有选择目标组件');
    const iframeComp = window.DataI.getComponentByKey(compKey);
    if (!iframeComp) return console.error('跨源通讯目标组件没获取到');
    if (iframeComp.type !== 'IFrame') return message.warning('跨源通讯目标组件没有选择 IFrame 组件');
    let iframeLink = '';
    if (iframeComp.dataset._data?.[0]?.link) {
      iframeLink = iframeComp.dataset._data[0].link;
    } else {
      iframeLink = iframeComp.props.link;
    }
    if (!iframeLink) return message.warning('跨源通讯目标组件没有配置链接');
    const sendMessage = getParamValue(sendData[0], settings.el ?? settings.item, action);
    const targetOrigin = new URL(iframeLink).origin;
    if (isTarget) {
      const targetLinkStr = getParamValue(targetUrl[0], settings.el ?? settings.item, action);
      if (!targetLinkStr || targetLinkStr.indexOf(targetOrigin) === -1)
        return message.warning('跨源通讯目标源地址不匹配');
    }
    const targetWindow = document.getElementById(`iframe-${compKey}`).contentWindow;
    targetWindow.postMessage(sendMessage, targetOrigin);
  } else if (targetType === 'parent') {
    const sendMessage = getParamValue(sendData[0], settings.el ?? settings.item, action);
    const targetOrigin = getParentOrigin();
    if (isTarget) {
      const targetLinkStr = getParamValue(targetUrl[0], settings.el ?? settings.item, action);
      if (!targetLinkStr || targetLinkStr.indexOf(targetOrigin) === -1)
        return message.warning('跨源通讯目标源地址不匹配');
    }
    window.parent.postMessage(sendMessage, targetOrigin);
  }
};
