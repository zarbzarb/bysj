/**
 *
 * @param {any[]} eventSettings
 * @param {number | string} parentIdx
 * @param {number | string} idx
 * @returns
 */
export const getCurrentAction = (eventSettings, parentIdx, idx) => {
  // 1. 当前操作的事件
  const event = eventSettings[parentIdx];
  // 2. 当前操作的事件组
  const currentActionGroup = event.groups[event.activeIdx];
  // 3. 当前操作的动作
  const currentAction = currentActionGroup.actions[idx];
  return currentAction ?? {};
};
/**
 *
 * @param {any[]} eventSetings
 * @param {number | string} parentIdx
 * @param {number | string} idx
 * @param {any} action
 */
export const setCurrentAction = (eventSettings, parentIdx, idx, action) => {
  // 1. 当前操作的事件
  const event = eventSettings[parentIdx];
  // 2. 当前操作的事件组
  const currentActionGroup = event.groups[event.activeIdx];
  // 3. 重新赋值当前动作
  currentActionGroup.actions[idx] = action;
};

export const transformGroupOptions = (options) => {
  const order = ['地图', '查询', '地图编辑', '工具', '效果', '其他'];
  // 创建一个空对象，用于存储分组后的数据
  const groupedData = {};

  // 根据 "groupName" 属性将数据分组
  options.forEach((um) => {
    if (!groupedData[um.groupName]) {
      groupedData[um.groupName] = [];
    }
    groupedData[um.groupName].push(um);
  });

  // 将一维数组转换为二维数组
  const result = order.map((groupName) => {
    return {
      title: groupName,
      options: groupedData[groupName],
    };
  });
  // console.log('result', result);
  return result;
};
