import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Tree } from 'antd';
import useSize from '@/hooks/useSize.js';
import s from './index.less';

function Left(props) {
  const { data, onSelect, selectedKeys } = props;
  const [treeData, setTreeData] = useState([]);
  const treeWrapRef = useRef();
  const { height } = useSize(treeWrapRef);

  const changeData = useCallback((d) => {
    let result = [];
    result = d.map((item) => {
      item.title = item.category || item.name;
      item.key = item.id;
      if (Array.isArray(item.children)) {
        d.children = changeData(item.children);
      }
      return item;
    });
    return result;
  }, []);

  useEffect(() => {
    const newTreeData = changeData(data);
    if (Array.isArray(newTreeData) && newTreeData.length > 0) newTreeData[0].key = -1; // 可能是空数组
    setTreeData(newTreeData);
  }, [data, changeData]);
  return (
    <div className={s.left}>
      <div className={s.title}>
        <span>分类</span>
      </div>
      <div ref={treeWrapRef} className={s.treeWrap}>
        <Tree treeData={treeData} selectedKeys={selectedKeys} height={height - 20} onSelect={onSelect} />
      </div>
    </div>
  );
}

export default Left;
