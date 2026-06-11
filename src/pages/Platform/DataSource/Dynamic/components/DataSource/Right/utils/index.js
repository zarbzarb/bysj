export const strToJson = (str, key) => {
  let result = {};
  try {
    result = JSON.parse(str);
  } catch (error) {
    result = {};
    console.warn(key, 'JSON格式错误');
  }
  return result;
};
