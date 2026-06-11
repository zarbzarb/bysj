/**
 * 指标目录数据转 treeData 结构
 * @param {*} catalogs  目录数据
 * @param {*} parentKey 上级节点 key
 * @returns treeData
 */
export function catalogsToTreeData(catalogs, parentKey = '') {
  return catalogs.map((v) => {
    const key = parentKey ? `${parentKey}-${v.id}` : String(v.id);
    return {
      key,
      title: v.friendlyName || v.name,
      children: v.children ? catalogsToTreeData(v.children, key) : null,
      selectable: v.type === 2, // type 1为目录，2为叶子节点
      checkable: v.type === 2,
      isLeaf: v.type === 2,
      id: v.id,
      name: v.name,
      parentKey,
      type: v.type,
      indicatorDimensions: v.indicatorDimensions
        ? v.indicatorDimensions
            .map((d) => d.id)
            .sort()
            .join('-')
        : null,
    };
  });
}

/**
 * 获取过滤之后的 treeData
 * @param {*} treeData 树数据
 * @param {*} query    搜索文本
 * @param {*} expandedKeysSet 展开节点集合
 * @returns treeData
 */
export function getFilteredTreeData(treeData, query, expandedKeysSet) {
  return treeData
    .map((node) => {
      if (node.type === 2) {
        if (node.title.includes(query)) {
          expandedKeysSet.add(node.parentKey);
          return node;
        }
        return null;
      }

      return {
        ...node,
        children: node.children ? getFilteredTreeData(node.children, query, expandedKeysSet) : [],
      };
    })
    .filter((item) => {
      if (item) {
        return item.type === 2 ? true : item.children.length > 0;
      }
      return false;
    });
}
