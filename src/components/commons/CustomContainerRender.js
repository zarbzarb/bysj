import React, { useState, useRef } from 'react';
import { haveChildByKey } from '@/Computed/Comp/ConditionComputed';
import GroupInGroupType from '@/pages/Platform/Components/GroupInGroupType';
import GroupChildComponentType from '@/pages/Platform/Components/GroupChildComponentType';
import { observer } from 'mobx-react';
import { useStore } from '@/hooks';

const indexMax = 9999; // 创建的图层层级从这个数字开始递减
const CustomContainerRender = (props) => {
  const ref = useRef({ dataset: { moveState: '' } });
  // const hasInsRef = useRef(false);
  // const [preAttr, setPreAttr] = useState();
  // const [moved, changeMoved] = useState(false);
  const { item, zIndex, parentInvisibility, count } = props;
  const { layerStore, editorStore: store, globalStore } = useStore();
  const config = globalStore.screenConfig;
  let computedZIndex = zIndex;
  if (layerStore.activeLayerId == item.layerId) {
    computedZIndex += 1000;
  }

  const isDisabled = !store.changeKeys.includes(item.key) || item.comLock;
  const isHaveChildChange = haveChildByKey(item.childComList, store.changeKeys);

  let className = 'group ';
  if (!isDisabled) className += 'change';
  if (isHaveChildChange) className += 'active';
  // let visibility = item.comInvisible ? 'hidden' : 'visible';
  // // 父组件隐藏，子组件也隐藏
  // if (parentInvisibility) {
  //   visibility = 'hidden';
  // }
  // let invisibility = visibility == 'hidden' ? true : false;

  const otherProps = { config };
  if (props.consoleRef) {
    otherProps.consoleRef = props.consoleRef;
  }
  if (props.filterStyle) {
    otherProps.filterStyle = props.filterStyle;
  }

  return (
    <div style={{ pointerEvents: 'all' }}>
      {item.childComList?.map((child, idx) => {
        const isDisabled = !store.changeKeys.includes(child.key);
        const ContainerRenderType = child.classType === 'group' ? GroupInGroupType : GroupChildComponentType;
        return (
          <ContainerRenderType
            parent={ref}
            parentItem={item}
            disabled={isDisabled}
            zIndex={indexMax - idx}
            // parentInvisibility={invisibility ? invisibility : child.comInvisible}
            key={child.key}
            item={child}
            count={count}
            {...otherProps}
          />
        );
      })}
    </div>
  );
};

export default observer(CustomContainerRender);
