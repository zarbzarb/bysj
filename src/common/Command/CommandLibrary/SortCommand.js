/*
 * @Author: zengwei
 * @Date: 2022-12-07 17:42:24
 * @Last Modified by: zengwei
 * @Last Modified time: 2022-12-09 17:53:40
 */

import { MoveToTop, MoveToBottom, MoveToNext, MoveToPre } from '@/EventHandlers/ContextMenuEvent';
import Command from './BaseCommand';

export default class SortCommand extends Command {
  constructor(key, type, parentKey, optType) {
    super();
    this.key = key; // 选中组件key
    this.type = type; // 一级页面、组、动态面板、拖拽容器（地图标牌、自定义列表）
    this.parentKey = parentKey; // 父组key、动态面板key
    this.optType = optType; // 上移UpSeat、下移NextSeat、置顶ToTop、置底ToBottom
  }

  static cmdType = 'SortCommand';

  execute() {
    // console.log('SortCommand --> exec', this.key, this.type);
    switch (this.optType) {
      case 'UpSeat':
        MoveToPre(this.key, this.type, this.parentKey);
        break;
      case 'NextSeat':
        MoveToNext(this.key, this.type, this.parentKey);
        break;
      case 'ToTop':
        MoveToTop(this.key, this.type, this.parentKey);
        break;
      case 'ToBottom':
        MoveToBottom(this.key, this.type, this.parentKey);
        break;
      default:
        break;
    }
  }

  undo() {
    // console.log('SortCommand --> undo');
    switch (this.optType) {
      case 'UpSeat':
        MoveToNext(this.key, this.type, this.parentKey);
        break;
      case 'NextSeat':
        MoveToPre(this.key, this.type, this.parentKey);
        break;
      case 'ToTop':
        MoveToBottom(this.key, this.type, this.parentKey);
        break;
      case 'ToBottom':
        MoveToTop(this.key, this.type, this.parentKey);
        break;
      default:
        break;
    }
  }
}
