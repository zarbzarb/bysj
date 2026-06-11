import $ from 'jquery';

export const DragEndPosition = (position) => {
  // let selector = `[data-type="drawconsole"]`;
  let drawSelector = `[data-type="console"]`;
  let centerSelector = `.dataq-edit-console-container`;
  // let scrollSelect = '[data-type="scroll-container"]>div:eq(0)';
  let offset = $(centerSelector).offset();
  // let scrollOffset = $(scrollSelect).offset();
  let drawOffset = $(drawSelector).offset();
  let drawX = offset.left;
  let drawY = offset.top;
  // x、y轴移动不到中间画布，取消拖拽添加组件
  if (position.x < drawX) {
    return;
  }
  //获取画布距离左侧位置的空隙 (后续要配合上zoom一起使用)
  let left = drawOffset.left - offset.left;
  let top = drawOffset.top - offset.top;
  let x = position.x - drawX - left;
  let y = position.y - drawY - top;
  return [parseInt(x), parseInt(y)];
};

export const DrawScrollPosition = (position) => {
  // let selector = `[data-type="drawconsole"]`;
  // let drawSelector = `[data-type="console"]`;
  // let centerSelector = `.dataq-edit-console-container`;
  let scrollSelect = '[data-type="scroll-container"]>div:eq(0)';
  let drawEl = $(scrollSelect);
  // let offset = $(centerSelector).offset();
  // let scrollOffset = $(scrollSelect).offset();
  // let drawOffset = $(drawSelector).offset();

  if (drawEl.length === 0) return [80, 80];

  //获取当前画布位置
  let x = drawEl[0].scrollLeft + 80;
  let y = drawEl[0].scrollTop + 80;
  return [x, y];
};
