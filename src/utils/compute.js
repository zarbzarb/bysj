import $ from 'jquery';
import { matrixToArr } from './analysis';

/**
 * 计算多个元素是否包含在此坐标内部
 */
export const computeIsWrapper = (list, coordinate, zoom = 1) => {
  let { matrix } = coordinate;
  if (!matrix) {
    return [];
  }

  matrix[4] -= 80;
  matrix[5] -= 80;

  matrix = matrix.map((vl) => {
    return Number.parseInt(vl / zoom);
  });
  matrix[4] += 80;
  matrix[5] += 80;

  const boundaryX = 80;
  const boundaryY = 80;
  let boxWidth = coordinate.w;
  let boxHeight = coordinate.h;

  boxWidth = Number.parseInt(boxWidth / zoom);
  boxHeight = Number.parseInt(boxHeight / zoom);

  const leftTopCorner = [matrix[4] - boundaryX, matrix[5] - boundaryY];

  const rightBottomCorner = [matrix[4] + boxWidth - boundaryX, matrix[5] + boxHeight - boundaryY];
  return list
    .filter((item) => {
      if (item[2] === undefined) {
        return false;
      }

      const x1 = item[2][4];
      const x2 = item[2][4] + item[0];
      const y1 = item[2][5];
      const y2 = item[2][5] + item[1];

      if (rightBottomCorner[0] < x1) {
        return false;
      }
      if (leftTopCorner[0] > x2) {
        return false;
      }
      if (rightBottomCorner[1] < y1) {
        return false;
      }
      if (leftTopCorner[1] > y2) {
        return false;
      }
      return true;
    })
    .map((vl) => {
      return vl[3];
    });
};

export const comInSelectBox = (boxEl, comElList, zoom = 1) => {
  const selectBox = {
    w: boxEl.width(),
    h: boxEl.height(),
    matrix: matrixToArr(boxEl.css('transform')),
  };
  const dataList = [];
  comElList.each((i, vl) => {
    const el = $(vl);
    dataList.push([el.width(), el.height(), matrixToArr(el.css('transform')), el.attr('data-key')]);
  });
  const result = computeIsWrapper(dataList, selectBox, zoom);
  return result;
};

/**
 *
 * @param {string} str
 * @returns {[number, number]}
 */
export function mapGetMatrix(str) {
  let arr = str
    .replace(/\s+/gi, ' ')
    .split(' ')
    .map((vl) => {
      const num = vl.replace(/\D/gi, '');
      return Number.parseInt(num);
    });
  if (arr.length === 6) {
    arr = [arr[4], arr[5], 1];
  }
  return arr.filter((vl) => {
    const value = Number.parseInt(vl);
    return !Number.isNaN(value);
  });
}

/**
 *
 * @param {*} "translate(61px, 147px )"
 * @returns
 */
export function mapGetMatrixCopy(translate) {
  const regex = /translate\s*\(\s*([^\s,]*?)px,\s*([^\s,]*?)px\s*\)/;
  const result = regex.exec(translate) || [];
  // const left = result[1];
  // const top = result[2];
  const [_, ...res] = result;
  return res.map((i) => Number.parseInt(i));
}

export function getTransformByMatrix(translateString) {
  let matrix = translateString.match(/matrix(3d)?\((.+?)\)/);
  const is3D = matrix && matrix[1];
  if (matrix) {
    matrix = matrix[2].split(',');
    if (is3D === '3d') matrix = matrix.slice(12, 15);
    else {
      matrix.push(0);
      matrix = matrix.slice(4, 7);
    }
  } else {
    matrix = [0, 0, 0];
  }
  const result = {
    x: Number.parseFloat(matrix[0]),
    y: Number.parseFloat(matrix[1]),
    z: Number.parseFloat(matrix[2]),
  };
  return result;
}

/**
 *
 * @param {*} list
 * @returns {{
 *   initSize: {
 *       width: number;
 *       height: number;
 *   };
 *   left: number;
 *   top: number;
 *   width: string;
 *   height: string;
 *   transform: string;
 * }}
 */
export const groupPosition = (list) => {
  let left;
  let top;
  let w;
  let h;

  list.forEach((vl, i) => {
    let width = Number.parseInt(vl.styles.width);
    let height = Number.parseInt(vl.styles.height);

    const transform = mapGetMatrix(vl.styles.transform);

    if (left === undefined) {
      left = transform[0];
    } else if (left > transform[0]) {
      left = transform[0];
    }

    if (top === undefined) {
      top = transform[1];
    } else if (top > transform[1]) {
      top = transform[1];
    }
    width = transform[0] + width;
    height = transform[1] + height;
    if (w === undefined) {
      w = width;
      h = height;
    }
    if (width > w) {
      w = width;
    }
    if (height > h) {
      h = height;
    }
  });

  const width = w - left;
  const height = h - top;

  const obj = {
    initSize: {
      width,
      height,
    },
    left,
    top,
    width: `${width}px`,
    height: `${height}px`,
    transform: `translate(${left}px, ${top}px)`,
  };
  return obj;
};

const includeThisPosition = (position, x, y) => {
  if (x < position.matrix[4]) {
    return false;
  }
  if (x > position.matrix[4] + position.w) {
    return false;
  }
  if (y < position.matrix[5]) {
    return false;
  }
  if (y > position.matrix[5] + position.h) {
    return false;
  }
  return true;
};

// 复制新元素偏移位置
export const deviationPosition = (list) => {
  return list.map((vl) => {
    const transform = mapGetMatrix(vl.styles.transform).splice(0, 3);
    transform[0] += 20;
    transform[1] += 20;
    transform[2] = transform[2] ? transform[2] : 0;
    vl.styles.transform = `translateX(${transform[0]}px) translateY(${transform[1]}px) rotate(${transform[2]}deg)`;
    return vl;
  });
};

/** 点击是否选中子节点信息 */
export const changeGroupChild = (x, y, el, callBack) => {
  const children = el.find('.com-container');
  let $el;
  children
    .filter((i, item) => {
      const $el1 = $(item);
      const position = {
        w: $el1.width(),
        h: $el1.height(),
        matrix: matrixToArr($el1.css('transform')),
      };
      const bool = includeThisPosition(position, x, y);
      return bool;
    })
    .each((i, vl) => {
      if (!$el) {
        $el = $(vl);
      } else if ($el && $el.attr('data-index') < $(vl).attr('data-index')) {
        $el = $(vl);
      }
    });

  if ($el) {
    if (callBack) {
      callBack($el.attr('data-key'));
    }
    return $el;
  }
};

export const getCompOffset = (comp) => {
  const [thisL, thisT] = mapGetMatrix(comp.styles.transform);

  if (!comp.groupKey) return [thisL, thisT];
  const parent = DataI.getComponentByKey(comp.groupKey);
  if (!parent) return [thisL, thisT];

  const [parentL, parentT] = getCompOffset(parent);

  return [thisL + parentL, thisT + parentT];
};
