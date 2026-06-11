/*
 * @Author: zengwei
 * @Date: 2021-08-23 17:35:15
 * @Last Modified by: zengwei
 * @Last Modified time: 2023-05-12 00:10:47
 */
import $ from 'jquery';
import { matrixToArr, formatPosition } from '@/utils/analysis';
import _ from 'lodash';
import { Store } from '@/store/index';
import Command from './BaseCommand';

const getComponent = window.DataI.getComponentByKey;
const { editorStore, globalStore } = Store;

// 撤销同步框选的其他组件
const syncBatchUndoRect = (keys, undoRect) => {
  keys.forEach((key) => {
    const comp = getComponent(key);
    comp.styles.width = undoRect[key].width;
    comp.styles.height = undoRect[key].height;
    comp.styles.transform = undoRect[key].transform;
  });
};

const syncBatchRect = (keys, redoRect) => {
  keys.forEach((key) => {
    const comp = getComponent(key);

    comp.styles.width = redoRect[key].width;
    comp.styles.height = redoRect[key].height;
    comp.styles.transform = redoRect[key].transform;
  });
};
// 用于格式化并记录框选的组件初始状态和更新后状态
const formatCompRect = (keys) => {
  const undoRect = {};
  const redoRect = {};
  keys.forEach((key) => {
    const comp = getComponent(key);

    // 记录组件原始位置宽高信息,用于撤销操作
    const compStyles = _.cloneDeep(comp.styles);

    undoRect[key] = {
      width: compStyles.width,
      height: compStyles.height,
      transform: compStyles.transform,
    };

    const $el = $(`[data-key='${key}']`);
    let matrix = $el.css('transform');
    matrix = matrixToArr(matrix);

    const width = `${$el.width()}px`;
    const height = `${$el.height()}px`;
    const transform = `translate(${matrix[4]}px, ${matrix[5]}px)`;

    // 记录组件更新后状态
    redoRect[key] = {
      width,
      height,
      transform,
    };
  });
  return {
    undoRect,
    redoRect,
  };
};
/**
 * 拖动组件更新组件信息
 */
export default class DragAndMoveCommand extends Command {
  constructor(el, undoStyles, rect) {
    super();
    this.el = el;
    this.undoStyles = _.cloneDeep(undoStyles); // 选中组件初始状态
    this.rect = rect; // 选中组件的更新状态
    this.config = globalStore.screenConfig;
    this.otherKey = editorStore.changeKeys.filter((vl) => vl !== el.key); // 框选的其他组件key
    this.undoRect = formatCompRect(this.otherKey).undoRect; // 框选的其他组件初始状态,用于回退
    this.redoRect = formatCompRect(this.otherKey).redoRect; // 框选的其他组件更新状态,用于重做(撤销回退)
  }

  static cmdType = 'DragAndMoveCommand';

  execute() {
    // 执行数据更新

    if (this.otherKey.length > 0) {
      // 框选组件拖动
      syncBatchRect(this.otherKey, this.redoRect);
    }

    this.el.styles.width = `${this.rect.width}px`;
    this.el.styles.height = `${this.rect.height}px`;

    const position = formatPosition(this.rect.transform);

    if (this.config.isPC) {
      // PC模式兼容组件定位
      const { styles } = this.el;
      const { alignCenter, compPos, verticalPos, width, height } = styles;
      const wrap = $('[data-type="console"]');

      if (!alignCenter && compPos === 'right') {
        position[0] = Number.parseInt(wrap.width() - position[0] - Number.parseInt(width));
      }

      if (verticalPos === 'bottom') {
        position[1] = Number.parseInt(wrap.height() - position[1] - Number.parseInt(height));
      }
    }

    this.el.styles.transform = `translate(${position[0]}px, ${position[1]}px)`;

    // antd类型组件组件级刷新
    if (this.el.refresh) {
      this.el.refresh();
    }
  }

  // 选中组件撤销操作
  undo() {
    // 撤销数据更新
    if (this.otherKey.length > 0) {
      syncBatchUndoRect(this.otherKey, this.undoRect);
    }
    this.el.styles.width = this.undoStyles.width;
    this.el.styles.height = this.undoStyles.height;
    this.el.styles.transform = this.undoStyles.transform;

    // antd类型组件组件级刷新
    if (this.el.refresh) {
      this.el.refresh();
    }
  }
}
