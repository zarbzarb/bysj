import { Actions as ActionsList, EventType as CompEventList } from './AnimationComponentsList';

export const EventsList = {
  'Hooks 执行前': {
    once: true,
  },
  'Hooks 执行后': {
    once: true,
  },
  创建后: {
    once: true,
  },
  跳转页面前: {
    once: true,
  },
  跳转页面后: {
    once: true,
  },
  监听浏览器事件: {
    once: true,
  },
} as const;

export type EventsCollection = PageEvents | CompEvents | PageEvent[] | CompEvent[];

export type PageEvents = {
  [Key: string]: PageEvent;
};

export type CompEvents = {
  [Key: string]: CompEvent;
};

export type ActionGroup = Extensions<{
  key: string;
  actions: Actions;
  conditions: {
    [K: AnyKey]: any;
  }[];
}>;

export interface PageEvent {
  eventType: PageEventType;
  isActive: boolean;
  customName?: string;
  groups: ActionGroup[];
  activeIdx: number;
  [K: AnyKey]: any;
}

export interface CompEvent {
  eventType: (typeof CompEventList)[number]['value'];
  eventKey: string;
  isActive: boolean;
  customName: string;
  groups: ActionGroup[];
  activeIdx: number;
  [K: AnyKey]: any;
}

export type Actions = Action[];

export interface Action {
  actionType: ActionType;
  actionName: string;
  isActive: boolean;
  actionKey: string;
  actionSettings: {
    [Key: string]: any;
  };
}

export type ActionType = (typeof ActionsList)[number]['value'];

export type PageEventType = keyof typeof EventsList;
