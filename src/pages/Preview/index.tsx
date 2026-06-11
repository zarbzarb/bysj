import * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GetQueryString, rewriteHttpRequest, rewriteReplaceState } from '@/utils/BrowserUtils';
import AppRender from './AppRender';
import { ajax } from './ajax';

const AppLayout = (props) => {
  const { id, type } = props;
  const { screenId } = useParams<{ screenId: string }>();
  const appId = screenId || GetQueryString('id') || id;
  const appType = GetQueryString('type') || type || 'page';
  const pageId = GetQueryString('appPageId');
  const subPageId = GetQueryString('subPageId');
  const version = props.id ? props.version || 'major' : GetQueryString('version') || 'major';
  const shareKey = GetQueryString('key');
  const [validKey, setValidKey] = useState(true);
  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState(false);

  useEffect(() => {
    // 如果有分享 key，验证其有效性
    if (shareKey) {
      validateShareKey(shareKey, appId);
    } else {
      setLoading(false);
    }
  }, []);

  const validateShareKey = async (key, pageId) => {
    try {
      // 直接使用 fetch 调用验证接口，避免依赖未初始化的 window.requestPrefix
      const response = await fetch('/api/page/share/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, pageId }),
      });
      
      // 如果 HTTP 状态码不是 200，说明验证失败
      if (!response.ok) {
        handleInvalidKey();
        return;
      }
      
      const result = await response.json();
      
      // 检查验证结果：如果有 code 字段且不为成功状态，则验证失败
      // 成功状态可能是 code: 200, code: 0, code: 'success', code: 'ok' 等
      const successCodes = [200, 0, '200', '0', 'success', 'ok', 'SUCCESS', 'OK'];
      if (result && result.code !== undefined) {
        if (successCodes.includes(result.code)) {
          setValidKey(true);
          setLoading(false);
        } else {
          handleInvalidKey();
        }
      } else {
        // 如果没有 code 字段，默认认为验证通过（有些接口可能只返回成功消息）
        setValidKey(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('验证分享key失败:', error);
      // 如果验证接口失败（比如接口不存在），跳过验证继续加载
      setValidKey(true);
      setLoading(false);
    }
  };

  const handleInvalidKey = () => {
    setValidKey(false);
    setLoading(false);
    setValidationError(true);
    // 3秒后跳转到登录页面
    setTimeout(() => {
      window.location.href = '/?redirect=' + encodeURIComponent(window.location.href);
    }, 3000);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#0d1117'
      }}>
        <div style={{ color: '#fff', fontSize: '16px' }}>验证分享链接...</div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#0d1117'
      }}>
        <div style={{ color: '#ff4d4f', fontSize: '24px', marginBottom: '16px' }}>分享链接无效或已过期</div>
        <div style={{ color: '#8b949e', fontSize: '14px' }}>将在3秒后跳转到登录页面...</div>
      </div>
    );
  }

  if (appType === 'page' && !(window.history as any).rewriteReplaceState) {
    rewriteReplaceState();
    rewriteHttpRequest(!!props.id);
  }

  return (
    <AppRender
      id={appId}
      type={appType}
      appPageId={pageId}
      subPageId={subPageId}
      version={version}
      isSdk={props.id}
      {...props}
    />
  );
};

export default AppLayout;
