import shortid from 'short-uuid';

export const generateId = () => {
  return shortid.generate(); // 生成唯一的UUID
};

export const createKeyName = () => {
  return shortid.generate(); // 生成唯一的UUID
};
