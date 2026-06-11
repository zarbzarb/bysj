import { CompEvent, PageEventType } from '@/staticJson/PageEvent';

export const BlackListWhenHomePage = new Set([
  'Hooks 执行前',
  'Hooks 执行后',
  '创建后',
  'listenVariable',
  'listenBrowserEvent',
  '监听浏览器事件',
] as const) satisfies Set<PageEventType | CompEvent['eventType']>;

export const BlackListWhenSubPage = new Set([
  'Hooks 执行前',
  'Hooks 执行后',
  '创建后',
  'listenVariable',
  'listenBrowserEvent',
  '监听浏览器事件',
] as const) satisfies Set<PageEventType | CompEvent['eventType']>;
