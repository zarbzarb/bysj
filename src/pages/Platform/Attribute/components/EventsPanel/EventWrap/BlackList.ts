import { PageEventType, ActionType, CompEvent } from '@/staticJson/PageEvent';
import { GetQueryString } from '@/utils/BrowserUtils';
import { merge } from 'lodash';

const CardBans = (() =>
  GetQueryString('type') === 'card' ? (['gisEventEmit'] as const) : [])() satisfies ActionType[];

const BlackListInBothPage = {
  /** 在这里添加事件禁止的动作的黑名单 */
  跳转页面前: ['jumpPage', 'sceneInteraction', ...CardBans],
  'Hooks 执行前': ['sceneInteraction', ...CardBans],
  'Hooks 执行后': ['sceneInteraction', ...CardBans],
  创建后: ['sceneInteraction', ...CardBans],
  跳转页面后: ['sceneInteraction', ...CardBans],
  click: ['sceneInteraction', ...CardBans],
  doubleClick: ['sceneInteraction', ...CardBans],
  changeValue: ['sceneInteraction', ...CardBans],
  initialization: ['sceneInteraction', ...CardBans],
  monitoringEvent: ['sceneInteraction', ...CardBans],
  listenVariable: ['sceneInteraction', ...CardBans],
  enterHandler: ['sceneInteraction', ...CardBans],
  tableRowClick: ['sceneInteraction', ...CardBans],
  tablePagination: ['sceneInteraction', ...CardBans],
  listPagination: ['sceneInteraction', ...CardBans],
  treeRowClick: ['sceneInteraction', ...CardBans],
  tableColumnClick: ['sceneInteraction', ...CardBans],
  mouseDrag: ['sceneInteraction', ...CardBans],
  blur: ['sceneInteraction', ...CardBans],
  mouseenter: ['sceneInteraction', ...CardBans],
  mouseleave: ['sceneInteraction', ...CardBans],
  clickSeries: ['sceneInteraction', ...CardBans],
  clickLegend: ['sceneInteraction', ...CardBans],
  createBefore: ['sceneInteraction', ...CardBans],
  createAfter: ['sceneInteraction', ...CardBans],
  destroyBefore: ['sceneInteraction', ...CardBans],
  destroyAfter: ['sceneInteraction', ...CardBans],
  beforeHide: ['sceneInteraction', ...CardBans],
  afterHidden: ['sceneInteraction', ...CardBans],
  beforeShowUp: ['sceneInteraction', ...CardBans],
  afterShowUp: ['sceneInteraction', ...CardBans],
  beforeDataChange: ['sceneInteraction', ...CardBans],
  afterDataChange: ['sceneInteraction', ...CardBans],
} as const satisfies {
  [K in PageEventType | CompEvent['eventType']]?: ActionType[];
};

export const BlackListWhenHomePage = merge(
  {
    创建后: [
      'updateData',
      'refreshDataSource',
      'animateSettings',
      'gisEventEmit',
      'visiableToggle',
      'createToggle',
      'fullScreen',
      'comSpecialAction',
      'videoInteraction',
      'sceneInteraction',
      'SetPramsAction',
      'remoteEvent',
    ],
  } as const,
  BlackListInBothPage,
) satisfies { [K in PageEventType | CompEvent['eventType']]?: ActionType[] };

export const BlackListWhenSubPage = merge(
  {
    'Hooks 执行前': ['jumpPage'],
    'Hooks 执行后': ['jumpPage'],
    创建后: ['jumpPage'],
    跳转页面后: ['jumpPage'],
  } as const,
  BlackListInBothPage,
) satisfies { [K in PageEventType | CompEvent['eventType']]?: ActionType[] };
