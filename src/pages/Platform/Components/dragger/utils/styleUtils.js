// import { matrixToTranslate } from './matrixUtils';
/* getComputedStyle获取DOM属性比较精确，但是会触发重排
  由于没有使用外部样式，可以使用style替换
*/

import { formatPosition } from '@/utils/analysis';

// v7.7 重复实现重定向至 src/utils/transformUtils.js,
// 请从原始实现处引入
// export const formatPosition = sourceFormatPosition;

export const getWidth = (dom) => {
  return Number.parseInt(dom.style.width);
  // return parseInt(getComputedStyle(dom).width);
};

export const getHeight = (dom) => {
  return Number.parseInt(dom.style.height);
  // return parseInt(getComputedStyle(dom).height);
};

export const getTransform = (dom) => {
  if (!dom || dom.nodeType !== 1) return [0, 0, 0, 0, 0, 0, 0];

  // getComputedStyle.transform 触发重排
  // return matrixToTranslate(getComputedStyle(dom).transform);
  const translate = formatPosition(dom.style.transform);
  return [1, 0, 0, 1, translate[0], translate[1]];
};

export const setTranslateX = (dom, x) => {
  const transform = getTransform(dom);
  transform[4] -= x;
  dom.style.transform = `translate(${transform[4]}px, ${transform[5]}px )`;
};

export const setTranslateY = (dom, y) => {
  const transform = getTransform(dom);
  transform[5] -= y;
  dom.style.transform = `translate(${transform[4]}px, ${transform[5]}px )`;
};

export const setTransform = (dom, x, y) => {
  dom.style.transform = `translate(${x}px, ${y}px )`;
};

export const getWidthWithTranslateX = (dom) => {
  return getWidth(dom) + getTransform(dom)[4];
};

export const getHeightWidthTranslateY = (dom) => {
  return getHeight(dom) + getTransform(dom)[5];
};

export const computedRect = (dom) => {
  // 拖拽后从新计算当前父组件的宽高
  const nodes = dom.children;
  let node = [...nodes].filter((vl) => vl.classList.contains('dragger-real-container'));
  if (node.length === 0) {
    return;
  }
  node = node[0];
  const children = [...node.children];

  let deviationX = 0;
  let deviationY = 0;
  let maxWidthWithTranslateX = 0;
  let maxHeightWithTranslateY = 0;

  children.forEach((child) => {
    const transform = getTransform(child);
    const widthVal = getWidthWithTranslateX(child);
    const heightVal = getHeightWidthTranslateY(child);
    if (widthVal > maxWidthWithTranslateX) {
      maxWidthWithTranslateX = widthVal;
    }
    if (heightVal > maxHeightWithTranslateY) {
      maxHeightWithTranslateY = heightVal;
    }
    if (deviationX > transform[4]) deviationX = transform[4];
    if (deviationY > transform[5]) deviationY = transform[5];
  });
  let w = getWidth(dom);
  let h = getHeight(dom);
  const transform = getTransform(dom);
  let isChange;
  if (deviationX < 0) {
    w -= deviationX;
    transform[4] += deviationX;
    isChange = true;
  }
  if (deviationY < 0) {
    h -= deviationY;
    transform[5] += deviationY;
    isChange = true;
  }
  if (w < maxWidthWithTranslateX) {
    w = maxWidthWithTranslateX;
  }
  if (h < maxHeightWithTranslateY) {
    h = maxHeightWithTranslateY;
  }
  dom.style.width = `${w}px`;
  dom.style.height = `${h}px`;
  setTransform(dom, transform[4], transform[5]);
  if (isChange) {
    // update parent react by child rect and transform value
    // 根据子组件的宽高， 更新父元素的宽高及位移
    children.forEach((child) => {
      if (deviationX < 0) {
        setTranslateX(child, deviationX);
      }
      if (deviationY < 0) {
        setTranslateY(child, deviationY);
      }
    });
  }
};

export const computedRectByChild = (dom) => {
  // 拖拽后从新计算当前父组件的宽高
  const nodes = dom.children;
  let node = [...nodes].filter((vl) => vl.classList.contains('dragger-real-container'));
  if (node.length === 0) {
    return;
  }
  node = node[0];
  const children = [...node.children];
  let l;
  let t;
  let r;
  let b;
  children.forEach((child) => {
    const transform = getTransform(child);
    const translateX = transform[4];
    const translateY = transform[5];
    if (l > translateX || l === undefined) {
      l = translateX;
    }
    if (t > translateY || t === undefined) {
      t = translateY;
    }
    const mostRight = getWidth(child) + translateX;
    const mostBottom = getHeight(child) + translateY;
    if (r < mostRight || r === undefined) {
      r = mostRight;
    }
    if (b < mostBottom || b === undefined) {
      b = mostBottom;
    }
  });
  const width = r - l;
  const height = b - t;
  const currentTransform = getTransform(dom);
  // 左侧位移
  currentTransform[4] += l;
  currentTransform[5] += t;
  dom.style.width = `${width}px`;
  dom.style.height = `${height}px`;
  setTransform(dom, currentTransform[4], currentTransform[5]);
  children.forEach((child) => {
    const transform = getTransform(child);
    transform[4] -= l;
    transform[5] -= t;
    setTransform(child, transform[4], transform[5]);
  });
};

export const computedChangeValue = (oldItem, newItem) => {
  const width = oldItem.width - newItem.width;
  const height = oldItem.height - newItem.height;
  let changeRect = {
    width,
    height,
    x: 0,
    y: 0,
  };

  try {
    oldItem.transform = oldItem.transform.split(',');
    const x = newItem.transform[4] - oldItem.transform[4];
    const y = newItem.transform[5] - oldItem.transform[5];
    changeRect = {
      width,
      height,
      x,
      y,
    };
  } catch {
    changeRect = {
      width,
      height,
      x: 0,
      y: 0,
      status: 'error',
    };
  }

  return changeRect;
};
