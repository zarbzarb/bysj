import { SUPPORT_REMOTE_EVENTS } from '@/utils/constant';

/**
 * 解析页面列表树数据
 * @param {array} treeData 原始树数据
 * @returns
 */
export function parsePageTreeData(treeData = []) {
  const loop = (tree) => {
    return tree.map((item) => {
      const obj = {
        label: item.name,
        value: item.appPageId,
        disabled: item.type === 0, // 文件夹
      };
      return item.children?.length
        ? {
            ...obj,
            children: loop(item.children),
          }
        : obj;
    });
  };

  return loop(treeData);
}

/**
 * 解析页面配置数据
 * @param {object} jsonConfig 页面配置
 */
export function parsePageJsonConfig(jsonConfig) {
  const eventCache = {};

  const loop = (data, parentPath = '') => {
    const res = [];
    data.forEach((item) => {
      const obj = {
        label: item.name || item.compName,
        value: item.key,
        layerId: item.layerId,
        children: [],
        disabled: true,
      };
      const path = parentPath ? `${parentPath}/${obj.label}` : `${item.layerName}/${obj.label}`;
      if (item.classType !== 'group') {
        SUPPORT_REMOTE_EVENTS.forEach((event) => {
          if (item.eventSetings.some((v) => v.eventType === event.value && v.isActive)) {
            const node = {
              label: event.label,
              value: `${item.key}__${event.value}`,
              path: `${path}/${event.label}`,
            };
            obj.children.push(node);
            eventCache[node.value] = node;
          }
        });
      }
      // 展开组
      if (item.childComList && item.classType === 'group') {
        obj.children = loop(item.childComList, path);
      }
      if (obj.children.length > 0) {
        res.push(obj);
      }
    });
    return res;
  };

  const data = JSON.parse(jsonConfig);
  const { componentList, pageConfig } = data;
  const layerList = pageConfig?.layerConfig?.layers || [];

  let compList = componentList.map((item) => ({
    ...item,
    layerName: layerList.find((v) => v.layerId === item.layerId)?.layerName || '',
  }));
  compList = loop(compList);

  const map = {};
  compList.forEach((item) => {
    if (!map[item.layerId]) map[item.layerId] = [];
    map[item.layerId].push(item);
  });

  const treeData = layerList.map((item) => ({
    label: item.layerName,
    value: item.key,
    children: map[item.layerId],
    disabled: true,
  }));

  return {
    treeData,
    eventCache,
  };
}
