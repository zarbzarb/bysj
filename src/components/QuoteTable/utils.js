import { get, post } from '@/services/xhr/fetch';

export const allTypesFetch = {
  get,
  post,
};

export const stringToFun = (funS, dft) => {
  return Function(
    'data',
    `
    try {
      ${funS}
    } catch (error) {
      console.error(error, '函数错误error');
      return (${dft})(data);
    }
    
  `,
  );
};

/**
 * const get = (url, data) => {
  return ajax({
    url: url,
    type: 'get',
    data: data
  });
};

const post = (url, data) => {
  return ajax({
    url: url,
    type: 'post',
    data: data
  });
};
 */
