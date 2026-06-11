/**
 * 子页面渲染
 */
import { GetQueryString } from '@/utils/BrowserUtils';
import React, { useEffect, useState } from 'react';
import timer from '@/common/Dispatch/TimerTask';
import eventEmitter from '@/common/Dispatch/EventEmitterTask';
import Page from './HomePage';

interface SubPageProp {
  appType: string;
  appConfig: Record<string, string>;
  pageId: string;
  subPageId: string;
  isSdk: boolean;
  zIndex: number;
  [field: string]: any;
}

const SubPage = (props: SubPageProp) => {
  const EventEmitter = window.globalEventEmitter;
  const { subPageId } = props;
  const appPageId = GetQueryString('appPageId') || props.pageId;

  const [pageId, setPageId] = useState(appPageId || subPageId);
  const [isChangeSubPage, setIsChangeSubPage] = useState(!subPageId);

  const handleParamReplace = (key = 'subPageId', value) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set(key, value);
    const newSearch = searchParams.toString();
    const newPath = `${window.location.pathname}?${newSearch}`;
    window.history.replaceState({ target: '_router' }, '', newPath);
  };

  useEffect(() => {
    const {
      appConfig: { homePageId },
      isSdk,
    } = props;
    const listenFn = ({ nextPage: { nextPageId } }) => {
      if (!GetQueryString('appPageId') && !isSdk) {
        handleParamReplace('subPageId', nextPageId);
      }
      // 清除定时任务
      timer.removeAllTask(homePageId);
      // 清除事件监听器(hook中注册的)
      eventEmitter.removeAllEvents();
      setIsChangeSubPage(true);
      setPageId(nextPageId);

      (window as any).startTime = performance.now();
    };
    EventEmitter.on('changeSubPage', listenFn);
    return () => {
      EventEmitter.removeListener('changeSubPage', listenFn);
    };
  }, [pageId]);

  return pageId ? <Page {...props} pageId={pageId} isHome={false} isChangeSubPage={isChangeSubPage} /> : null;
};
export default SubPage;
