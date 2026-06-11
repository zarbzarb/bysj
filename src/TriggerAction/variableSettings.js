import { message } from 'antd';
import { setStoreData, getDataByKey } from '@/utils/dataStoreUtils';
import { babelTransform2 } from '@/utils/utils';

export default (action, settings) => {
  const { value, variable } = action.actionSettings;
  const { expressionValue } = settings;
  if (!variable) {
    message.error('请先完善变量值绑定！');
    return;
  }

  let expression = value;
  if (!expression.includes('return')) {
    expression = `return ${expression}`;
  }

  try {
    const data = getDataByKey(variable); // 根据key获取全局变量的值
    const result = babelTransform2(expression, data, expressionValue); // 运行时ES6转ES5
    setStoreData(variable, result); // 更新全局存储的变量数据
  } catch (error) {
    console.error(error);
  }
};
