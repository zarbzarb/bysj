import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { getApiList, getInterfaceTree } from '@/services/apis/dataManage';
import useSize from '@/hooks/useSize.js';
import _ from 'lodash';
import { Input, Tree } from 'antd';
import { flatChildrenForNode, getParentKey } from '@/utils/utils';
import s from './index.less';

const { Search } = Input;

function Left(props) {
  const { data, setSelectedKeys, selectedKeys, setCurrentApi, refreshApiInfo } = props;
  const [treeData, setTreeData] = useState([]);
  // 判断是否搜索状态
  const [isSearchState, setIsSearchState] = useState(false);
  // 搜索数据
  const [searchTreeData, setSearchTreeData] = useState([]);
  // 是否自动展开父节点
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  // （受控）展开指定的树节点
  const [expandedKeys, setExpandedKeys] = useState([]);
  const treeWrapRef = useRef();
  const { height } = useSize(treeWrapRef);

  // 生成树
  const changeData = useCallback((d) => {
    let result = [];
    result = d.map((item) => {
      item.title = item.interfaceName || item.category || item.name;
      item.key = item.id;
      item.isLeaf = item.interfaceName ? !item.children : false;
      // item.isLeaf = false; // 一级分类目录强制为父节点
      item.selectable = false;
      d.children = Array.isArray(item.children) ? changeData(item.children) : [];
      return item;
    });
    return result;
  }, []);

  // 更新树 list 之前的数据 key 加载分类节点 该节点的children
  const updateTreeData = (list, key, children) =>
    list.map((node) => {
      // 修改加载分类，添加子节点
      if (node.key === key && !node.loaded) {
        node.loaded = true;
        const newChildren = (node.children || []).concat(children || []);
        return { ...node, children: newChildren };
      }
      // 递归处理子孙节点
      if (node.children) {
        return {
          ...node,
          children: updateTreeData(node.children, key, children),
        };
      }
      return node;
    });

  // 异步加载数据 分类懒加载， 节点key， 节点children
  const onLoadData = (prop) => {
    console.log('prop', prop);
    const { key, children, loaded } = prop;
    return new Promise((resolve) => {
      if (loaded) {
        // 已经获取子节点，直接返回
        resolve();
        return;
      }
      // 获取分类子节点
      getApiList({
        categoryId: key,
        pageSize: 100,
        currentPage: 1,
      }).then((res) => {
        // 分类下的接口节点
        const { records } = res.data;

        // 接口节点数据转化
        const apis = records
          .filter((node) => node.status)
          .map((node) => {
            return {
              key: node.id,
              title: node.interfaceName,
              isLeaf: true, // children不存在时为叶子节点
              loaded: true,
              ...node,
            };
          });
        setTreeData((origin) => updateTreeData(origin, key, apis));
        resolve();
      });
    });
  };

  // 依据接口id获取接口信息
  const getCurrentApi = (list, apiId) => {
    let currentApi = null;
    const loop = (list) => {
      for (const node of list) {
        if (node.id === apiId) {
          currentApi = node;
          break;
        }
        if (Array.isArray(node.children)) {
          loop(node.children);
        }
      }
    };
    loop(list);
    return currentApi;
  };

  // 生成树
  const changeNewData = useCallback((d) => {
    let result = [];
    result = d.map((item) => {
      item.title = item.type == 2 ? item.interfaceName : item.categoryName;
      item.key = item.type == 2 ? item.id : item.categoryId;
      item.isLeaf = item.type == 2;
      item.selectable = item.type == 2;
      d.children = Array.isArray(item.children) ? changeNewData(item.children) : [];
      return item;
    });
    return result;
  }, []);

  // 展开树节点
  const onExpand = (newExpandedKeys) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };

  // 搜索树
  const onSearchTree = (e) => {
    let { value } = e.target;
    value = _.trim(value);
    if (value) {
      // 获取分类子节点
      getInterfaceTree({
        interfaceName: value,
      }).then((res) => {
        // 分类下的接口节点
        const newSearchTreeData = changeNewData(res.data || []);
        let dataList = newSearchTreeData;
        if (newSearchTreeData.some((i) => !!i.children)) {
          dataList = flatChildrenForNode(newSearchTreeData);
        }
        const newExpandedKeys = dataList
          .map((item) => {
            if (item.title && item.title.includes(value)) {
              const parentKey = getParentKey(item.key || item.id, newSearchTreeData);
              return parentKey;
            }
            return null;
          })
          .filter((item, i, self) => item && self.indexOf(item) === i);
        setIsSearchState(true);
        setSearchTreeData(newSearchTreeData);
        setExpandedKeys(newExpandedKeys);
        setAutoExpandParent(true);
      });
    } else {
      setExpandedKeys([]);
      setIsSearchState(false);
      setAutoExpandParent(false);
    }
  };

  // 添加防抖动
  const handleSearchTree = _.debounce(onSearchTree, 300);

  //  处理选择节点
  const handleSelect = useCallback(
    (keys) => {
      const apiId = keys[0];
      const list = isSearchState ? searchTreeData : treeData;
      const current = getCurrentApi(list, apiId);
      setCurrentApi(current);
      setSelectedKeys(keys);

      if (!isSearchState && current?.interfaceCode) {
        refreshApiInfo(current.interfaceCode);
      }
    },
    [refreshApiInfo, isSearchState, searchTreeData, setCurrentApi, setSelectedKeys, treeData],
  );

  // 数据转化为树
  useEffect(() => {
    const newTreeData = changeData(data);
    setTreeData(newTreeData);
  }, [data, changeData]);

  return (
    <div className={s.left}>
      <div className={s.title}>
        <span>分类</span>
      </div>
      <Search
        allowClear
        size='default'
        className={s.searchInput}
        placeholder='请输入接口名称搜索'
        onChange={handleSearchTree}
      />
      <div ref={treeWrapRef} className={s.treeWrap}>
        <Tree
          treeData={isSearchState ? searchTreeData : treeData}
          loadData={onLoadData}
          selectedKeys={selectedKeys}
          onExpand={onExpand}
          expandedKeys={expandedKeys}
          autoExpandParent={autoExpandParent}
          height={height - 20}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}

export default memo(Left);
