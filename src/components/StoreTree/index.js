import React, { useCallback, useMemo, forwardRef, useState, useEffect } from 'react';
import { TreeSelect } from 'antd';
import { observer, inject } from 'mobx-react';
import { useStore } from '@/hooks';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';

const { TreeNode } = TreeSelect;

function StoreTree(props, ref) {
  const { globalStore } = useStore();
  const { value, onChange, id, ...otherProps } = props;
  const [storeTree, setStoreTree] = useState(window.dataStore);

  useEffect(() => {
    if (window.dataStore === undefined) {
      window.dataStore = [];
    }
    const storeTree = [...window.dataStore];

    setStoreTree(storeTree);
  }, [globalStore.globalDataStoreCount]);
  const renderFun = useCallback((data, disabled) => {
    if (data == undefined) {
      data = [];
    }
    return data.map(({ name, key, children }) => (
      <TreeNode value={key} key={key} title={name} disabled={disabled}>
        {Array.isArray(children) ? renderFun(children, false) : null}
      </TreeNode>
    ));
  }, []);
  const treeRender = useMemo(() => renderFun(storeTree, true), [renderFun, storeTree]);
  return (
    <TreeSelect
      suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
      showSearch
      style={{ width: '100%' }}
      value={value}
      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
      placeholder='请选择'
      treeDefaultExpandAll
      treeNodeFilterProp='title'
      // getPopupContainer={(triggerNode) => triggerNode.parentNode}
      {...otherProps}
      onChange={onChange}
    >
      {treeRender}
    </TreeSelect>
  );
}

// export default inject((stores) => ({
//   count: stores.CommonStore.globalDataStoreCount
// }))(observer(forwardRef(StoreTree)));

export default observer(forwardRef(StoreTree));
