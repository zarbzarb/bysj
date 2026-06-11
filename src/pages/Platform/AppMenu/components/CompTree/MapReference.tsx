import React, { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react';
// import { message } from 'antd';
import { useStore } from '@/hooks';
import ComponentLayer from './ComponentLayer';

type IProps = {
  selectedKeys?: any[]; // 选中组件
  changeInstance?: (evt: any, item: any) => void; // 选中组件
};

const MapReference: React.FC<IProps> = (props) => {
  const {
    pageTreeStore: { currentMapComponentList, getMapReferenceList },
    pageTabsStore: { selectedKey },
  } = useStore();
  const { changeInstance, selectedKeys } = props;

  useEffect(() => {
    getMapReferenceList(selectedKey);
  }, [selectedKey]);
  return (
    <>
      {currentMapComponentList.map((item: any, key: number) => {
        return (
          <ComponentLayer
            changeInstance={changeInstance}
            item={item}
            key={item.key}
            keyIndex={key}
            selectedKeys={selectedKeys}
          />
        );
      })}
    </>
  );
};

export default observer(MapReference);
