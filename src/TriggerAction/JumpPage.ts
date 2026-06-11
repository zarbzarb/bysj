import { writeCacheToSessionStorage } from '@/utils/utils';

import { validateWithConditions } from '@/utils/common';

import { ActionGroup, PageEvents } from '@/staticJson/PageEvent';

// eslint-disable-next-line import/no-cycle
import TriggerAction from '@/TriggerAction';

import shortUUID from 'short-uuid';

const writeActions = (appPageId, settings) => {
  const { actions = [], config } = settings;

  const pageEvents: PageEvents = config?.pageEvents ?? {};

  const curIndex = actions.findIndex((action) => {
    return action.actionType === 'jumpPage' && action.actionSettings.appPageId === appPageId;
  });

  const pageJumpActionGroups =
    Object.entries(pageEvents)
      .find(([, { eventType }]) => eventType === '跳转页面后')?.[1]
      ?.groups?.filter(({ conditions }) => validateWithConditions(conditions)) ?? [];
  const remainderActionGroups: ActionGroup[] = [];

  if (curIndex >= 0)
    remainderActionGroups.push({
      key: shortUUID.generate().toString(),
      actions: actions.slice(curIndex + 1),
      conditions: [],
    });
  if (pageJumpActionGroups.length > 0) {
    remainderActionGroups.push(...pageJumpActionGroups);

    if (!settings.events) settings.events = [];

    settings.events.push({ groups: pageJumpActionGroups, eventType: '跳转页面后' });
  }

  if (remainderActionGroups.length <= 0) return;

  const key = `appPageId_${appPageId}_router`;

  const cacheData = {
    settings,
    remainderActionGroups,
  };

  writeCacheToSessionStorage(key, cacheData);
};

export default (action, settings) => {
  if (window.DataI.isConfigPage()) {
    return;
  }
  const {
    actionSettings: { target, url, appPageId },
  } = action;

  const urlReg = /^https?:\/\/(.*)/;

  (() => {
    const events: PageEvents = settings?.config?.pageEvents;

    if (!events) return;

    Object.entries(events)
      .find(([, { eventType }]) => eventType === '跳转页面前')?.[1]
      .groups.filter(({ conditions }) => validateWithConditions(conditions))
      .flatMap(({ actions }) => actions)
      .filter((act) => act.actionType !== 'jumpPage')
      .forEach((act, _i, actions) => TriggerAction(act, { events, config: window.screenConfig, actions }));
  })();

  // v7.4跳转页面
  switch (target) {
    case '_self': {
      // v7.8 新增
      if (url?.includes('/pre.html') && url?.includes('type=page') && url?.includes('id=')) {
        // 如果是大屏页面则 replaceState
        try {
          if (urlReg.test(url)) {
            window.history.replaceState({ target: '_self' }, null, url);
          } else {
            const targetURL = `${window.location.origin}${url}`;
            window.history.replaceState({ target: '_self' }, null, targetURL);
          }
        } catch {
          window.location.href = url;
        }
      } else {
        window.location.href = url;
      }
      break;
    }
    case '_router': {
      const prevPageId = window.screenConfig.pageId;
      const nextPageId = appPageId;
      // console.info(`上一个页面: ${prePageId}, 下一个页面: ${nextPageId}`);
      if (prevPageId === nextPageId) return;

      // v8.2.1保存交互事件存入缓存
      writeActions(appPageId, settings); // REVIEW zengwei 写缓存可以异步操作
      window.globalEventEmitter.emit('changeSubPage', { prevPage: { prevPageId }, nextPage: { nextPageId } });
      break;
    }
    default: {
      const newWindow = window.open(url);
      newWindow && newWindow.sessionStorage.clear();
    }
  }
};
