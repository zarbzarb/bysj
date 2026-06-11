import React, { lazy, Suspense, useEffect } from 'react';
import { Spin } from 'antd';
import { getImageUrl } from '@/utils/utils';
// import MonacoEditor from 'react-monaco-editor';
import MyErrorBoundary from './MyErrorBoundary';

const MonacoEditor = lazy(() => import(/* webpackPrefetch: true" */ 'react-monaco-editor'));

const styles = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#000 !important',
  color: '#fff',
};

const renderLoader = ({ height }) => (
  <div style={{ ...styles, height }}>
    <Spin size='small' />
  </div>
);

const renderError = ({ height }) => <div style={{ ...styles, height, color: '#f00' }}>加载失败，请刷新页面重试！</div>;

const LazyMonacoEditor = (props) => {
  useEffect(() => {
    // 手动加载 codicon 字体图标，以解决查找替换功能图标不显示问题
    const url = `${window.publicPath}libs/font/codicon.ttf`;
    const font = new FontFace('codicon', `url('${url}')`);
    document.fonts.add(font);
  }, []);

  return (
    <MyErrorBoundary fallback={renderError(props)}>
      <Suspense fallback={renderLoader(props)}>
        <MonacoEditor {...props} />
      </Suspense>
    </MyErrorBoundary>
  );
};

export default LazyMonacoEditor;
