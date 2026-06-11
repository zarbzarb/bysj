import _ from 'lodash';

export const transformAnalysis = (str) => {
  const emptyArr = [0, 0];
  if (!str.includes('translate')) {
    return [0, 0, 0];
  }

  const arr = str.replace('translate(', '').replace(')', '').replaceAll(/px/gi, '').split(',');
  if (arr[0] === 'NaN') {
    return emptyArr;
  }
  return arr[0] === 'NaN' ? emptyArr : [Number.parseInt(arr[0]), Number.parseInt(arr[1])];
};

export const matrixToTransform = (str) => {
  if (str.includes('matrix') && !str.includes('deg')) {
    str = str.replace('matrix(', '').replace(')', '').replaceAll(/\s/g, '');
    str = str.split(',');
    return `translateX(${str[4]}px) translateY(${str[5]}px) rotate(0deg)`;
  }
  return str;
};

type Matrix = [number, number, number, number, number, number];

/**
 * @example
 * const str = "matrix(1, 2, -1, 1, 80, 80)";
 * _.isEqual(
 *   matrixToArr(str),
 *   [1, 2, 1, 1, 80, 80],
 * )
 */
export const matrixToArr = (str: string): Matrix | null => {
  const PATTERN = /-?[\d.]+/g;

  if (str === '') return [1, 0, 0, 1, 0, 0];

  if (!str.includes('matrix')) return null;

  const arr = [...str.matchAll(PATTERN)].flat();

  if (arr.length !== 6) return null;

  return arr.map((i) => Number.parseFloat(i)) as Matrix;
};

/**
 * 解析出一个CSS变换矩阵中的坐标信息,
 * 当匹配失败返回 null
 * @returns [x, y]
 * @example
 * const str1 = "transform(0.43px, 20.2px)";
 * _.isEqual(formatPosition(str1), [0.43, 20.2]);
 *
 * const str2 = "matrix(1, 2, -1, 1, 80, 80);";
 * _.isEqual(formatPosition(str2), [80, 80]);
 */
export const formatPosition = (str: string): [number, number] => {
  const PATTERN = /-?[\d.]+/g;

  let arr: string[];

  if (str.includes('translate')) arr = [...str.matchAll(PATTERN)].flat();
  else if (str.includes('matrix') && !str.includes('deg')) arr = _.takeRight([...str.matchAll(PATTERN)].flat(), 2);
  else return [0, 0];

  // 处理 Firefox 省略写法: transform(10px) -> [10, 0]
  if (arr.length === 1) arr.push('0');

  if (arr.length !== 2) return [0, 0];

  return [Number.parseFloat(arr[0]), Number.parseFloat(arr[1])];
};

export const computedCompRect = (item) => {
  if (!item.styles) {
    return {
      position: 'absolute',
      width: '0px',
      height: '0px',
      transform: 'translate(0px, 0px)',
    };
  }

  return {
    position: 'absolute',
    width: item.styles.width,
    height: item.styles.height,
    transform: item.styles.transform,
  };
};
