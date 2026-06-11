export const matrixToTranslate = (translate) => {
  if (translate.indexOf('matrix') < 0) return [1, 0, 0, 1, 0, 0];
  let arr = translate
    .replace(/[^?!-\d,]/gi, '')
    .split(',')
    .map((vl) => parseInt(vl));

  return arr;
};
