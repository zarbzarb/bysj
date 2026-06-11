import Command from './BaseCommand';

/**
 * 数据状态命令类(antd组件更新styles)
 */
export default class MoveCompsCommand extends Command {
  els: any[];

  coordsCompMap: { [k: string]: [number, number] };

  undoValue: { [k: string]: string };

  constructor(els: any[], coordsCompMap: { [k: string]: [number, number] }) {
    super();

    const undoValue = Object.fromEntries(els.map((el): [string, string] => [el.key, el.styles.transform]));

    this.els = els;
    this.coordsCompMap = coordsCompMap;
    this.undoValue = undoValue;
  }

  static cmdType = 'MoveCompsCommand';

  execute() {
    // 执行数据更新

    this.els
      .map((el) => ({ el, coord: this.coordsCompMap[el.key] ?? this.undoValue[el.key] }))
      .forEach(({ el, coord: [x, y] }) => this.updateAttr(el, 'transform', `translate(${x}px, ${y}px)`));
  }

  undo() {
    // 撤销数据更新

    this.els.forEach((el) => this.updateAttr(el, 'transform', this.undoValue[el.key]));
  }
}
