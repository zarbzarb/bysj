import React, { Fragment, useState, useEffect, memo } from 'react';
import { useStore } from '@/hooks';
import { inject, observer } from 'mobx-react';
import Left from './Left';
import Right from './Right';

function DataVariable(props) {
  const { globalStore: store, editorStore } = useStore();
  const { parentStyle } = props;
  const [groupIdx, setGroupIdx] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [searchGroupName, setSearchGroupName] = useState(''); // 搜索组名

  const forceUpdate = () => {
    setRefresh(refresh + 1);
    editorStore.forceUpdateAttr();
  };
  useEffect(() => {
    if (store.variableName) {
      const containedList = window.dataStore.map((group) => {
        const filterByGroupName = searchGroupName ? group.name.includes(searchGroupName) : true;
        const filterByVariableName =
          group.children &&
          group.children.some((item) => {
            return item.name.includes(store.variableName) || item.key === store.variableName;
          });
        return filterByGroupName && filterByVariableName ? 'true' : 'false';
      });
      if (groupIdx === -1 || containedList[groupIdx] === 'false') {
        const firstIdx = containedList.indexOf('true');
        setGroupIdx(firstIdx);
      }
    } else if (
      store.variableName === '' && // v8.12 搜索关键词为空字符串时，groupIdx设为默认值
      groupIdx === -1
    ) {
      setGroupIdx(0);
    }
  }, [store.variableName, groupIdx, searchGroupName]);
  return (
    <>
      <div className={parentStyle.leftWrap}>
        <Left
          setRefresh={forceUpdate}
          groupIdx={groupIdx}
          setGroupIdx={setGroupIdx}
          searchGroupName={searchGroupName}
          setSearchGroupName={setSearchGroupName}
          {...props}
        />
      </div>
      <div className={parentStyle.rightWrap}>
        <Right refresh={refresh} groupIdx={groupIdx} {...props} />
      </div>
    </>
  );
}
export default memo(observer(DataVariable));
