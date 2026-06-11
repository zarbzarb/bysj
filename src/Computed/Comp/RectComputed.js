import { formatPosition as formatTransform } from '@/utils/analysis';
import { getComponent, getGroupByChildKey } from '@/utils/configPageUtils';

function computedRectByItem(item) {
  let children = item.childComList;
  let l, t, r, b;
  children.forEach((child) => {
    let transform = formatTransform(child.styles.transform);
    let translateX = transform[0];
    let translateY = transform[1];
    if (l > translateX || l === undefined) {
      l = translateX;
    }
    if (t > translateY || t === undefined) {
      t = translateY;
    }
    let mostRight = parseInt(child.styles.width) + translateX;
    let mostBottom = parseInt(child.styles.height) + translateY;
    if (r < mostRight || r === undefined) {
      r = mostRight;
    }
    if (b < mostBottom || b === undefined) {
      b = mostBottom;
    }
  });
  let width = r - l;
  let height = b - t;
  let transform = formatTransform(item.styles.transform);
  // //左侧位移
  transform[0] = transform[0] + l;
  transform[1] = transform[1] + t;
  item.styles.width = width + 'px';
  item.styles.height = height + 'px';
  item.styles.transform = `translate(${transform[0]}px, ${transform[1]}px)`;

  children.forEach((child) => {
    let transform = formatTransform(child.styles.transform);
    transform[0] = transform[0] - l;
    transform[1] = transform[1] - t;
    child.styles.transform = `translate(${transform[0]}px, ${transform[1]}px)`;
    //避免组件二次渲染时，位置不对，强制使用jq设置值
    document.querySelector(`[data-type="console"] [data-key='${child.key}']`).style.transform = child.styles.transform;
  });
}

export const computedRectByChild = (key) => {
  //拖拽后从新计算当前父组件的宽高
  let item = getComponent(key);
  let itemParent = getGroupByChildKey(key);

  if (item) {
    computedRectByItem(item);
  }

  if (itemParent) {
    computedRectByItem(itemParent);
  }
};
