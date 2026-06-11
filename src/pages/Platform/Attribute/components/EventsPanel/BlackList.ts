import { CompEvent, PageEventType } from '@/staticJson/PageEvent';

export const BlackListWhenHomePage = new Set(['跳转页面前', '跳转页面后']) satisfies Set<
  PageEventType | CompEvent['eventType']
>;

export const BlackListWhenSubPage = new Set([]) satisfies Set<PageEventType | CompEvent['eventType']>;

export const listenBrowserEventConfig = {
  browserEventType: undefined,
  isOrigin: 0,
  originUrl: [
    {
      updateType: 1,
      inputVal: undefined,
      compKey: undefined,
      compDataItem: undefined,
      compDataItemOptions: [],
      variableKey: undefined,
    },
  ],
};
