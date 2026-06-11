/*
 * @Author: zengwei
 * @Date: 2022-12-15 22:16:20
 * @Last Modified by: zengwei
 * @Last Modified time: 2022-12-21 15:16:59
 */

import _ from 'lodash';
import { runInAction } from 'mobx';
import { Store } from '@/store';
import Command from './BaseCommand';

/**
 * 事件交互命令
 */
export default class InteractionCommand extends Command {
  constructor(comp, eventSettings) {
    super();

    this.isPage = comp?.isPage;
    this.comp = comp; // 组件
    this.source = _.cloneDeep(comp.eventSetings); // 组件更改前的交互信息
    this.eventSettings = eventSettings; // 组件修改的交互信息
  }

  static cmdType = 'InteractionCommand';

  execute() {
    const { eventSettings, comp } = this;

    if (this?.comp?.isPage) {
      const { setEventsCollection } = comp;

      runInAction(() => {
        setEventsCollection((evts) => {
          [...new Set([...Object.keys(evts), ...Object.keys(eventSettings)])].forEach((key) =>
            key in eventSettings ? (evts[key] = eventSettings[key]) : delete evts[key],
          );
        });
      });

      return;
    }

    this.comp.eventSetings = [...eventSettings];
  }

  undo() {
    const { source, comp } = this;

    if (this?.comp?.isPage) {
      const { setEventsCollection } = comp;

      runInAction(() => {
        setEventsCollection((evts) => {
          [...new Set([...Object.keys(evts), ...Object.keys(source)])].forEach((key) =>
            key in source ? (evts[key] = source[key]) : delete evts[key],
          );
        });
      });

      return;
    }

    this.comp.eventSetings = [...source];
  }
}
